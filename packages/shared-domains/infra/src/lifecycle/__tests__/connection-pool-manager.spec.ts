import { ConnectionPoolManager } from '../connection-pool-manager';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn().mockResolvedValue(true),
      $disconnect: jest.fn().mockResolvedValue(true),
    })),
  };
});

describe('ConnectionPoolManager', () => {
  let poolManager: ConnectionPoolManager;

  beforeEach(() => { jest.useFakeTimers(); poolManager = new ConnectionPoolManager(); });
  afterEach(() => { poolManager.onModuleDestroy(); jest.useRealTimers(); jest.clearAllMocks(); });

  it('should keep active pools during routine sweeps', async () => {
    const client = await poolManager.getClientForTenant('t1', 'postgresql://u:p@localhost:5432/db');
    jest.advanceTimersByTime(4 * 60 * 1000);
    const pools = (poolManager as any).activePools;
    expect(pools.has('t1')).toBe(true);
  });

  it('should reclaim idle connections past timeout', async () => {
    const client = await poolManager.getClientForTenant('t2', 'postgresql://u:p@localhost:5432/db');
    const spy = jest.spyOn(client, '$disconnect');
    jest.advanceTimersByTime(16 * 60 * 1000);
    const pools = (poolManager as any).activePools;
    expect(pools.has('t2')).toBe(false);
    expect(spy).toHaveBeenCalled();
  });
});
