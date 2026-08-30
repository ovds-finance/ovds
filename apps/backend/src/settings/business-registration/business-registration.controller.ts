import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('business-registration')
@Controller('business-registration')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('onboarding:read')
export class BusinessRegistrationController {
  @Post('nid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify NID' })
  verifyNid(@Body() body: any) {
    return { success: true, data: { verified: false } };
  }

  @Post('tin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify TIN' })
  verifyTin(@Body() body: any) {
    return { success: true, data: { verified: false } };
  }

  @Post('license')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify business license' })
  verifyLicense(@Body() body: any) {
    return { success: true, data: { verified: false } };
  }

  @Post('vat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify VAT registration' })
  verifyVat(@Body() body: any) {
    return { success: true, data: { verified: false } };
  }

  @Post('cross-reference')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cross-reference business data' })
  crossReference(@Body() body: any) {
    return { success: true, data: { matched: false } };
  }

  @Get('record')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get registration record' })
  getRecord() {
    return { success: true, data: {} };
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete business registration' })
  completeRegistration(@Body() body: any) {
    return { success: true, data: { completed: true } };
  }
}

