import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('holidays')
@Controller('holidays')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('holidays:read')
export class HolidaysController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List holidays' })
  getHolidays() {
    return { success: true, data: [] };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create holiday' })
  createHoliday(@Body() body: any) {
    return { success: true, data: { ...body, id: 'hol-' + Date.now() } };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update holiday' })
  updateHoliday(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete holiday' })
  deleteHoliday(@Param('id') id: string) {
    return { success: true };
  }
}

