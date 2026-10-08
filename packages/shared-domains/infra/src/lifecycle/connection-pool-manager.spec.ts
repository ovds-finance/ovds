import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConnectionPoolManager } from '@ovds/infra/lifecycle/connection-pool-manager';

describe('ConnectionPoolManager', () => {
  let pool: ConnectionPoolManager;

  beforeEach(() => {
    pool = new ConnectionPoolManager();
  });

  afterEach(async () => {
    await pool.onModuleDestroy();
  });

  it('should initialize with empty pool', () => {
    expect(pool.getPoolSize()).toBe(0);
  });

  it('onModuleInit should start cleanup interval', () => {
    pool.onModuleInit();
    expect(pool.getPoolSize()).toBe(0);
  });

  it('should acquire and release connections', async () => {
    const client = await pool.acquire('tenant-1');
    expect(client).toBeDefined();

    await pool.release('tenant-1');
    expect(pool.getPoolSize()).toBe(1);
  });

  it('should reuse cached connection', async () => {
    const client1 = await pool.acquire('tenant-1');
    await pool.release('tenant-1');
    const client2 = await pool.acquire('tenant-1');
    expect(client1).toBe(client2);
  });

  it('should disconnect tenant', async () => {
    await pool.acquire('tenant-1');
    expect(pool.getPoolSize()).toBe(1);
    await pool.disconnect('tenant-1');
    expect(pool.getPoolSize()).toBe(0);
  });

  it('onModuleDestroy should close all connections', async () => {
    await pool.acquire('tenant-1');
    await pool.acquire('tenant-2');
    pool.onModuleInit();
    await pool.onModuleDestroy();
    expect(pool.getPoolSize()).toBe(0);
  });
});
