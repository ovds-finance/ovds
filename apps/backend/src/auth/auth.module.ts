import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RolesGuard } from './guards/roles.guard';
import { AccountLockoutService } from '../common/account-lockout.service';
import { OtpService } from '../common/otp.service';
import { TokenBlacklistService } from '../common/token-blacklist.service';
import { PrismaModule } from '../common/prisma.module';

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
  providers: [AuthService, AccountLockoutService, OtpService, TokenBlacklistService, JwtStrategy, LocalStrategy, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
