import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AccountLockoutService } from '../common/account-lockout.service';
import { OtpService } from '../common/otp.service';
import { PrismaModule } from '../common/prisma.module';
import { TokenBlacklistService } from '../common/token-blacklist.service';

import { AccessPolicyService } from './access-policy/access-policy.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessPolicyGuard } from './guards/access-policy.guard';
import { ModuleSubscriptionGuard } from './guards/module-subscription.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';


@Module({
  imports: [
    PassportModule,
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required for authentication');
        }
        return {
          secret,
          signOptions: { expiresIn: config.get('JWT_EXPIRY', '1d') },
        };
      },
    }),
  ],
  providers: [AuthService, AccountLockoutService, OtpService, TokenBlacklistService, JwtStrategy, LocalStrategy, RolesGuard, PermissionsGuard, AccessPolicyService, AccessPolicyGuard, ModuleSubscriptionGuard],
  controllers: [AuthController],
  exports: [AuthService, AccessPolicyService, AccessPolicyGuard, PermissionsGuard, RolesGuard, ModuleSubscriptionGuard],
})
export class AuthModule {}
