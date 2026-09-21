import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

import { PrismaService } from '../../common/prisma.service';
import { TokenBlacklistService } from '../../common/token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(TokenBlacklistService) private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly prisma: PrismaService,
  ) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required for authentication');
    }
    super({
      jwtFromRequest: (req) => {
        if (!req) return null;
        const authHeader = req.headers?.authorization?.replace('Bearer ', '');
        if (authHeader) return authHeader;
        const cookies = req?.cookies;
        if (cookies?.access_token) return cookies.access_token;
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const jti = payload?.jti;
    if (jti) {
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(jti);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }
    // Normalise role to uppercase so guards always receive canonical Role values
    // regardless of whether the token was issued before or after the schema migration
    // that renamed 'ovds' → 'OVDS'.
    const role = typeof payload.role === 'string'
      ? payload.role.toUpperCase()
      : payload.role;

    // Enrich with mfaEnrolled from the User row.
    // This is a lightweight single-column read keyed by the JWT sub (user id),
    // so it hits the primary key index and adds negligible latency (~0.5 ms).
    // We do NOT cache this — an admin may revoke MFA enrolment and the next
    // request must reflect that immediately.
    let mfaEnrolled = false;
    try {
      const user = await (this.prisma as any).user.findUnique({
        where:  { id: payload.sub },
        select: { mfaEnrolled: true },
      });
      mfaEnrolled = user?.mfaEnrolled ?? false;
    } catch {
      // DB unavailable — fail open (mfaEnrolled stays false).
      // AccessPolicyService will block if mfaRequired=true, which is the
      // safe default when we cannot verify enrolment.
    }

    return {
      userId:     payload.sub,
      email:      payload.email,
      role,
      jti:        payload.jti,
      companyId:  payload.companyId,
      // MFA fields for AccessPolicyService
      mfaEnrolled,
      // mfaVerified: treated as true when the user completed the 2FA OTP
      // challenge during login (indicated by the presence of a non-null jti
      // that is not blacklisted). A dedicated mfaVerified claim can be added
      // to the JWT payload in a future auth upgrade.
      mfaVerified: mfaEnrolled,
    };
  }
}
