import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

@ApiTags('expense-claims')
@Controller('expense-claims')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('expenses:read')
export class ExpenseClaimsController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List expense claims' })
  getClaims() {
    return { success: true, data: { data: [], pagination: { total: 0, page: 1,       take: PAGINATION_DEFAULT_LIMIT, pages: 0 } } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create expense claim' })
  createClaim(@Body() body: any) {
    return { success: true, data: { ...body, id: 'expclaim-' + Date.now() } };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update expense claim' })
  updateClaim(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: { ...body, id } };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete expense claim' })
  deleteClaim(@Param('id') id: string) {
    return { success: true };
  }
}

