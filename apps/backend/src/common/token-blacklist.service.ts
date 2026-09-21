import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from './prisma.service';

@Injectable()
export class TokenBlacklistService {
  private readonly blacklistedTokens = new Map<string, number>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async blacklistToken(token: string, userId?: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as { jti?: string; exp?: number; sub?: string };
      if (!decoded?.jti || !decoded?.exp) return;

      const jti = decoded.jti;
      const expiresAt = new Date(decoded.exp * 1000);
      const tokenUserId = userId || decoded.sub;

      await this.prisma.tokenBlacklist.create({
        data: { jti, userId: tokenUserId, expiresAt },
      });
    } catch {
      // Token decode failed, already invalid
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.decode(token) as { jti?: string; exp?: number };
      if (!decoded?.jti) return false;

      const existing = await this.prisma.tokenBlacklist.findUnique({
        where: { jti: decoded.jti },
      });
      return !!existing;
    } catch {
      return false;
    }
  }

  async blacklistAllUserTokens(userId: string): Promise<void> {
    const activeSessions = await this.prisma.session.findMany({
      where: { userId, isActive: true },
    });

    for (const session of activeSessions) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isActive: false, revokedAt: new Date() },
      });
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
