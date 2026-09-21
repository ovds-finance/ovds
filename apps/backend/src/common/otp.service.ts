import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OTP_MAX_REQUESTS } from '@ovds/shared';

import { PrismaService } from './prisma.service';
import { generateSecureToken, secureCompare } from './security-utils';


@Injectable()
export class OtpService {
  private readonly codeTtlMs: number;

  constructor(private prisma: PrismaService, private configService?: ConfigService) {
    this.codeTtlMs = this.configService?.get('OTP_TTL_MS', 600000) ?? 600000;
  }

  async generateOtp(email: string, purpose: 'LOGIN' | 'REGISTER' | 'PASSWORD_RESET' | 'MFA'): Promise<string> {
    const existingCount = await this.prisma.otpCode.count({
      where: { email, purpose, status: 'PENDING', expiresAt: { gt: new Date() } },
    });
    if (existingCount >= OTP_MAX_REQUESTS) {
      throw new ConflictException('Too many OTP requests. Please wait or use existing code.');
    }

    await this.prisma.otpCode.updateMany({
      where: { email, purpose, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });

    const code = generateSecureToken(6).slice(0, 6);
    const expiresAt = new Date(Date.now() + this.codeTtlMs);

    await this.prisma.otpCode.create({
      data: {
        email,
        code,
        purpose,
        expiresAt,
      },
    });

    return code;
  }

  async verifyOtp(email: string, code: string, purpose: string): Promise<boolean> {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: { email, purpose, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP not found or already used');
    }

    if (otpRecord.expiresAt < new Date()) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('OTP has expired');
    }

    const isValid = secureCompare(code, otpRecord.code);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP code');
    }

    const updateResult = await this.prisma.otpCode.updateMany({
      where: { id: otpRecord.id, status: 'PENDING' },
      data: { status: 'VERIFIED' },
    });

    if (updateResult.count === 0) {
      throw new BadRequestException('OTP already used');
    }

    return true;
  }

  async cleanupExpiredCodes(): Promise<number> {
    const result = await this.prisma.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
