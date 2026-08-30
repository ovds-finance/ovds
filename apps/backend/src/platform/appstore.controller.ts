import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('appstore')
@Controller('appstore')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('apps:read')
export class AppstoreController {
  @Get('apps')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List available apps' })
  getApps() {
    return { success: true, data: [] };
  }

  @Get('installations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List installed apps' })
  getInstallations() {
    return { success: true, data: [] };
  }

  @Post('installations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Install app' })
  installApp(@Body() body: any) {
    return { success: true, data: { ...body, id: 'app-' + Date.now() } };
  }

  @Delete('installations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Uninstall app' })
  uninstallApp(@Param('id') id: string) {
    return { success: true };
  }
}

