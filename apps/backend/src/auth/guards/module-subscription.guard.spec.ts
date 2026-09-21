import crypto from 'crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ModuleSubscriptionGuard, REQUIRED_MODULE_KEY_METADATA } from './module-subscription.guard';

describe('ModuleSubscriptionGuard — PKI offline license verification', () => {
  let guard: ModuleSubscriptionGuard;

  const mockReflector = {
    get: vi.fn(),
  };

  const mockPrisma = {
    companyModule: {
      findFirst: vi.fn(),
    },
    licenseActivation: {
      findFirst: vi.fn(),
    },
  };

  const createContext = (overrides: {
    handler?: any;
    request?: Record<string, any>;
    tenantContext?: { companyId?: string | null; role?: string | null };
  } = {}) => {
    const handler = overrides.handler || (() => {});
    if (overrides.request) {
      (handler as any)[REQUIRED_MODULE_KEY_METADATA] = 'premium-module';
    }

    return {
      switchToHttp: () => ({
        getRequest: () => overrides.request || {},
      }),
      getHandler: () => handler,
    } as any;
  };

  beforeEach(() => {
    guard = new ModuleSubscriptionGuard(mockReflector as any, mockPrisma as any);
    vi.clearAllMocks();
    delete (process.env as any).DEPLOYMENT_MODE;
    delete (process.env as any).OFFLINE_PUBLIC_KEY;
  });

  it('returns true when no required module metadata is present', async () => {
    mockReflector.get.mockReturnValue(null);
    const ctx = createContext({ request: {} });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(mockPrisma.companyModule.findFirst).not.toHaveBeenCalled();
  });

  it('bypasses check in ON_PREMISE_SINGLE mode', async () => {
    process.env.DEPLOYMENT_MODE = 'ON_PREMISE_SINGLE';
    mockReflector.get.mockReturnValue('premium-module');
    const ctx = createContext({
      request: { headers: {}, user: { companyId: 'company-1' } },
    });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(mockPrisma.companyModule.findFirst).not.toHaveBeenCalled();
  });

  it('bypasses check for superusers', async () => {
    process.env.DEPLOYMENT_MODE = 'CLOUD_SAAS';
    mockReflector.get.mockReturnValue('premium-module');
    const ctx = createContext({
      request: { headers: {}, user: { companyId: 'company-1', role: 'SUPERADMIN' } },
    });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(mockPrisma.companyModule.findFirst).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when companyId is missing', async () => {
    process.env.DEPLOYMENT_MODE = 'CLOUD_SAAS';
    mockReflector.get.mockReturnValue('premium-module');
    const ctx = createContext({
      request: { headers: {}, user: {} },
      tenantContext: {},
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow('Tenant company identifier context not discovered.');
  });

  it('throws ForbiddenException when module is inactive', async () => {
    process.env.DEPLOYMENT_MODE = 'CLOUD_SAAS';
    mockReflector.get.mockReturnValue('premium-module');
    mockPrisma.companyModule.findFirst.mockResolvedValue(null);

    const ctx = createContext({
      request: { headers: {}, user: { companyId: 'company-1' } },
      tenantContext: { companyId: 'company-1' },
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      "The module 'premium-module' is inactive or uninstalled",
    );
  });

  it('allows access when module is enabled and not premium', async () => {
    process.env.DEPLOYMENT_MODE = 'CLOUD_SAAS';
    mockReflector.get.mockReturnValue('standard-module');
    mockPrisma.companyModule.findFirst.mockResolvedValue({
      companyId: 'company-1',
      moduleKey: 'standard-module',
      isEnabled: true,
      settings: null,
    });

    const ctx = createContext({
      request: { headers: {}, user: { companyId: 'company-1' } },
      tenantContext: { companyId: 'company-1' },
    });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(mockPrisma.licenseActivation.findFirst).not.toHaveBeenCalled();
  });

  it('allows access when premium module has valid license signature', async () => {
    process.env.DEPLOYMENT_MODE = 'CLOUD_SAAS';
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    process.env.OFFLINE_PUBLIC_KEY = publicKey;

    mockReflector.get.mockReturnValue('premium-module');

    const licenseKey = 'LICENSE-KEY';
    const sign = crypto.createSign('SHA256');
    sign.update(licenseKey);
    const signature = sign.sign(privateKey, 'hex');

    mockPrisma.companyModule.findFirst.mockResolvedValue({
      companyId: 'company-1',
      moduleKey: 'premium-module',
      isEnabled: true,
      settings: JSON.stringify({ isPremium: true }),
    });
    mockPrisma.licenseActivation.findFirst.mockResolvedValue({
      companyId: 'company-1',
      licenseKey,
      signature,
    });

    const ctx = createContext({
      request: { headers: {}, user: { companyId: 'company-1' } },
      tenantContext: { companyId: 'company-1' },
    });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('throws ForbiddenException when premium module has invalid license signature', async () => {
    process.env.DEPLOYMENT_MODE = 'CLOUD_SAAS';
    process.env.OFFLINE_PUBLIC_KEY = 'public-key';
    mockReflector.get.mockReturnValue('premium-module');

    mockPrisma.companyModule.findFirst.mockResolvedValue({
      companyId: 'company-1',
      moduleKey: 'premium-module',
      isEnabled: true,
      settings: JSON.stringify({ isPremium: true }),
    });
    mockPrisma.licenseActivation.findFirst.mockResolvedValue({
      companyId: 'company-1',
      licenseKey: 'LICENSE-KEY',
      signature: 'invalid-signature',
    });

    const ctx = createContext({
      request: { headers: {}, user: { companyId: 'company-1' } },
      tenantContext: { companyId: 'company-1' },
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Premium enterprise module activation contains an invalid signature',
    );
  });

  it('throws ForbiddenException when premium module has no license', async () => {
    process.env.DEPLOYMENT_MODE = 'CLOUD_SAAS';
    mockReflector.get.mockReturnValue('premium-module');

    mockPrisma.companyModule.findFirst.mockResolvedValue({
      companyId: 'company-1',
      moduleKey: 'premium-module',
      isEnabled: true,
      settings: JSON.stringify({ isPremium: true }),
    });
    mockPrisma.licenseActivation.findFirst.mockResolvedValue(null);

    const ctx = createContext({
      request: { headers: {}, user: { companyId: 'company-1' } },
      tenantContext: { companyId: 'company-1' },
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      'Premium enterprise module activation contains an invalid signature',
    );
  });
});
