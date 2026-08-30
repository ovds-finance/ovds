import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('ifrs')
@Controller('ifrs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('ifrs:read')
export class IfrsController {
  @Get('standards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List IFRS standards' })
  getStandards() {
    return { success: true, data: [] };
  }

  @Post('standards')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create IFRS standard' })
  createStandard(@Body() body: any) {
    return { success: true, data: { ...body, id: 'ifrs-' + Date.now() } };
  }

  @Patch('standards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update IFRS standard' })
  updateStandard(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete('standards/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete IFRS standard' })
  deleteStandard(@Param('id') id: string) {
    return { success: true };
  }
}

