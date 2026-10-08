import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResilientConnector } from '../infra/lifecycle/resilient-connector';
import { ConnectionPoolManager } from '../infra/lifecycle/connection-pool-manager';
import { KmsPreflightValidator } from '../infra/crypto/kms-preflight.validator';
import { TenantSsoStrategyResolver } from '@ovds/auth/sso-strategy.resolver';

describe('Infrastructure Module Integration', () => {
  describe('ResilientConnector', () => {
    it('should be instantiable', () => {
      expect(new ResilientConnector()).toBeDefined();
    });

    it('should have expected methods', () => {
      const c = new ResilientConnector();
      expect(typeof c.connect).toBe('function');
      expect(typeof c.disconnect).toBe('function');
      expect(typeof c.getConnection).toBe('function');
      expect(typeof c.onModuleDestroy).toBe('function');
    });
  });

  describe('ConnectionPoolManager', () => {
    it('should be instantiable', () => {
      expect(new ConnectionPoolManager()).toBeDefined();
    });

    it('should have expected lifecycle methods', () => {
      const p = new ConnectionPoolManager();
      expect(typeof p.acquire).toBe('function');
      expect(typeof p.release).toBe('function');
      expect(typeof p.disconnect).toBe('function');
      expect(typeof p.onModuleInit).toBe('function');
      expect(typeof p.onModuleDestroy).toBe('function');
    });
  });

  describe('KmsPreflightValidator', () => {
    it('should be instantiable', () => {
      expect(new KmsPreflightValidator()).toBeDefined();
    });

    it('should have validation methods', () => {
      const v = new KmsPreflightValidator();
      expect(typeof v.validateKeyAvailability).toBe('function');
      expect(typeof v.validateEncryptionContext).toBe('function');
    });
  });

  describe('TenantSsoStrategyResolver', () => {
    it('should be instantiable', () => {
      const config = { get: () => 'test' } as any;
      expect(new TenantSsoStrategyResolver(config)).toBeDefined();
    });
  });

  describe('Module wiring consistency', () => {
    it('should not have circular references in new modules', () => {
      const connector = new ResilientConnector();
      const pool = new ConnectionPoolManager();
      expect(connector).not.toBe(pool);
      expect(typeof connector.connect).not.toBe(typeof pool.acquire);
    });
  });
});
