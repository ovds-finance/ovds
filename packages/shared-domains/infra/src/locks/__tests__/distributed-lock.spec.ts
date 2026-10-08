import { DistributedLockManager } from '../distributed-lock.manager';
import Redis from 'ioredis';

describe('Distributed Lock Manager', () => {
  let lockManager: DistributedLockManager;
  let mockRedis: any;

  beforeEach(() => { lockManager = new DistributedLockManager(); mockRedis = (lockManager as any).redis; });
  afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

  it('should guarantee mutual exclusion', async () => {
    const tenantId = 't-uuid'; const resource = 'ledger-migration';
    jest.spyOn(mockRedis, 'set').mockResolvedValueOnce('OK');
    const tokenA = await lockManager.acquireLock(tenantId, resource, 5000);
    expect(tokenA).not.toBeNull();
    jest.spyOn(mockRedis, 'set').mockResolvedValueOnce(null);
    const tokenB = await lockManager.acquireLock(tenantId, resource, 5000);
    expect(tokenB).toBeNull();
  });

  it('should enforce matching token via Lua scripts', async () => {
    jest.spyOn(mockRedis, 'eval').mockResolvedValueOnce(1);
    const released = await lockManager.releaseLock('t-uuid', 'ledger-migration', 'valid-token');
    expect(released).toBe(true);
  });
});
