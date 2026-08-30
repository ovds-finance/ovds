import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AccountLockoutService {
  private readonly maxAttempts: number;
  private readonly lockoutDurationMs: number;

  constructor(private prisma: PrismaService, private configService?: ConfigService) {
    this.maxAttempts = this.configService?.get('ACCOUNT_LOCKOUT_MAX_ATTEMPTS', 5) ?? 5;
    this.lockoutDurationMs = this.configService?.get('ACCOUNT_LOCKOUT_DURATION_MS', 900000) ?? 900000;
  }

  async recordFailedAttempt(userId: string): Promise<{ locked: boolean; remainingAttempts: number }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { locked: false, remainingAttempts: this.maxAttempts };
    }

    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const lockedUntil = newAttempts >= this.maxAttempts ? new Date(Date.now() + this.lockoutDurationMs) : null;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil,
      },
    });

    return {
      locked: !!lockedUntil,
      remainingAttempts: Math.max(0, this.maxAttempts - newAttempts),
    };
  }

  async recordSuccessfulLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  }

  async isLocked(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true, failedLoginAttempts: true },
    });

    if (!user || !user.lockedUntil) return false;

    if (user.lockedUntil <= new Date()) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: null, failedLoginAttempts: 0 },
      });
      return false;
    }

    return true;
  }

  async getRemainingLockoutTime(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true },
    });

    if (!user || !user.lockedUntil) return 0;

    const remaining = user.lockedUntil.getTime() - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  async unlockUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async lockUser(userId: string, durationMs?: number): Promise<void> {
    const lockDuration = durationMs ?? this.lockoutDurationMs;
    const lockedUntil = new Date(Date.now() + lockDuration);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil,
      },
    });
  }
}
