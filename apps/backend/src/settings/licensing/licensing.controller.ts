import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('licensing')
@Controller('licensing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('apps:read')
export class LicensingController {
  @Get('licenses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List licenses' })
  getLicenses() {
    return { success: true, data: [] };
  }

  @Post('licenses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create license' })
  createLicense(@Body() body: any) {
    return { success: true, data: { ...body, id: 'lic-' + Date.now() } };
  }

  @Patch('licenses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update license' })
  updateLicense(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete('licenses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete license' })
  deleteLicense(@Param('id') id: string) {
    return { success: true };
  }
}

