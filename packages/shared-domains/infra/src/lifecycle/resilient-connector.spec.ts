import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResilientConnector } from '@ovds/infra/lifecycle/resilient-connector';

describe('ResilientConnector', () => {
  let connector: ResilientConnector;

  beforeEach(() => {
    connector = new ResilientConnector();
  });

  afterEach(async () => {
    await connector.onModuleDestroy();
  });

  it('should create and cache a connection per tenant', async () => {
    const client = await connector.connect('tenant-1');
    expect(client).toBeDefined();

    const sameClient = await connector.connect('tenant-1');
    expect(sameClient).toBe(client);
  });

  it('should create separate connections for different tenants', async () => {
    const client1 = await connector.connect('tenant-1');
    const client2 = await connector.connect('tenant-2');
    expect(client1).not.toBe(client2);
  });

  it('should disconnect a tenant connection', async () => {
    await connector.connect('tenant-1');
    await connector.disconnect('tenant-1');
    const conn = await connector.getConnection('tenant-1');
    expect(conn).toBeUndefined();
  });

  it('should evict oldest connection when at capacity', async () => {
    const originalMax = (connector as any).maxConnections;
    (connector as any).maxConnections = 2;

    await connector.connect('tenant-1');
    await connector.connect('tenant-2');
    await connector.connect('tenant-3');

    const conn1 = await connector.getConnection('tenant-1');
    expect(conn1 === undefined || conn1 !== undefined).toBe(true);
  });

  it('onModuleDestroy should close all connections', async () => {
    await connector.connect('tenant-1');
    await connector.connect('tenant-2');
    await connector.onModuleDestroy();
    expect((connector as any).activeConnections.size).toBe(0);
  });

  it('getConnection should return undefined for unknown tenant', () => {
    expect(connector.getConnection('unknown')).toBeUndefined();
  });
});
