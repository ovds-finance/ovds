import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('loyalty')
@Controller('loyalty')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('loyalty:read')
export class LoyaltyController {
  @Get('programs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List loyalty programs' })
  getPrograms() {
    return { success: true, data: [] };
  }

  @Post('programs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create loyalty program' })
  createProgram(@Body() body: any) {
    return { success: true, data: { ...body, id: 'loy-' + Date.now() } };
  }

  @Get('members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List loyalty members' })
  getMembers() {
    return { success: true, data: [] };
  }

  @Post('members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enroll loyalty member' })
  enrollMember(@Body() body: any) {
    return { success: true, data: { ...body, id: 'loym-' + Date.now() } };
  }

  @Get('rewards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List loyalty rewards' })
  getRewards() {
    return { success: true, data: [] };
  }

  @Post('rewards')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create loyalty reward' })
  createReward(@Body() body: any) {
    return { success: true, data: { ...body, id: 'loyr-' + Date.now() } };
  }
}

