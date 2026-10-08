import { CurrencyConverterService } from '../currency-converter.service';
import { PrismaClient } from '@ovds/database';

describe('CurrencyConverter', () => {
  let service: CurrencyConverterService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = { $queryRaw: jest.fn() };
    service = new CurrencyConverterService();
    (service as any).prisma = mockPrisma;
  });

  it('should short-circuit if currencies match', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ baseCurrency: 'EUR' }]);
    const result = await service.convertToReportingCurrency('t1', 'EUR', 100, new Date());
    expect(result.exchangeRate).toBe(1.0);
    expect(result.translatedAmount).toBe(100);
  });

  it('should convert using historical rates', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ baseCurrency: 'USD' }]);
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ rate: 1.0852 }]);
    const result = await service.convertToReportingCurrency('t1', 'EUR', 100, new Date('2026-05-15'));
    expect(result.exchangeRate).toBe(1.0852);
    expect(result.translatedAmount).toBe(108.52);
  });
});
