import { ShardBalancerService } from '../shard-balancer.service';
import { DistributedLockManager } from '../locks/distributed-lock.manager';
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({ set: jest.fn().mockResolvedValue('OK'), del: jest.fn().mockResolvedValue(1) }));
});

describe('ShardBalancerService', () => {
  let balancer: ShardBalancerService;
  let mockRedis: any;

  beforeEach(() => { balancer = new ShardBalancerService(); mockRedis = (balancer as any).redis; });
  afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

  it('should abort migration and release lock on destination failure', async () => {
    process.env.DATABASE_URL_SHARD_NODE_01 = 'postgresql://user:pass@localhost:5433/shard-node-01';
    const command = { tenantId: 't-fail', sourceShardHostId: 'shard-node-01', targetShardHostId: 'shard-node-02', targetConnectionString: 'postgresql://user:pass@localhost:5434/shard-node-02' };
    const outcome = await balancer.executeLiveMigration(command);
    expect(outcome).toBe(false);
    expect(mockRedis.del).toHaveBeenCalledWith('tenant:t-fail:write_lock');
  });
});
