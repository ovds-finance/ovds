import { Controller, Post, Body, UseGuards, Request, Get, Patch, Delete, Param, Query, HttpCode, HttpStatus, BadRequestException, ConflictException, NotImplementedException, Res, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT, AUTH_REGISTER_THROTTLE_LIMIT } from '@ovds/shared';
import { Response } from 'express';

import { CsrfProtectionMiddleware } from '../common/csrf-protection.middleware';
import { PasswordPolicyPipe } from '../common/password-policy.pipe';
import { Throttle } from '../common/throttle.decorator';

import { AuthService } from './auth.service';
import { Permissions } from './decorators/permissions.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Access token cookie:
    //  - HttpOnly: JS cannot read it (XSS-safe)
    //  - Secure: transmitted over HTTPS only
    //  - SameSite=Strict: never sent on cross-site requests (strongest CSRF protection)
    //  - Path=/api: scope cookie to API paths only (not served to static assets)
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/api',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    // Refresh token: same flags but longer-lived and scoped to the refresh endpoint
    // so it is not sent on every API call.
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/api/auth/refresh',
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

  private getOtpService(): any {
    const svc = (this.authService as any).otpService;
    if (!svc) {
      throw new ServiceUnavailableException('OTP service is not available');
    }
    return svc;
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
  async register(
    @Body('password', PasswordPolicyPipe) _password: string,
    @Body() body: {
      email: string;
      password: string;
      username?: string;
      companyId?: string;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      phone?: string;
      businessType?: string;
      registrationType?: string;
      website?: string;
      referralCode?: string;
      role?: string;
      registrationMethod?: string;
    },
    @Res() res: Response,
  ) {
    const result = await this.authService.register({
      ...body,
      username: body.username || [body.firstName, body.lastName].filter(Boolean).join(' ') || body.email.split('@')[0],
    });

    // Set auth cookies — token delivered via HttpOnly cookie ONLY.
    // access_token is intentionally omitted from the response body.
    const csrfToken = this.setAuthCookies(res, result.access_token, result.refresh_token);
    const { access_token, refresh_token, ...safe } = result;

    return res.status(HttpStatus.CREATED).json({
      success: true,
      data: {
        user: safe.user,
        csrf_token: csrfToken,
        // token_delivery indicates the client should read the HttpOnly cookie,
        // not a body token. Omitting access_token here is intentional.
        token_delivery: 'cookie',
      },
    });
  }

  @Get('check-email')
  @Throttle(THROTTLE_TTL_MS, AUTH_REGISTER_THROTTLE_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check whether an email is already registered' })
  async checkEmail(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    const exists = await this.authService.emailExists(email.trim().toLowerCase());
    if (exists) throw new ConflictException('An account with this email already exists.');
    return { success: true, available: true };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile from JWT payload (fast, no DB)' })
  getProfile(@Request() req: any) {
    return req.user;
  }

  /**
   * GET /auth/me
   *
   * Live DB profile endpoint used by AuthContext.tsx on every session mount
   * to validate the stored JWT and sync any role/company changes made by an
   * admin since the token was issued.
   *
   * Returns the same AuthUser shape the frontend login response provides so
   * the context can merge the response directly into state.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Throttle(60000, 30)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get live DB profile for the authenticated user — used by frontend AuthContext on mount' })
  @ApiResponse({ status: 200, description: 'Current user profile from database' })
  @ApiResponse({ status: 401, description: 'Unauthorized — token invalid or expired' })
  @ApiResponse({ status: 404, description: 'User record not found' })
  async getMe(@Request() req: any) {
    const data = await this.authService.getMe(req.user.userId);
    return { success: true, data };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @Throttle(60000, 20)
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
  @Throttle(60000, 10)
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
  async changePassword(
    @Request() req: any,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword', PasswordPolicyPipe) newPassword: string,
  ) {
    return this.authService.changePassword(req.user.userId, oldPassword, newPassword);
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

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('users:read')
  @Throttle(60000, 30)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List users' })
  async listUsers(@Query() query: any) {
    const result = await this.authService.listUsers({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      companyId: query.companyId,
    });
    return { success: true, data: result.data, total: result.total };
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('users:write')
  @Throttle(60000, 20)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a user' })
  async updateUser(
    @Param('id') id: string,
    @Body() body: {
      username?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
      isActive?: boolean;
      companyId?: string;
      businessType?: string;
    },
  ) {
    return this.authService.updateUser(id, body);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('users:delete')
  @Throttle(60000, 10)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user' })
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }

  @Patch('users/:id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('users:write')
  @Throttle(60000, 5)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password' })
  async adminResetPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
    return this.authService.resetUserPassword(id, body.newPassword);
  }

  @Get('users/:id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('users:read')
  @Throttle(60000, 30)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get custom roles for a user' })
  async getUserRoles(@Param('id') id: string) {
    const roles = await this.authService.getUserRoles(id);
    return { success: true, data: roles };
  }

  @Post('users/:id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('users:write')
  @Throttle(60000, 10)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign custom roles to a user' })
  async assignUserRoles(@Param('id') id: string, @Body() body: { roleIds: string[] }) {
    return this.authService.assignUserRoles(id, body.roleIds);
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
    await this.getOtpService().generateOtp(email, purpose.toUpperCase());
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
    const valid = await this.getOtpService().verifyOtp(email, code, purpose.toUpperCase());
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
    await this.getOtpService().generateOtp(body.email, 'PASSWORD_RESET');
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
    const valid = await this.getOtpService().verifyOtp(body.email, body.code, 'PASSWORD_RESET');
    if (!valid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    // Validate password policy before persisting
    const policyPipe = new PasswordPolicyPipe();
    policyPipe.transform(body.newPassword);
    const result = await this.authService.changePasswordByEmail(body.email, body.newPassword);
    return result;
  }

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  @Throttle(60000, 10)
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create session from Auth0 token (requires AUTH0_DOMAIN + AUTH0_CLIENT_SECRET)' })
  @ApiResponse({ status: 501, description: 'Auth0 SSO not configured on this deployment' })
  async auth0Session(@Body() body: { token: string }) {
    if (!body.token) throw new BadRequestException('token is required');
    if (!(process.env['AUTH0_DOMAIN'] && process.env['AUTH0_CLIENT_SECRET'])) {
      throw new NotImplementedException(
        'Auth0 SSO is not configured. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET.',
      );
    }
    // Auth0 is configured — real JWKS verification delegated to authService
    // when AUTH0_JWKS_URI integration is completed.
    throw new NotImplementedException(
      'Auth0 JWKS token verification requires the auth0-jwks-rsa package to be configured.',
    );
  }

  @Get('google/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check Google OAuth availability' })
  getGoogleStatus() {
    const enabled = !!(process.env['GOOGLE_CLIENT_ID'] && process.env['GOOGLE_CLIENT_SECRET']);
    return { enabled, provider: 'google' };
  }

  @Post('fayda')
  @Throttle(THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Fayda national digital ID (requires FAYDA_API_KEY)' })
  @ApiResponse({ status: 501, description: 'Fayda API key not configured' })
  faydaLogin(@Body() body: { nationalId: string; pin: string }) {
    if (!process.env['FAYDA_API_KEY']) {
      throw new NotImplementedException(
        'Fayda digital ID login is not available. Contact your system administrator to configure FAYDA_API_KEY.',
      );
    }
    // Real Fayda integration goes here once the API key is provisioned
    throw new NotImplementedException('Fayda API integration pending provisioning by the Ethiopian NIDP.');
  }

  @Post('tin')
  @Throttle(THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with TIN and PIN (requires TIN_API_KEY)' })
  @ApiResponse({ status: 501, description: 'TIN login API key not configured' })
  tinLogin(@Body() body: { tin: string; pin: string }) {
    if (!process.env['TIN_API_KEY']) {
      throw new NotImplementedException(
        'TIN-based login is not available. Configure TIN_API_KEY to enable ERCA TIN authentication.',
      );
    }
    throw new NotImplementedException('TIN API integration pending ERCA provisioning.');
  }

  @Post('ekyb/verify')
  @Throttle(THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify eKYB (electronic Know Your Business) via Fayda (requires EKYB_API_KEY)' })
  @ApiResponse({ status: 501, description: 'eKYB API key not configured' })
  ekybVerify(@Body() body: { faydaId: string; tin?: string }) {
    if (!process.env['EKYB_API_KEY']) {
      throw new NotImplementedException(
        'eKYB verification is not available. Configure EKYB_API_KEY to enable electronic business verification.',
      );
    }
    throw new NotImplementedException('eKYB API integration pending NIDP/ERCA provisioning.');
  }
}
