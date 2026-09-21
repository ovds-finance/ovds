import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BCryptSaltRounds, JWT_REFRESH_EXPIRY } from '@ovds/shared';
import * as bcrypt from 'bcryptjs';

import { AccountLockoutService } from '../common/account-lockout.service';
import { OtpService } from '../common/otp.service';
import { PrismaService } from '../common/prisma.service';
import { generateApiKey, hashToken, generateSecureToken } from '../common/security-utils';
import { TokenBlacklistService } from '../common/token-blacklist.service';


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
    const payload: { email: string; sub: string; role: string; jti: string; companyId: string | null } = {
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

  async emailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({ where: { email }, select: { id: true } });
    return !!user;
  }

  async register(data: {
    email: string;
    password: string;
    username: string;
    companyId?: string;
    // Extended registration fields from the multi-step form
    firstName?: string;
    lastName?: string;
    companyName?: string;
    phone?: string;
    businessType?: string;
    registrationType?: string;
    website?: string;
    referralCode?: string;
    role?: string;
  }) {
    // Guard: reject duplicate emails with a clean 409
    if (await this.emailExists(data.email.trim().toLowerCase())) {
      throw new ConflictException('An account with this email already exists.');
    }

    const hashed = await bcrypt.hash(data.password, BCryptSaltRounds);

    // Determine role from registrationType
    let userRole: any = 'EMPLOYEE';
    if (data.role) {
      userRole = data.role;
    } else if (data.registrationType === 'customer') {
      userRole = 'CLIENT';
    }

    // Build the username from firstName+lastName if not explicitly provided
    const username = data.username ||
      [data.firstName, data.lastName].filter(Boolean).join(' ').toLowerCase().replace(/\s+/g, '.') ||
      data.email.split('@')[0];

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username,
        password: hashed,
        companyId: data.companyId,
        role: userRole,
      },
      select: {
        id: true, email: true, username: true, role: true, createdAt: true,
      },
    });

    // Issue a JWT so the frontend can log the user in immediately
    const payload: { email: string; sub: string; role: string; jti: string; companyId: string | null } = {
      email: user.email ?? '',
      sub: user.id,
      role: user.role,
      jti: generateSecureToken(16),
      companyId: data.companyId ?? null,
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: JWT_REFRESH_EXPIRY,
    });

    return {
      access_token,
      refresh_token,
      user: {
        ...user,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    };
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

    // Enforce refresh-token verification against JWT_REFRESH_SECRET.
    // A stolen or tampered refresh token must never silently succeed —
    // if verification fails we reject the request immediately.
    if (oldRefreshToken) {
      const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');
      try {
        this.jwtService.verify(oldRefreshToken, { secret: refreshSecret });
        // Token is valid — blacklist it to enforce single-use rotation.
        await this.tokenBlacklistService.blacklistToken(oldRefreshToken, userId);
      } catch {
        // Invalid, expired, or tampered refresh token — deny the rotation.
        throw new UnauthorizedException('Refresh token is invalid or has expired. Please log in again.');
      }
    }

    const jti = generateSecureToken(16);
    const payload: { email: string; sub: string; role: string; jti: string; companyId: string | null } = {
      email: user.email ?? '',
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
   */
  async saveFcmToken(userId: string, token: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });
  }

  async listUsers(params: { page?: number; limit?: number; search?: string; companyId?: string }): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 25, search, companyId } = params;
    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (companyId) {
      where.OR = [
        ...(where.OR ?? []),
        { companyId },
        { employee: { some: { companyId } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          companyId: true,
          isActive: true,
          lastLoginAt: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          userRoles: { include: { role: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    const now = new Date();
    return {
      data: data.map(u => ({
        ...u,
        isLocked: (u.failedLoginAttempts ?? 0) >= 5 || (u.lockedUntil ? new Date(u.lockedUntil) > now : false),
      })),
      total,
    };
  }

  async updateUser(id: string, data: { username?: string; email?: string; role?: string; isActive?: boolean; isLocked?: boolean; companyId?: string }): Promise<any> {
    const updateData: any = {
      ...(data.username !== undefined ? { username: data.username } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
    };
    if (data.isLocked !== undefined) {
      updateData.failedLoginAttempts = data.isLocked ? 5 : 0;
      updateData.lockedUntil = data.isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null;
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
        lastLoginAt: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        userRoles: { include: { role: true } },
      },
    });
    const isLocked = (user.failedLoginAttempts ?? 0) >= 5 || (user.lockedUntil ? new Date(user.lockedUntil) > new Date() : false);
    return { ...user, isLocked };
  }

  async deleteUser(id: string): Promise<{ success: boolean }> {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async resetUserPassword(id: string, newPassword: string): Promise<{ success: boolean }> {
    const hashed = await bcrypt.hash(newPassword, BCryptSaltRounds);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
    await this.tokenBlacklistService.blacklistAllUserTokens(id);
    return { success: true };
  }

  async assignUserRoles(userId: string, roleIds: string[]): Promise<{ success: boolean }> {
    await this.prisma.userRole.deleteMany({ where: { userId } });
    if (roleIds.length > 0) {
      await this.prisma.userRole.createMany({
        data: roleIds.map(roleId => ({ userId, roleId })),
        skipDuplicates: true,
      });
    }
    return { success: true };
  }

  async getUserRoles(userId: string): Promise<any[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
      isSystem: ur.role.isSystem,
      apiAccess: ur.role.apiAccess,
    }));
  }

  /**
   * GET /auth/me — returns the full profile for the currently-authenticated
   * user, resolving the latest role and companyId from the database so the
   * frontend always receives up-to-date values even after an admin role change.
   *
   * Shape mirrors the AuthUser interface expected by AuthContext.tsx.
   */
  async getMe(userId: string): Promise<{
    id: string;
    username: string;
    email: string;
    role: string;
    companyId: string | null;
    isActive: boolean;
    lastLoginAt?: string | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        companyId: true,
        isActive: true,
        lastLoginAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Resolve companyId: user's own FK first, then employee record fallback.
    let resolvedCompanyId = user.companyId ?? null;
    if (!resolvedCompanyId) {
      const emp = await this.prisma.employee.findFirst({
        where: { userId },
        select: { companyId: true },
      });
      resolvedCompanyId = emp?.companyId ?? null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email ?? '',
      role: user.role as string,
      companyId: resolvedCompanyId,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    };
  }
}
