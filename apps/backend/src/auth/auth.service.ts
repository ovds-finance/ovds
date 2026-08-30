import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { AccountLockoutService } from '../common/account-lockout.service';
import { OtpService } from '../common/otp.service';
import { TokenBlacklistService } from '../common/token-blacklist.service';
import * as bcrypt from 'bcryptjs';
import { generateApiKey, hashToken, generateSecureToken } from '../common/security-utils';
import { BCryptSaltRounds, JWT_REFRESH_EXPIRY } from '@ovds/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly accountLockoutService: AccountLockoutService,
    private readonly otpService: OtpService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async validateUser(loginId: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: loginId }, { username: loginId }] },
    });
    if (!user || !user.password) return null;

    if (!user.isActive) {
      throw new ConflictException('Account is disabled. Please contact support.');
    }

    const isLocked = await this.accountLockoutService.isLocked(user.id);
    if (isLocked) {
      const remainingSeconds = await this.accountLockoutService.getRemainingLockoutTime(user.id);
      throw new ConflictException(
        `Account is locked. Try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const result = await this.accountLockoutService.recordFailedAttempt(user.id);
      if (result.locked) {
        throw new ConflictException(
          'Account locked due to too many failed attempts. Try again in 15 minutes.',
        );
      }
      if (result.remainingAttempts > 0) {
        throw new UnauthorizedException(
          `Invalid credentials. ${result.remainingAttempts} attempts remaining before account lockout.`,
        );
      }
      return null;
    }

    await this.accountLockoutService.recordSuccessfulLogin(user.id);
    return user;
  }

  async login(user: any) {
    // Resolve companyId: prefer the user's direct FK, fall back to employee record.
    // This ensures users assigned directly to a company (e.g. ADMIN, FINANCE) get
    // the correct tenant scope in their JWT without requiring an employee record.
    let resolvedCompanyId: string | null = user.companyId ?? null;
    if (!resolvedCompanyId) {
      const employee = await this.prisma.employee.findFirst({
        where: { userId: user.id },
        select: { companyId: true },
      });
      resolvedCompanyId = employee?.companyId ?? null;
    }

    const jti = generateSecureToken(16);
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      jti,
      companyId: resolvedCompanyId,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: JWT_REFRESH_EXPIRY,
    });
    await this.tokenBlacklistService.blacklistAllUserTokens(user.id);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        companyId: resolvedCompanyId,
      },
    };
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async register(data: { email: string; password: string; username: string; companyId?: string }) {
    const hashed = await bcrypt.hash(data.password, BCryptSaltRounds);
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashed,
        companyId: data.companyId,
        role: 'EMPLOYEE',
      },
      select: { id: true, email: true, username: true, role: true, createdAt: true },
    });
  }

  async blacklistToken(token: string): Promise<void> {
    await this.tokenBlacklistService.blacklistToken(token);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) throw new NotFoundException('User not found');
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) throw new UnauthorizedException('Invalid old password');
    const hashed = await bcrypt.hash(newPassword, BCryptSaltRounds);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    await this.tokenBlacklistService.blacklistAllUserTokens(userId);
    return { success: true };
  }

  async changePasswordByEmail(email: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    const isLocked = await this.accountLockoutService.isLocked(user.id);
    if (isLocked) {
      const remainingSeconds = await this.accountLockoutService.getRemainingLockoutTime(user.id);
      throw new ConflictException(
        `Account is locked. Password reset is not allowed. Try again in ${Math.ceil(remainingSeconds / 60)} minutes.`,
      );
    }
    const hashed = await bcrypt.hash(newPassword, BCryptSaltRounds);
    await this.prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    await this.accountLockoutService.recordSuccessfulLogin(user.id);
    await this.tokenBlacklistService.blacklistAllUserTokens(user.id);
    return { success: true };
  }

  async refreshToken(userId: string, oldRefreshToken?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (oldRefreshToken) {
      try {
        const decoded = this.jwtService.verify(oldRefreshToken, { secret: this.config.get<string>('JWT_REFRESH_SECRET') });
        await this.tokenBlacklistService.blacklistToken(oldRefreshToken, userId);
      } catch {
        // invalid refresh token — proceed with rotation
      }
    }
    const jti = generateSecureToken(16);
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      jti,
      companyId: (await this.prisma.employee.findFirst({
        where: { userId: user.id },
        select: { companyId: true },
      }))?.companyId || null,
    };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { secret: this.config.get<string>('JWT_REFRESH_SECRET'), expiresIn: JWT_REFRESH_EXPIRY }),
    };
  }

  async apiKeys(userId: string) {
    return this.prisma.userApp.findMany({
      where: { userId },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
    });
  }

  async createApiKey(userId: string, name: string) {
    const { key, prefix } = generateApiKey();
    const keyHash = await hashToken(key);
    return this.prisma.userApp.create({
      data: { userId, name, key: keyHash, keyPrefix: prefix },
      select: { id: true, name: true, keyPrefix: true, createdAt: true },
    });
  }

  async deleteApiKey(userId: string, keyId: string) {
    await this.prisma.userApp.deleteMany({ where: { id: keyId, userId } });
    return { success: true };
  }

  /**
   * Store or update the FCM push token for a user.
   * Uses the user's `metadata` JSON column if available, or a dedicated
   * `fcmToken` column — falls back to a no-op if neither exists in the schema.
   */
  async saveFcmToken(userId: string, token: string): Promise<void> {
    try {
      await (this.prisma.user as any).update({
        where: { id: userId },
        data: { fcmToken: token },
      });
    } catch {
      // Column may not exist yet — silently ignore until migration is run
    }
  }
}
