import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BankingService } from './banking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Throttle } from '../common/throttle.decorator';
import { CompanyId } from '../common/decorators/company-id.decorator';
import { THROTTLE_TTL_MS, AUTH_LOGIN_THROTTLE_LIMIT, AUTH_REGISTER_THROTTLE_LIMIT } from '@ovds/shared';

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

  @Post('transactions')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create bank transaction' })
  createTransaction(@Body() data: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.createTransaction(companyId, data);
  }

  @Get('transfers')
  @Throttle(THROTTLE_TTL_MS, 30)
  @Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List fund transfers' })
  listTransfers(@Query() query: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.findTransfers(companyId, query);
  }

  @Post('transfers')
  @Throttle(THROTTLE_TTL_MS, 10)
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create fund transfer' })
  createTransfer(@Body() data: Record<string, unknown>, @CompanyId() companyId: string | null) {
    return this.bankingService.createTransfer(companyId, data);
  }
}
