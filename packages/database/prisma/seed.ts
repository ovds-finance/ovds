import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { parseArgs } from 'node:util';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import * as fs from 'node:fs';

// -- Load .env.production when NODE_ENV=production -------------------------
// The seed script runs in a plain Node context — dotenv is not auto-loaded.
// We must load it manually before reading process.env.PRISMA_DATABASE_URL.
// The env file lives at the monorepo root (two levels up from packages/database).
const nodeEnv = process.env.NODE_ENV ?? 'development';
// Try monorepo root first, then cwd as fallback
const monoRoot = path.resolve(__dirname, '../../..');
const envFile = path.resolve(monoRoot, `.env.${nodeEnv}`);
const envFileFallback = path.resolve(process.cwd(), `.env.${nodeEnv}`);
const envFilePath = fs.existsSync(envFile) ? envFile : fs.existsSync(envFileFallback) ? envFileFallback : null;
if (envFilePath) {
  const lines = fs.readFileSync(envFilePath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    // Always override — explicit env file takes precedence over shell environment.
    // Prevents stale Plesk shell vars from shadowing PRISMA_DATABASE_URL.
    if (key) {
      process.env[key] = val;
    }
  }
}

// -- Parse DB URL safely (handles passwords with special chars like @ , #) --
const dbUrl = process.env.PRISMA_DATABASE_URL || 'mysql://root:@127.0.0.1:3306/usc';

