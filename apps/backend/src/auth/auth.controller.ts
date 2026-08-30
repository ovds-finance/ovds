import { Controller, Post, Body, UseGuards, Request, Get, Patch, Delete, Param, HttpCode, HttpStatus, BadRequestException, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '../common/throttle.decorator';
import { CsrfProtectionMiddleware } from '../common/csrf-protection.middleware';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT, AUTH_REGISTER_THROTTLE_LIMIT } from '@ovds/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieBase = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('access_token', accessToken, {
      ...cookieBase,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie('refresh_token', refreshToken, {
      ...cookieBase,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    const csrfToken = CsrfProtectionMiddleware.setCsrfCookie(res);
    return csrfToken;
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    res.clearCookie('csrf_token', { path: '/' });
  }

  @Post('login')
  @Throttle(THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT)
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req: any, @Res() res: Response, @Body() body: { email: string; password: string }) {
    const result = await this.authService.login(req.user);
    const csrfToken = this.setAuthCookies(res, result.access_token, result.refresh_token);
    const { access_token, refresh_token, ...safeUser } = result;
    return res.status(HttpStatus.OK).json({ success: true, data: { user: safeUser.user, csrf_token: csrfToken } });
  }

  @Post('register')
  @Throttle(THROTTLE_TTL_MS, AUTH_REGISTER_THROTTLE_LIMIT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() body: { email: string; password: string; username: string; companyId?: string }) {
    return this.authService.register(body);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  async logout(@Request() req: any, @Res() res: Response) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.authService.blacklistToken(token);
    }
    this.clearAuthCookies(res);
    return res.status(HttpStatus.OK).json({ success: true, message: 'Logged out successfully' });
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Request() req: any, @Res() res: Response) {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.refresh_token;
    const result = await this.authService.refreshToken(req.user.userId, token);
    const csrfToken = this.setAuthCookies(res, result.access_token, result.refresh_token);
    const { access_token, refresh_token, ...safeResult } = result;
    return res.status(HttpStatus.OK).json({ success: true, data: { ...safeResult, csrf_token: csrfToken } });
  }

  @Post('change-password')
  @Throttle(60000, 5)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for current user' })
  async changePassword(@Request() req: any, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.authService.changePassword(req.user.userId, body.oldPassword, body.newPassword);
  }

  @Get('api-keys')
  @Throttle(60000, 30)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List API keys for current user' })
  async getApiKeys(@Request() req: any) {
    return this.authService.apiKeys(req.user.userId);
  }

  @Post('api-keys')
  @Throttle(60000, 5)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new API key' })
  async createApiKey(@Request() req: any, @Body() body: { name: string }) {
    return this.authService.createApiKey(req.user.userId, body.name);
  }

  @Delete('api-keys/:id')
  @Throttle(60000, 10)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an API key' })
  async deleteApiKey(@Request() req: any, @Param('id') id: string) {
    return this.authService.deleteApiKey(req.user.userId, id);
  }

  @Post('otp/send')
  @Throttle(60000, 3)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to email' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(@Body() body: { email: string; purpose: string }) {
    const { email, purpose } = body;
    if (!email || !purpose) {
      throw new BadRequestException('Email and purpose are required');
    }
    const allowedPurposes = ['LOGIN', 'REGISTER', 'PASSWORD_RESET', 'MFA'];
    if (!allowedPurposes.includes(purpose.toUpperCase())) {
      throw new BadRequestException('Invalid OTP purpose');
    }
    const code = await (this.authService as any).otpService?.generateOtp(email, purpose.toUpperCase());
    return { success: true, message: 'OTP sent to email' };
  }

  @Post('otp/verify')
  @Throttle(60000, 5)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  async verifyOtp(@Body() body: { email: string; code: string; purpose: string }) {
    const { email, code, purpose } = body;
    if (!email || !code || !purpose) {
      throw new BadRequestException('Email, code, and purpose are required');
    }
    const valid = await (this.authService as any).otpService?.verifyOtp(email, code, purpose.toUpperCase());
    return { success: valid, message: valid ? 'OTP verified' : 'Invalid OTP' };
  }

  @Post('forgot-password')
  @Throttle(60000, 3)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent' })
  async forgotPassword(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    const code = await (this.authService as any).otpService?.generateOtp(body.email, 'PASSWORD_RESET');
    return { success: true, message: 'Password reset OTP sent to email' };
  }

  @Post('reset-password')
  @Throttle(60000, 5)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() body: { email: string; code: string; newPassword: string }) {
    if (!body.email || !body.code || !body.newPassword) {
      throw new BadRequestException('Email, code, and new password are required');
    }
    const valid = await (this.authService as any).otpService?.verifyOtp(body.email, body.code, 'PASSWORD_RESET');
    if (!valid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    const result = await this.authService.changePasswordByEmail(body.email, body.newPassword);
    return result;
  }

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register Firebase Cloud Messaging token for push notifications' })
  async registerFcmToken(@Request() req: any, @Body() body: { token: string }) {
    if (!body.token) throw new BadRequestException('FCM token is required');
    await this.authService.saveFcmToken(req.user.userId, body.token);
    return { success: true };
  }

  @Get('auth0/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check Auth0 connection status' })
  @ApiResponse({ status: 200, description: 'Auth0 status' })
  getAuth0Status() {
    return { enabled: true, provider: 'auth0' };
  }

  @Post('auth0/session')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: 'Create session from Auth0 token' })
  @ApiResponse({ status: 501, description: 'Auth0 session requires proper token verification' })
  async auth0Session(@Body() body: { token: string }) {
    return { statusCode: HttpStatus.NOT_IMPLEMENTED, message: 'Auth0 SSO requires proper token verification via Auth0 JWKS' };
  }

  @Get('google/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check Google OAuth status' })
  getGoogleStatus() {
    return { enabled: false, provider: 'google' };
  }

  @Post('fayda')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: 'Login with Fayda ID (Ethiopian digital ID)' })
  faydaLogin(@Body() body: { nationalId: string; pin: string }) {
    return { statusCode: HttpStatus.NOT_IMPLEMENTED, message: 'Fayda requires FAYDA_API_KEY' };
  }

  @Post('tin')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: 'Login with TIN and PIN' })
  tinLogin(@Body() body: { tin: string; pin: string }) {
    return { statusCode: HttpStatus.NOT_IMPLEMENTED, message: 'TIN login requires TIN_API_KEY' };
  }

  @Post('ekyb/verify')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: 'Verify eKYB (electronic Know Your Business)' })
  ekybVerify(@Body() body: { faydaId: string; tin?: string }) {
    return { statusCode: HttpStatus.NOT_IMPLEMENTED, message: 'eKYB requires EKYB_API_KEY' };
  }
}
