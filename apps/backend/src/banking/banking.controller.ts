import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT, AUTH_REGISTER_THROTTLE_LIMIT } from '@ovds/shared';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CompanyId } from '../common/decorators/company-id.decorator';
import { Throttle } from '../common/throttle.decorator';

import { BankingService } from './banking.service';


@ApiTags('banking')
@Controller('banking')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  @Get('accounts')
  @Permissions('banking:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bank accounts' })
  listAccounts(@Query() query: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.findAccounts(companyId, query);
  }

  @Get('accounts/:id')
  @Permissions('banking:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get bank account by ID' })
  getAccount(@Param('id') id: string, @CompanyId() companyId: string | null) {
    return this.bankingService.findAccount(companyId, id);
  }

  @Post('accounts')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Permissions('banking:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create bank account' })
  createAccount(@Body() data: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.createAccount(companyId, data);
  }

  @Put('accounts/:id')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Permissions('banking:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update bank account' })
  updateAccount(@Param('id') id: string, @Body() data: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.updateAccount(companyId, id, data);
  }

  @Delete('accounts/:id')
  @Throttle(THROTTLE_TTL_MS, 5)
  @Permissions('banking:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete bank account' })
  removeAccount(@Param('id') id: string, @CompanyId() companyId: string | null) {
    return this.bankingService.removeAccount(companyId, id);
  }

  @Get('transactions')
  @Throttle(THROTTLE_TTL_MS, 30)
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bank transactions' })
  listTransactions(@Query() query: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.findTransactions(companyId, query);
  }

  @Get('transactions/:id')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get bank transaction by ID' })
  getTransaction(@Param('id') id: string, @CompanyId() companyId: string | null) {
    return this.bankingService.findTransaction(companyId, id);
  }

  @Post('transactions')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create bank transaction' })
  createTransaction(@Body() data: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.createTransaction(companyId, data);
  }

  @Patch('transactions/:id')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update bank transaction' })
  updateTransaction(@Param('id') id: string, @Body() data: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.updateTransaction(companyId, id, data);
  }

  @Delete('transactions/:id')
  @Throttle(THROTTLE_TTL_MS, 5)
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete bank transaction' })
  removeTransaction(@Param('id') id: string, @CompanyId() companyId: string | null) {
    return this.bankingService.removeTransaction(companyId, id);
  }

  @Get('transfers')
  @Throttle(THROTTLE_TTL_MS, 30)
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List fund transfers' })
  listTransfers(@Query() query: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.findTransfers(companyId, query);
  }

  @Get('transfers/:id')
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get fund transfer by ID' })
  getTransfer(@Param('id') id: string, @CompanyId() companyId: string | null) {
    return this.bankingService.findTransfer(companyId, id);
  }

  @Post('transfers')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create fund transfer' })
  createTransfer(@Body() data: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.createTransfer(companyId, data);
  }

  @Patch('transfers/:id')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update fund transfer' })
  updateTransfer(@Param('id') id: string, @Body() data: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.updateTransfer(companyId, id, data);
  }

  @Delete('transfers/:id')
  @Throttle(THROTTLE_TTL_MS, 5)
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete fund transfer' })
  removeTransfer(@Param('id') id: string, @CompanyId() companyId: string | null) {
    return this.bankingService.removeTransfer(companyId, id);
  }
}