// Use a regex that captures the password as everything between the first : and the last @host
const urlMatch = dbUrl.match(/^mysql:\/\/([^:]+):(.+)@([^:/@]+):(\d+)\/([^?#\s"']+)/);
let user = 'root', password = '', host = '127.0.0.1', portStr = '3306', database = 'usc';
if (urlMatch) {
  [, user, password, host, portStr, database] = urlMatch;
  // Decode percent-encoded characters (e.g. %40 → @, %2C → ,)
  password = decodeURIComponent(password);
}

// Clean up database name
database = database.replace(/['";\s]+$/, '').trim();

const adapter = new PrismaMariaDb({ 
  host, 
  port: Number(portStr), 
  user, 
  password, 
  database,
  // MySQL 8.4.0 Community Server via TCP/IP · no SSL · utf8mb4
  // @prisma/adapter-mariadb is compatible with MySQL 8.x
  charset: 'utf8mb4',
});
const prisma = new PrismaClient({ 
  adapter,
  log: ['error'],
} as any);

async function seedCore() {
  console.log('Seeding core data...');

  // 1. Companies
  const company = await (prisma as any).company.upsert({
    where: { name: 'Ovds Technologies PLC' },
    update: {},
    create: {
      name: 'Ovds Technologies PLC',
      type: 'LARGE_ENTERPRISE',
      currencyCode: 'ETB',
      settings: JSON.stringify({
        tin: '0012345678', email: 'info@ovds.com',
        phone: '+251911000001', address: 'Addis Ababa, Ethiopia',
        currency: 'ETB', vatRate: 15,
      }),
    },
  });

  const company2 = await (prisma as any).company.upsert({
    where: { name: 'Tigray Manufacturing PLC' },
    update: {},
    create: {
      name: 'Tigray Manufacturing PLC',
      type: 'MANUFACTURING',
      currencyCode: 'ETB',
      settings: JSON.stringify({
        tin: '0087654321', email: 'info@tigmfg.com',
        phone: '+251914000001', address: 'Mekelle, Tigray, Ethiopia',
        currency: 'ETB', vatRate: 15,
      }),
    },
  });

  // 2. Departments
  const deptNames = [
    'Executive', 'ovds', 'Human Resources', 'Information Technology',
    'Operations', 'Sales & Marketing', 'Legal & Compliance', 'Audit', 'Procurement',
  ];
  const departments: any[] = [];
  for (const name of deptNames) {
    const dept = await (prisma as any).department.upsert({
      where: { name_companyId: { name, companyId: company.id } },
      update: {},
      create: { name, companyId: company.id },
    });
    departments.push(dept);
  }

  // 3. Shifts
  await (prisma as any).shift.upsert({
    where: { id: 'shift-morning-ovds' },
    update: {},
    create: { id: 'shift-morning-ovds', name: 'Morning Shift', startTime: '08:00', endTime: '17:00', companyId: company.id },
  });
  await (prisma as any).shift.upsert({
    where: { id: 'shift-evening-ovds' },
    update: {},
    create: { id: 'shift-evening-ovds', name: 'Evening Shift', startTime: '14:00', endTime: '22:00', companyId: company.id },
  });

  // 4. Users & Employees
  const SALT = 10;
  const shiftMorning = await (prisma as any).shift.findUnique({ where: { id: 'shift-morning-ovds' } });
  
  const coreUsers = [
    { username: 'superadmin@ovds.com', password: process.env.SEED_SUPERADMIN_PASSWORD || 'SuperAdmin@2026!', role: 'SPURADMIN', firstName: 'Super', lastName: 'Admin', empId: 'EMP001' },
    // ⚠ IMPORTANT: Change this password immediately after first login in any non-dev environment.
    { username: 'admin@ovds.com', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@ChangeMeNow!', role: 'ADMIN', firstName: 'System', lastName: 'Administrator', empId: 'EMP002' },
    { username: 'hr@ovds.com', password: process.env.SEED_HR_PASSWORD || 'hr_pass_2026', role: 'HR', firstName: 'Helen', lastName: 'Redae', empId: 'EMP003' },
    { username: 'ovds@ovds.com', password: process.env.SEED_FINANCE_PASSWORD || 'fin_pass_2026', role: 'OVDS', firstName: 'Fikadu', lastName: 'Assefa', empId: 'EMP004' },
    { username: 'selam@ovds.com', password: process.env.SEED_ACCOUNTING_PASSWORD || 'acct_pass_2026', role: 'ACCOUNTING', firstName: 'Selam', lastName: 'Girmay', empId: 'EMP005' },
    { username: 'bereket@ovds.com', password: process.env.SEED_AUDITOR_PASSWORD || 'audit_pass_2026', role: 'AUDITOR', firstName: 'Bereket', lastName: 'Tsegaye', empId: 'EMP006' },
    { username: 'employee@ovds.com', password: process.env.SEED_EMPLOYEE_PASSWORD || 'emp_pass_2026', role: 'EMPLOYEE', firstName: 'Elias', lastName: 'Mulugeta', empId: 'EMP007' },
  ];

  for (const u of coreUsers) {
    const hash = await bcrypt.hash(u.password, SALT);
    const user = await (prisma as any).user.upsert({
      where: { username: u.username },
      update: { role: u.role, companyId: company.id, password: hash },
      create: {
        username: u.username,
        password: hash,
        role: u.role,
        companyId: company.id,
      },
    });

    // Create corresponding employee
    await (prisma as any).employee.upsert({
      where: { email: u.username },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        employeeId: u.empId,
        userId: user.id,
      },
      create: {
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.username,
        employeeId: u.empId,
        departmentId: departments[Math.floor(Math.random() * departments.length)].id,
        shiftId: shiftMorning?.id,
        baseSalary: 15000 + Math.random() * 20000,
        userId: user.id,
        companyId: company.id,
      },
    });
  }

  // 5. Holidays
  const holidays = [
    { name: 'Ethiopian New Year (Enkutatash)', date: new Date('2026-09-11') },
    { name: 'Meskel (Finding of the True Cross)', date: new Date('2026-09-27') },
    { name: 'Ethiopian Christmas (Genna)', date: new Date('2027-01-07') },
    { name: 'Ethiopian Epiphany (Timkat)', date: new Date('2027-01-19') },
    { name: 'Victory of Adwa', date: new Date('2027-03-02') },
    { name: 'Good Friday (Siklet)', date: new Date('2027-04-02') },
    { name: 'Easter Sunday (Fasika)', date: new Date('2027-04-04') },
    { name: 'International Labour Day', date: new Date('2027-05-01') },
    { name: 'Patriots Victory Day', date: new Date('2027-05-05') },
    { name: 'Downfall of the Derg', date: new Date('2027-05-28') },
    { name: 'Eid al-Fitr', date: new Date('2027-03-30') },
    { name: 'Eid al-Adha', date: new Date('2027-06-06') },
    { name: 'Prophet Muhammad\'s Birthday (Mawlid)', date: new Date('2026-09-04') },
  ];

  for (const h of holidays) {
    await (prisma as any).holiday.upsert({
      where: { date: h.date },
      update: { name: h.name },
      create: { name: h.name, date: h.date },
    });
  }

  // 6. Tax Rates
  const taxRates = [
    { name: 'Standard VAT', rate: 0.15, type: 'VAT' },
    { name: 'Zero-Rated (Exports)', rate: 0, type: 'VAT' },
    { name: 'Exempt (VAT)', rate: 0, type: 'VAT' },
  ];

  for (const t of taxRates) {
    await (prisma as any).taxrate.upsert({
      where: { name: t.name },
      update: { rate: t.rate, type: t.type },
      create: { 
        id: crypto.randomUUID(),
        name: t.name, 
        rate: t.rate, 
        type: t.type as any 
      },
    });
  }

  // 6b. System Settings — Universal Tax Configuration defaults
  // These keys are read by the TaxesTab in Settings.tsx and by payroll/tax services.
  // Sourced from: Proc. 1341/2024, 1395/2025, 979/2016, Reg. 570/2025, Proc. 1268/2023.
  const taxSettings: Array<{ key: string; value: string; description?: string }> = [
    // Phase 1 — VAT
    { key: 'vat_rate',                 value: '15',        },
    { key: 'vat_threshold',            value: '2000000',   },
    // Phase 2 — TOT
    { key: 'tot_goods_rate',           value: '2',         },
    { key: 'tot_services_rate',        value: '10',        },
    // Phase 3–4 — BIT / PIT
    { key: 'bit_rate',                 value: '30',        },
    { key: 'mat_rate',                 value: '2.5',       },
    // Phase 5 — WHT
    { key: 'withholding_rate',         value: '3',         },
    { key: 'wht_goods_rate',           value: '3',         },
    { key: 'wht_goods_threshold',      value: '10000',     },
    { key: 'wht_service_threshold',    value: '3000',      },
    // Phase 6 — DRRF
    { key: 'drrf_rate',                value: '1',         },
    { key: 'drrf_service_rate',        value: '5',         },
    // Phase 7 — Pension
    { key: 'pension_employee_rate',    value: '7',         },
    { key: 'pension_employer_rate',    value: '11',        },
    { key: 'pension_cap_etb',          value: '15000',     },
    // Phase 9 — Import
    { key: 'import_surtax_rate',       value: '10',        },
    { key: 'advance_bit_import_rate',  value: '3',         },
    // Phase 10 — Stamp Duty
    { key: 'stamp_duty_rate',          value: '1',         },
    { key: 'stamp_duty_min_etb',       value: '500',       },
    // General
    { key: 'fiscal_year_start',        value: '7',         },
    { key: 'default_currency',         value: 'ETB',       },
    // Invoice defaults
    { key: 'invoice_vat_enabled',      value: 'true',      },
    { key: 'invoice_drrf_enabled',     value: 'false',     },
    { key: 'invoice_wht_enabled',      value: 'false',     },
    { key: 'invoice_tot_enabled',      value: 'false',     },
    { key: 'invoice_require_tin',      value: 'false',     },
    { key: 'invoice_show_qr',          value: 'true',      },
    { key: 'invoice_show_logo',        value: 'true',      },
    { key: 'invoice_show_bank_details',value: 'true',      },
  ];

  for (const s of taxSettings) {
    await (prisma as any).systemsetting.upsert({
      where: { key: s.key },
      // Never overwrite user-customised values — only create if absent
      update: {},
      create: { id: crypto.randomUUID(), key: s.key, value: s.value, updatedAt: new Date() },
    });
  }
  console.log(`  ✓ ${taxSettings.length} system setting defaults seeded (tax configuration)`);

  // 7. Chart of Accounts (Ethiopian Standard — ETB)
  const coreAccounts = [
    { code: '1000', name: 'ASSETS', type: 'ASSET', category: 'HEADER' },
    { code: '1100', name: 'Current Assets', type: 'ASSET', category: 'HEADER' },
    { code: '1110', name: 'Cash and Cash Equivalents', type: 'ASSET', category: 'CASH' },
    { code: '1120', name: 'Bank Accounts', type: 'ASSET', category: 'BANK' },
    { code: '1130', name: 'Accounts Receivable', type: 'ASSET', category: 'ACCOUNTS_RECEIVABLE' },
    { code: '1140', name: 'Inventory', type: 'ASSET', category: 'INVENTORY' },
    { code: '1150', name: 'Prepaid Expenses', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '1200', name: 'Non-Current Assets', type: 'ASSET', category: 'HEADER' },
    { code: '1210', name: 'Property, Plant and Equipment', type: 'ASSET', category: 'FIXED_ASSET' },
    { code: '1220', name: 'Accumulated Depreciation', type: 'ASSET', category: 'FIXED_ASSET' },
    { code: '1230', name: 'Intangible Assets', type: 'ASSET', category: 'FIXED_ASSET' },
    { code: '1240', name: 'Long-term Investments', type: 'ASSET', category: 'INVESTMENT' },
    { code: '2000', name: 'LIABILITIES', type: 'LIABILITY', category: 'HEADER' },
    { code: '2100', name: 'Current Liabilities', type: 'LIABILITY', category: 'HEADER' },
    { code: '2110', name: 'Accounts Payable', type: 'LIABILITY', category: 'ACCOUNTS_PAYABLE' },
    { code: '2120', name: 'Accrued Expenses', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
    { code: '2130', name: 'Short-term Loans', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
    { code: '2140', name: 'VAT Payable', type: 'LIABILITY', category: 'TAX' },
    { code: '2150', name: 'TOT Payable', type: 'LIABILITY', category: 'TAX' },
    { code: '2160', name: 'WHT Payable', type: 'LIABILITY', category: 'TAX' },
    { code: '2170', name: 'Pension Payable', type: 'LIABILITY', category: 'TAX' },
    { code: '2200', name: 'Non-Current Liabilities', type: 'LIABILITY', category: 'HEADER' },
    { code: '2210', name: 'Long-term Loans', type: 'LIABILITY', category: 'LONG_TERM_LIABILITY' },
    { code: '2220', name: 'Deferred Tax Liabilities', type: 'LIABILITY', category: 'TAX' },
    { code: '3000', name: 'EQUITY', type: 'EQUITY', category: 'HEADER' },
    { code: '3100', name: 'Share Capital', type: 'EQUITY', category: 'EQUITY' },
    { code: '3200', name: 'Retained Earnings', type: 'EQUITY', category: 'EQUITY' },
    { code: '3300', name: 'Current Year Profit/Loss', type: 'EQUITY', category: 'EQUITY' },
    { code: '4000', name: 'REVENUE', type: 'INCOME', category: 'HEADER' },
    { code: '4100', name: 'Sales Revenue', type: 'INCOME', category: 'REVENUE' },
    { code: '4200', name: 'Service Revenue', type: 'INCOME', category: 'REVENUE' },
    { code: '4300', name: 'Interest Income', type: 'INCOME', category: 'OTHER_INCOME' },
    { code: '4400', name: 'Other Income', type: 'INCOME', category: 'OTHER_INCOME' },
    { code: '5000', name: 'COST OF GOODS SOLD', type: 'EXPENSE', category: 'HEADER' },
    { code: '5100', name: 'Cost of Sales', type: 'EXPENSE', category: 'COST_OF_GOODS_SOLD' },
    { code: '5200', name: 'Purchase Returns', type: 'EXPENSE', category: 'COST_OF_GOODS_SOLD' },
    { code: '6000', name: 'EXPENSES', type: 'EXPENSE', category: 'HEADER' },
    { code: '6100', name: 'Salaries and Wages', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '6110', name: 'Employee Benefits', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '6200', name: 'Rent Expense', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '6300', name: 'Utilities', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '6400', name: 'Office Supplies', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '6500', name: 'Depreciation Expense', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '6600', name: 'Interest Expense', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '6700', name: 'Professional Fees', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '6800', name: 'Marketing and Advertising', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '6900', name: 'Bad Debt Expense', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '7000', name: 'TAX EXPENSES', type: 'EXPENSE', category: 'HEADER' },
    { code: '7100', name: 'Business Income Tax (BIT)', type: 'EXPENSE', category: 'TAX' },
    { code: '7200', name: 'Property Tax', type: 'EXPENSE', category: 'TAX' },
    { code: '7300', name: 'Excise Tax', type: 'EXPENSE', category: 'TAX' },
  ];

  for (const c of [company, company2]) {
    for (const acc of coreAccounts) {
      await (prisma as any).account.upsert({
        where: { code_companyId: { code: acc.code, companyId: c.id } },
        update: { name: acc.name, type: acc.type, category: acc.category },
        create: {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          category: acc.category,
          companyId: c.id,
        },
      });
    }
  }

  // 8. Currencies (ovds Style)
  const currencies = [
    { name: 'Ethiopian Birr', code: 'ETB', symbol: 'Br', rate: 1.0 },
    { name: 'US Dollar', code: 'USD', symbol: '$', rate: 120.5 },
    { name: 'Euro', code: 'EUR', symbol: '€', rate: 128.2 },
  ];

  for (const curr of currencies) {
    await (prisma as any).currency.upsert({
      where: { code: curr.code },
      update: { name: curr.name, symbol: curr.symbol, rate: curr.rate },
      create: { ...curr },
    });
  }

  // 9. Categories (ovds Style)
  const categoryTemplates = [
    { name: 'Sales', type: 'income', color: '#10b981' },
    { name: 'Consulting', type: 'income', color: '#3b82f6' },
    { name: 'Other Income', type: 'income', color: '#6366f1' },
    { name: 'Rent', type: 'expense', color: '#f59e0b' },
    { name: 'Utilities', type: 'expense', color: '#ef4444' },
    { name: 'Travel', type: 'expense', color: '#8b5cf6' },
    { name: 'Supplies', type: 'expense', color: '#ec4899' },
    { name: 'Other Expense', type: 'expense', color: '#94a3b8' },
    { name: 'Products', type: 'item', color: '#10b981' },
    { name: 'Services', type: 'item', color: '#3b82f6' },
  ];

  for (const c of [company, company2]) {
    const cats: any[] = [];
    for (const cat of categoryTemplates) {
      const created = await (prisma as any).category.upsert({
        where: { name_type_companyId: { name: cat.name, type: cat.type, companyId: c.id } },
        update: { color: cat.color },
        create: { ...cat, companyId: c.id },
      });
      cats.push(created);
    }

    // 10. Items (ovds Style)
    const productCat = cats.find(cat => cat.name === 'Products' && cat.type === 'item');
    const items = [
      { name: 'ERP Software License', code: `ERP-${c.id.slice(0, 4)}`, category: 'Software', salePrice: 50000, costPrice: 20000, vatRate: 15 },
      { name: 'Consulting Hour', code: `CONS-${c.id.slice(0, 4)}`, category: 'Service', salePrice: 1500, costPrice: 500, vatRate: 15 },
    ];

    for (const item of items) {
      await (prisma as any).item.upsert({
        where: { code: item.code },
        update: { categoryId: productCat?.id },
        create: { ...item, companyId: c.id, categoryId: productCat?.id },
      });
    }

    // 11. Bank Accounts (ovds Style)
    const bankAccounts = [
      { name: 'CBE Business Account', accountNumber: '1000123456789', bankName: 'Commercial Bank of Ethiopia', currencyCode: 'ETB', openingBalance: 100000, balance: 100000 },
      { name: 'Telebirr Merchant', accountNumber: '251911000001', bankName: 'Telebirr', currencyCode: 'ETB', openingBalance: 5000, balance: 5000 },
    ];

    for (const ba of bankAccounts) {
      await (prisma as any).bankAccount.upsert({
        where: { id: `ba-${ba.accountNumber}-${c.id.slice(0, 4)}` },
        update: { balance: ba.balance },
        create: { id: `ba-${ba.accountNumber}-${c.id.slice(0, 4)}`, ...ba, companyId: c.id },
      });
    }

    // 12. Customers (ovds Style)
    const customers = [
      { name: 'Addis Trading Co.', email: 'info@addistrading.com', currencyCode: 'ETB', tin: '0011223344' },
      { name: 'Tigray Construction PLC', email: 'info@tigrayconst.com', currencyCode: 'ETB', tin: '0055667788' },
      { name: 'Hawassa Textile Factory', email: 'info@hawassatextile.com', currencyCode: 'ETB', tin: '0099887766' },
      { name: 'Dire Dawa Logistics', email: 'info@diredawalogistics.com', currencyCode: 'ETB', tin: '0022334455' },
      { name: 'Bahir Dar Agriculture', email: 'info@bahirdaragri.com', currencyCode: 'ETB', tin: '0044556677' },
    ];

    for (const cust of customers) {
      await (prisma as any).customer.upsert({
        where: { name_companyId: { name: cust.name, companyId: c.id } },
        update: { email: cust.email, currencyCode: cust.currencyCode, tin: cust.tin },
        create: { ...cust, companyId: c.id },
      });
    }

    // 13. Vendors (ovds Style)
    const vendors = [
      { name: 'Ethio Telecom', email: 'info@ethiotelecom.et', currencyCode: 'ETB', tin: '1122334455' },
      { name: 'Ethiopian Electric Utility', email: 'info@eeu.et', currencyCode: 'ETB', tin: '5566778899' },
      { name: 'Global Supplies PLC', email: 'info@globalsupplies.com', currencyCode: 'USD', tin: '9988776655' },
    ];

    for (const vend of vendors) {
      await (prisma as any).vendor.upsert({
        where: { id: `vend-${vend.tin}-${c.id.slice(0, 4)}` },
        update: { email: vend.email, currencyCode: vend.currencyCode, tin: vend.tin },
        create: { id: `vend-${vend.tin}-${c.id.slice(0, 4)}`, ...vend, companyId: c.id },
      });
    }

    // 14. Entities (branches / subsidiaries)
    const entities = [
      { name: 'Head Office', code: 'HQ', parentId: null },
      { name: 'Mekelle Branch', code: 'MTL', parentId: null },
      { name: 'Hawassa Branch', code: 'HWS', parentId: null },
    ];

    for (const entity of entities) {
      await (prisma as any).entity.upsert({
        where: { id: `ent-${entity.code}-${c.id.slice(0, 4)}` },
        update: { name: entity.name },
        create: { id: `ent-${entity.code}-${c.id.slice(0, 4)}`, ...entity, companyId: c.id },
      });
    }
  }

  return { company, company2, departments };
}

async function seedDevelopment(count: number = 50) {
  console.log(`Seeding development data (${count} users/employees)...`);
  const { company, departments } = await seedCore();
  await seedMonetizationProducts();

  const SALT = 10;
  const dummyPassword = await bcrypt.hash('password123', SALT);

  const testUsersData = Array.from({ length: count }).map(() => ({
    username: faker.internet.email().toLowerCase(),
    password: dummyPassword,
    role: 'EMPLOYEE',
    companyId: company.id,
  }));

  await (prisma as any).user.createMany({
    data: testUsersData,
    skipDuplicates: true,
  });

  const createdUsers = await (prisma as any).user.findMany({
    where: { 
      username: { in: testUsersData.map(u => u.username) } 
    },
    select: { id: true, username: true }
  });

  const shiftMorningForTest = await (prisma as any).shift.findUnique({ where: { id: 'shift-morning-ovds' } });

  const testEmployeesData = createdUsers.map((u: any) => ({
    id: uuidv4(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: u.username,
    employeeId: faker.string.alphanumeric(8).toUpperCase(),
    departmentId: departments[Math.floor(Math.random() * departments.length)].id,
    shiftId: shiftMorningForTest?.id,
    baseSalary: 10000 + Math.random() * 30000,
    userId: u.id,
    companyId: company.id,
  }));

  await (prisma as any).employee.createMany({
    data: testEmployeesData,
    skipDuplicates: true,
  });

  console.log(`✔ ${count} random users and employees seeded`);
}

async function seedMonetizationProducts() {
  console.log('  → Seeding monetization products...');

  const STARTER_FEATURES = JSON.stringify([
    'plan:starter',
    'feature:vat',
    'feature:einvoice',
    'feature:payroll-basic',
    'feature:leave',
  ]);

  const BUSINESS_FEATURES = JSON.stringify([
    'plan:starter',
    'plan:business',
    'feature:vat',
    'feature:einvoice',
    'feature:payroll-basic',
    'feature:payroll-unlimited',
    'feature:leave',
    'feature:gl',
    'feature:bank-recon',
    'feature:ocr',
    'feature:ifrs-reports',
    'feature:period-close',
    'feature:biometrics',
    'feature:shifts',
    'feature:drrf',
    'feature:bit',
    'feature:erca-dashboard',
  ]);

  const ENTERPRISE_FEATURES = JSON.stringify([
    'plan:starter',
    'plan:business',
    'plan:enterprise',
    'feature:vat',
    'feature:einvoice',
    'feature:payroll-basic',
    'feature:payroll-unlimited',
    'feature:leave',
    'feature:gl',
    'feature:bank-recon',
    'feature:ocr',
    'feature:ifrs-reports',
    'feature:period-close',
    'feature:biometrics',
    'feature:shifts',
    'feature:drrf',
    'feature:bit',
    'feature:erca-dashboard',
    'feature:audit-outsourcing',
    'feature:multi-company',
    'feature:white-label',
    'feature:on-premise',
  ]);

  const products = [
    {
      name: 'Starter Plan',
      slug: 'plan:starter',
      type: 'SUBSCRIPTION',
      featureKeys: STARTER_FEATURES,
      priceMonthly: 2500,
      priceAnnual: 25000,
      priceLifetime: 0,
      trialDays: 14,
      isActive: true,
    },
    {
      name: 'Business Plan',
      slug: 'plan:business',
      type: 'SUBSCRIPTION',
      featureKeys: BUSINESS_FEATURES,
      priceMonthly: 7500,
      priceAnnual: 75000,
      priceLifetime: 0,
      trialDays: 14,
      isActive: true,
    },
    {
      name: 'Enterprise Plan',
      slug: 'plan:enterprise',
      type: 'SUBSCRIPTION',
      featureKeys: ENTERPRISE_FEATURES,
      priceMonthly: 0,   // custom pricing
      priceAnnual: 0,
      priceLifetime: 0,
      trialDays: 14,
      isActive: true,
    },
    {
      name: 'Business Lifetime',
      slug: 'plan:business:lifetime',
      type: 'LIFETIME',
      featureKeys: BUSINESS_FEATURES,
      priceMonthly: 0,
      priceAnnual: 0,
      priceLifetime: 150000,
      trialDays: 0,
      isActive: true,
    },
  ];

  for (const p of products) {
    await (prisma as any).monetizationProduct.upsert({
      where: { slug: p.slug },
      create: p,
      update: {
        name: p.name,
        featureKeys: p.featureKeys,
        priceMonthly: p.priceMonthly,
        priceAnnual: p.priceAnnual,
        priceLifetime: p.priceLifetime,
        trialDays: p.trialDays,
        isActive: p.isActive,
      },
    });
    console.log(`    ✓ ${p.name} (${p.slug})`);
  }
}

async function seedProduction() {
  console.log('Seeding production data...');
  await seedCore();
  await seedMonetizationProducts();
}

async function seedTest() {
  console.log('Seeding test data...');
  await seedCore();
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      environment: { type: 'string' },
      count: { type: 'string' },
    },
    // Allow unknown positional args to be ignored rather than throwing.
    // Prevents ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL if a '--' separator
    // leaks through from npm script invocation.
    allowPositionals: true,
    strict: false,
  });

  const env = values.environment || process.env.NODE_ENV || 'development';
  const count = values.count ? parseInt(String(values.count), 10) : 50;

  console.log(`Starting seeding in ${env} environment...`);

  switch (env) {
    case 'production':
      await seedProduction();
      break;
    case 'test':
      await seedTest();
      break;
    default:
      await seedDevelopment(count);
  }

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
