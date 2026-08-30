import { AccountingService } from './accounting.service';
import { BadRequestException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';

describe('AccountingService migration stubs', () => {
  let service: AccountingService;

  beforeEach(() => {
    service = new AccountingService({} as any);
  });

  describe('getTrialBalance', () => {
    it('throws BadRequestException because not yet migrated', async () => {
      await expect(
        service.getTrialBalance('co-1', '2026-08-06'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getTrialBalance('co-1', '2026-08-06'),
      ).rejects.toThrow('Not yet migrated to domain lib');
    });
  });

  describe('getCloseHealth', () => {
    it('throws BadRequestException because not yet migrated', async () => {
      await expect(service.getCloseHealth('co-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getCloseHealth('co-1')).rejects.toThrow(
        'Not yet migrated to domain lib',
      );
    });
  });

  describe('recordBankTransaction', () => {
    it('throws BadRequestException because not yet migrated', async () => {
      await expect(
        service.recordBankTransaction(
          'tx-1',
          { date: '2026-08-06', description: 'Test', amount: 100 },
          'user-1',
          'co-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateBankTransaction', () => {
    it('throws BadRequestException because not yet migrated', async () => {
      await expect(
        service.updateBankTransaction('tx-1', { status: 'RECONCILED' }, 'user-1', 'co-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLockedPeriods', () => {
    it('returns empty array as safe default', async () => {
      const result = await service.getLockedPeriods('co-1');
      expect(result).toEqual([]);
    });
  });

  describe('getBankTransactions', () => {
    it('returns empty pagination as safe default', async () => {
      const result = await service.getBankTransactions('co-1', { page: 1, limit: 20 }, 'co-1');
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getAllBankTransactions', () => {
    it('returns empty pagination as safe default', async () => {
      const result = await service.getAllBankTransactions({ page: 1, limit: 20 }, 'co-1');
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
