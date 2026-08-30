import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('shifts')
@Controller('shifts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('shifts:read')
export class ShiftsController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List shifts' })
  getShifts() {
    return { success: true, data: [] };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create shift' })
  createShift(@Body() body: any) {
    return { success: true, data: { ...body, id: 'shift-' + Date.now() } };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update shift' })
  updateShift(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete shift' })
  deleteShift(@Param('id') id: string) {
    return { success: true };
  }
}

