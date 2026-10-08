import { Controller, Get, Post, Put, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { JournalEntryStatus, AccountType } from '@ovds/database';

@ApiTags('accounting')
@Controller('accounting')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AccountingController {
  constructor(private accountingService: AccountingService) {}

  @Get('balances')
  @ApiOperation({ summary: 'Get account balances' })
  @ApiQuery({ name: 'asOfDate', required: false })
  async getBalances(@Request() req: any, @Query('asOfDate') asOfDate?: string) {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    return this.accountingService.getAccountBalances(req.user.tenantId, date);
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get trial balance' })
  @ApiQuery({ name: 'asOfDate', required: false })
  async getTrialBalance(@Request() req: any, @Query('asOfDate') asOfDate?: string) {
    const date = asOfDate ? new Date(asOfDate) : new Date();
    return this.accountingService.getTrialBalance(req.user.tenantId, date);
  }

  @Get('journal-entries')
  @ApiOperation({ summary: 'Get journal entries' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: JournalEntryStatus })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getJournalEntries(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: JournalEntryStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getJournalEntries(req.user.tenantId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Post('journal-entries')
  @ApiOperation({ summary: 'Create journal entry' })
  async createJournalEntry(@Request() req: any, @Body() body: any) {
    return this.accountingService.createJournalEntry(req.user.tenantId, body);
  }

  @Put('journal-entries/:id/post')
  @ApiOperation({ summary: 'Post journal entry' })
  async postJournalEntry(@Request() req: any, @Param('id') id: string) {
    return this.accountingService.postJournalEntry(req.user.tenantId, id, req.user.id);
  }

  @Put('journal-entries/:id/reverse')
  @ApiOperation({ summary: 'Reverse journal entry' })
  async reverseJournalEntry(@Request() req: any, @Param('id') id: string) {
    return this.accountingService.reverseJournalEntry(req.user.tenantId, id, req.user.id);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get chart of accounts' })
  @ApiQuery({ name: 'type', required: false, enum: AccountType })
  async getAccounts(@Request() req: any, @Query('type') type?: AccountType) {
    return this.accountingService.getAccounts(req.user.tenantId, type);
  }

  @Post('convert')
  @ApiOperation({ summary: 'Convert currency' })
  async convertCurrency(
    @Body() body: { amount: number; fromCurrency: string; toCurrency: string; date?: string },
  ) {
    return this.accountingService.convertCurrency(
      body.amount,
      body.fromCurrency,
      body.toCurrency,
      body.date ? new Date(body.date) : new Date(),
    );
  }
}