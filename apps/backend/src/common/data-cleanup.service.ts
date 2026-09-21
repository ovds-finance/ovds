import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from './prisma.service';

@Injectable()
export class DataCleanupService {
  private readonly logger = new Logger(DataCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 0 * * *', {
    name: 'daily-data-cleanup',
    timeZone: 'Africa/Addis_Ababa',
  })
  async handleDailyCleanup() {
    this.logger.log('Starting daily data cleanup...');

    const results = {
      otpCodes: 0,
      tokenBlacklist: 0,
      sessions: 0,
    };

    try {
      results.otpCodes = await this.cleanupExpiredOtpCodes();
      results.tokenBlacklist = await this.cleanupExpiredTokens();
      results.sessions = await this.cleanupExpiredSessions();

      this.logger.log(`Daily cleanup completed: ${JSON.stringify(results)}`);
    } catch (error) {
      this.logger.error('Daily cleanup failed', error);
    }
  }

  async cleanupExpiredOtpCodes(): Promise<number> {
    const result = await this.prisma.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      this.logger.debug(`Cleaned up ${result.count} expired OTP codes`);
    }
    return result.count;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.tokenBlacklist.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      this.logger.debug(`Cleaned up ${result.count} expired token blacklist entries`);
    }
    return result.count;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      this.logger.debug(`Cleaned up ${result.count} expired sessions`);
    }
    return result.count;
  }

  async runFullCleanup(): Promise<{
    otpCodes: number;
    tokenBlacklist: number;
    sessions: number;
  }> {
    this.logger.log('Running full data cleanup...');

    const results = {
      otpCodes: await this.cleanupExpiredOtpCodes(),
      tokenBlacklist: await this.cleanupExpiredTokens(),
      sessions: await this.cleanupExpiredSessions(),
    };

    this.logger.log(`Full cleanup completed: ${JSON.stringify(results)}`);
    return results;
  }
}
