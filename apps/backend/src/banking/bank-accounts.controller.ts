import { Controller, Get, Post, Body, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CompanyId } from '../common/decorators/company-id.decorator';

import { BankingService } from './banking.service';

@ApiTags('banking')
@Controller('bank-accounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('banking:read')
export class BankAccountsController {
  constructor(private readonly bankingService: BankingService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bank accounts' })
  getBankAccounts(@Query() query: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.findAccounts(companyId, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get bank account by ID' })
  getBankAccount(@Param('id') id: string, @CompanyId() companyId: string | null) {
    return this.bankingService.findAccount(companyId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create bank account' })
  createBankAccount(@Body() body: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.createAccount(companyId, body);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update bank account' })
  updateBankAccount(@Param('id') id: string, @Body() body: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.updateAccount(companyId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete bank account' })
  deleteBankAccount(@Param('id') id: string, @CompanyId() companyId: string | null) {
    return this.bankingService.removeAccount(companyId, id);
  }
}
