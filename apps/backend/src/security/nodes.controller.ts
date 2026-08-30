import { Controller, Get, Post, Put, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('nodes')
@Controller('nodes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NodesController {
  @Get()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List nodes' })
  getNodes() {
    return { success: true, data: [] };
  }

  @Post('register')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register node' })
  registerNode(@Body() body: any) {
    return { success: true, data: { ...body, id: 'node-' + Date.now() } };
  }

  @Put(':id/heartbeat')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Node heartbeat' })
  heartbeat(@Param('id') id: string) {
    return { success: true };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister node' })
  deleteNode(@Param('id') id: string) {
    return { success: true };
  }
}

