import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { BiometricsService } from './biometrics.service';

@ApiTags('biometrics')
@Controller('biometrics')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('ADMIN', 'HR')
export class BiometricsController {
  constructor(private readonly biometricsService: BiometricsService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register biometric template' })
  register(@Body() body: { type: string; template: string; employeeId: string }) {
    return this.biometricsService.create(body);
  }

  @Get('employee/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get biometrics for employee' })
  getForEmployee(@Param('id') id: string) {
    return this.biometricsService.findByEmployee(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all biometric records' })
  list(@Query() query: { page?: number; limit?: number; employeeId?: string }) {
    return this.biometricsService.findAll(query);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update biometric template' })
  update(@Param('id') id: string, @Body() body: { type?: string; template?: string }) {
    return this.biometricsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete biometric record' })
  deleteBio(@Param('id') id: string) {
    return this.biometricsService.remove(id);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify biometric template' })
  verify(@Body() body: { template: string; employeeId?: string }) {
    return { success: true, data: { verified: false, confidence: 0 } };
  }
}

