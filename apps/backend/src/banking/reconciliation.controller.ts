import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CompanyId } from '../common/decorators/company-id.decorator';

import { BankingService } from './banking.service';

@ApiTags('banking')
@Controller('reconciliation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('bank_reconciliation:read')
export class ReconciliationController {
  constructor(private readonly bankingService: BankingService) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get reconciliation stats' })
  async getStats(@CompanyId() companyId: string | null) {
    const result = await this.bankingService.findTransactions(companyId, {});
    return { success: true, data: { matched: 0, unmatched: 0, pending: 0, total: result.total ?? 0 } };
  }

  @Get('periods')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List reconciliation periods' })
  getPeriods() {
    return { success: true, data: [] };
  }

  @Post('periods')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create reconciliation period' })
  createPeriod(@Body() body: any) {
    return { success: true, data: { ...body, id: 'rec-' + Date.now() } };
  }

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run reconciliation' })
  runReconciliation(@Body() body: any) {
    return { success: true, data: { matched: 0, unmatched: 0 } };
  }
}
