/**
 * Tenant Scoping Extension — Unit Tests
 *
 * Verifies that buildTenantScopedExtension correctly injects companyId
 * boundaries into every model operation, and that the BYPASS / super-user
 * paths work as expected.
 *
 * Tests use an in-memory mock delegate to avoid hitting a real database.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildTenantScopedExtension } from './tenant-extension-builder';
import { TENANT_CONTEXT } from './tenant-context.middleware';

interface MockDelegate {
  findMany: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
}

function createMockModel(): MockDelegate {
  return {
    findMany: vi.fn(async (args: any) => args),
    findFirst: vi.fn(async (args: any) => args),
    findUnique: vi.fn(async (args: any) => args),
    create: vi.fn(async (args: any) => args),
    createMany: vi.fn(async (args: any) => args),
    update: vi.fn(async (args: any) => args),
    updateMany: vi.fn(async (args: any) => args),
    delete: vi.fn(async (args: any) => args),
    deleteMany: vi.fn(async (args: any) => args),
  };
}

function createMockQuery(queryFn: any) {
  return queryFn;
}

function runOperation(
  extension: any,
  modelName: string,
  operation: string,
  args: any,
  mockDelegate: MockDelegate,
): any {
  const modelDelegate = mockDelegate;
  return extension.query.$allModels.$allOperations({
    model: modelName,
    operation,
    args,
    query: modelDelegate[operation as keyof MockDelegate] || createMockQuery(modelDelegate.findMany),
  });
}

describe('buildTenantScopedExtension', () => {
  let extension: any;
  let mockDelegate: MockDelegate;
  let getContext: () => any;

  beforeEach(() => {
    mockDelegate = createMockModel();
    getContext = () => ({
      companyId: 'company-A',
      userId: 'user-1',
      role: 'ACCOUNTANT',
    });
    extension = buildTenantScopedExtension(getContext, 'CLOUD_SAAS');
  });

  // ─── READ operations ────────────────────────────────────────────────────────

  it('injects companyId into findFirst where clause for tenant-scoped models', async () => {
    const args = { where: { name: 'Test Account' } };
    await runOperation(extension, 'account', 'findFirst', args, mockDelegate);

    expect(mockDelegate.findFirst).toHaveBeenCalledWith({
      where: { name: 'Test Account', companyId: 'company-A' },
    });
  });

  it('injects companyId into findMany where clause for tenant-scoped models', async () => {
    const args = { where: { status: 'POSTED' } };
    await runOperation(extension, 'journalEntry', 'findMany', args, mockDelegate);

    expect(mockDelegate.findMany).toHaveBeenCalledWith({
      where: { status: 'POSTED', companyId: 'company-A' },
    });
  });

  it('does not filter read operations for non-tenant models (Company)', async () => {
    const args = { where: { id: 'some-id' } };
    await runOperation(extension, 'Company', 'findFirst', args, mockDelegate);

    expect(mockDelegate.findFirst).toHaveBeenCalledWith({ where: { id: 'some-id' } });
    expect(mockDelegate.findFirst.mock.calls[0][0].where).not.toHaveProperty('companyId');
  });

  it('returns null when findUnique where already has a different companyId', async () => {
    const args = { where: { id: 'x', companyId: 'company-B' } };
    const result = await runOperation(extension, 'account', 'findUnique', args, mockDelegate);

    expect(result).toBeNull();
    expect(mockDelegate.findUnique).not.toHaveBeenCalled();
  });

  it('does not filter count operations (intentional — count is read-only and handled by caller)', async () => {
    const args = { where: { status: 'POSTED' } };
    await runOperation(extension, 'journalEntry', 'count', args, mockDelegate);

    expect(mockDelegate.findMany).toHaveBeenCalledWith({ where: { status: 'POSTED' } });
    expect(mockDelegate.findMany.mock.calls[0][0].where).not.toHaveProperty('companyId');
  });

  // ─── CREATE operations ────────────────────────────────────────────────────────

  it('stamps companyId into create data for tenant-scoped models', async () => {
    const args = { data: { name: 'New Account', code: '1000' } };
    await runOperation(extension, 'account', 'create', args, mockDelegate);

    expect(mockDelegate.create).toHaveBeenCalledWith({
      data: { name: 'New Account', code: '1000', companyId: 'company-A' },
    });
  });

  it('stamps companyId into each item of createMany data', async () => {
    const args = {
      data: [
        { name: 'Account 1', code: '1001' },
        { name: 'Account 2', code: '1002' },
      ],
    };
    await runOperation(extension, 'account', 'createMany', args, mockDelegate);

    expect(mockDelegate.createMany).toHaveBeenCalledWith({
      data: [
        { name: 'Account 1', code: '1001', companyId: 'company-A' },
        { name: 'Account 2', code: '1002', companyId: 'company-A' },
      ],
    });
  });

  it('does not stamp companyId into create for non-tenant models (Company)', async () => {
    const args = { data: { name: 'New Company', type: 'MANUFACTURING' } };
    await runOperation(extension, 'Company', 'create', args, mockDelegate);

    expect(mockDelegate.create).toHaveBeenCalledWith({
      data: { name: 'New Company', type: 'MANUFACTURING' },
    });
    expect(mockDelegate.create.mock.calls[0][0].data).not.toHaveProperty('companyId');
  });

  // ─── UPDATE / DELETE operations ─────────────────────────────────────────────

  it('injects companyId into update where clause for tenant-scoped models', async () => {
    const args = { where: { id: 'acc-1' }, data: { name: 'Updated' } };
    await runOperation(extension, 'account', 'update', args, mockDelegate);

    expect(mockDelegate.update).toHaveBeenCalledWith({
      where: { id: 'acc-1', companyId: 'company-A' },
      data: { name: 'Updated' },
    });
  });

  it('injects companyId into delete where clause for tenant-scoped models', async () => {
    const args = { where: { id: 'journal-1' } };
    await runOperation(extension, 'journalEntry', 'delete', args, mockDelegate);

    expect(mockDelegate.delete).toHaveBeenCalledWith({
      where: { id: 'journal-1', companyId: 'company-A' },
    });
  });

  it('injects companyId into updateMany where clause for tenant-scoped models', async () => {
    const args = { where: { status: 'DRAFT' }, data: { status: 'POSTED' } };
    await runOperation(extension, 'journalEntry', 'updateMany', args, mockDelegate);

    expect(mockDelegate.updateMany).toHaveBeenCalledWith({
      where: { status: 'DRAFT', companyId: 'company-A' },
      data: { status: 'POSTED' },
    });
  });

  // ─── BYPASS mode (ON_PREMISE_SINGLE) ─────────────────────────────────────────

  describe('ON_PREMISE_SINGLE deployment mode', () => {
    beforeEach(() => {
      extension = buildTenantScopedExtension(getContext, 'ON_PREMISE_SINGLE');
    });

    it('bypasses all tenant filtering for read operations', async () => {
      const args = { where: { name: 'Test' } };
      await runOperation(extension, 'account', 'findFirst', args, mockDelegate);

      expect(mockDelegate.findFirst).toHaveBeenCalledWith({ where: { name: 'Test' } });
      expect(mockDelegate.findFirst.mock.calls[0][0].where).not.toHaveProperty('companyId');
    });

    it('bypasses all tenant stamping for create operations', async () => {
      const args = { data: { name: 'New Account' } };
      await runOperation(extension, 'account', 'create', args, mockDelegate);

      expect(mockDelegate.create).toHaveBeenCalledWith({ data: { name: 'New Account' } });
      expect(mockDelegate.create.mock.calls[0][0].data).not.toHaveProperty('companyId');
    });
  });

  // ─── Super-user bypass ───────────────────────────────────────────────────────

  describe('super-user roles', () => {
    beforeEach(() => {
      getContext = () => ({
        companyId: 'company-A',
        userId: 'user-1',
        role: 'SUPERADMIN',
      });
      extension = buildTenantScopedExtension(getContext, 'CLOUD_SAAS');
    });

    it('bypasses tenant filtering when role is SUPERADMIN', async () => {
      const args = { where: { name: 'Test' } };
      await runOperation(extension, 'account', 'findFirst', args, mockDelegate);

      expect(mockDelegate.findFirst).toHaveBeenCalledWith({ where: { name: 'Test' } });
      expect(mockDelegate.findFirst.mock.calls[0][0].where).not.toHaveProperty('companyId');
    });

    it('bypasses tenant stamping when role is SPURADMIN', async () => {
      getContext = () => ({ companyId: 'company-A', userId: 'u', role: 'SPURADMIN' });
      extension = buildTenantScopedExtension(getContext, 'CLOUD_SAAS');

      const args = { data: { name: 'New' } };
      await runOperation(extension, 'account', 'create', args, mockDelegate);

      expect(mockDelegate.create.mock.calls[0][0].data).not.toHaveProperty('companyId');
    });
  });

  // ─── No tenant context ───────────────────────────────────────────────────────

  describe('no tenant context', () => {
    beforeEach(() => {
      getContext = () => undefined;
      extension = buildTenantScopedExtension(getContext, 'CLOUD_SAAS');
    });

    it('bypasses filtering when context is undefined', async () => {
      const args = { where: { name: 'Test' } };
      await runOperation(extension, 'account', 'findFirst', args, mockDelegate);

      expect(mockDelegate.findFirst).toHaveBeenCalledWith({ where: { name: 'Test' } });
    });
  });
});
