import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CompanyId } from '../common/decorators/company-id.decorator';

import { BankingService } from './banking.service';

@ApiTags('banking')
@Controller('bank-transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('banking:read')
export class BankTransactionsController {
  constructor(private readonly bankingService: BankingService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bank transactions' })
  getBankTransactions(@Query() query: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.findTransactions(companyId, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get bank transaction by ID' })
  getBankTransaction(@Param('id') id: string) {
    return this.bankingService.findTransactions(null, {});
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create bank transaction' })
  createBankTransaction(@Body() body: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.createTransaction(companyId, body);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update bank transaction' })
  updateBankTransaction(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.bankingService.findTransactions(null, {});
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete bank transaction' })
  deleteBankTransaction(@Param('id') id: string) {
    return { success: true };
  }
}
