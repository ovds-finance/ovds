/**
 * Ovds Full Demo Data Seed
 * Adds: invoices, bills, payroll, leaves, attendance, journal entries,
 *       VAT filings, disaster fund, partnerships, loans, investments,
 *       notifications, apps, audit logs
 */
import { 
  PrismaClient, 
  AttendanceMethod, 
  AttendanceStatus, 
  LeaveType, 
  LeaveStatus, 
} from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { faker } from '@faker-js/faker';
import { parseArgs } from 'node:util';
import * as crypto from 'node:crypto';

// Parse connection from env or fall back to local XAMPP defaults
const dbUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3306/usc';
const urlMatch = dbUrl.match(/^mysql:\/\/([^:]+):(.+)@([^:/@]+):(\d+)\/([^?#\s"']+)/);
let user = 'root', password = '', host = '127.0.0.1', portStr = '3306', database = 'usc';
if (urlMatch) {
  [, user, password, host, portStr, database] = urlMatch;
  password = decodeURIComponent(password);
}
database = database.replace(/['";\s]+$/, '').trim();

const adapter = new PrismaMariaDb({ host, port: Number(portStr), user, password, database, charset: 'utf8mb4' });
const prisma = new PrismaClient({ 
  adapter,
  log: ['error'],
} as any);

function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysFromNow(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function monthsAgo(n: number) { const d = new Date(); d.setMonth(d.getMonth() - n); return d; }

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      environment: { type: 'string' },
    },
    allowPositionals: true,
    strict: false,
  });

  const env = values.environment || process.env.NODE_ENV || 'development';
  console.log(`Seeding demo data in ${env} environment...`);

  // -- Get existing data -----------------------------------------------------
  const company = await (prisma as any).company.findFirst({ where: { name: 'Ovds Technologies PLC' } });
  if (!company) { console.error('Run npm run seed first'); process.exit(1); }

  const employees = await (prisma as any).employee.findMany({ where: { companyId: company.id } });
  const [adminEmp] = employees;

  const accounts = await (prisma as any).account.findMany();
  const cashAcc = accounts.find((a: any) => a.code === '1000');
  const arAcc = accounts.find((a: any) => a.code === '1100');
  const apAcc = accounts.find((a: any) => a.code === '2000');
  const taxAcc = accounts.find((a: any) => a.code === '2100');
  const pensionAcc = accounts.find((a: any) => a.code === '2200');
  const revenueAcc = accounts.find((a: any) => a.code === '4000');
  const salaryAcc = accounts.find((a: any) => a.code === '5100');
  const utilitiesAcc = accounts.find((a: any) => a.code === '5200');
  const cogsAcc = accounts.find((a: any) => a.code === '5000');

  const customers = await (prisma as any).customer.findMany();
  const vendors = await (prisma as any).vendor.findMany();
  const bankAcc = await (prisma as any).bankAccount.findFirst({ where: { companyId: company.id } });

  const categoriesAll = await (prisma as any).category.findMany({ where: { companyId: company.id } });
  const salesCat = categoriesAll.find((c: any) => c.name === 'Sales' && c.type === 'income');
  const utilitiesCat = categoriesAll.find((c: any) => c.name === 'Utilities' && c.type === 'expense');

  // -- 1. Invoices -----------------------------------------------------------
  const invoiceData = [
    { num: 'INV-2026-001', customer: customers[0]?.name ?? 'Addis Trading Co.', amount: 59000, vat: 7500, status: 'PAID', date: daysAgo(45), due: daysAgo(15) },
    { num: 'INV-2026-002', customer: customers[1]?.name ?? 'Tigray Construction PLC', amount: 27600, vat: 3600, status: 'PAID', date: daysAgo(30), due: daysAgo(0) },
    { num: 'INV-2026-003', customer: customers[2]?.name ?? 'Hawassa Textile Factory', amount: 34500, vat: 4500, status: 'PENDING', date: daysAgo(20), due: daysFromNow(10) },
    { num: 'INV-2026-004', customer: customers[3]?.name ?? 'Dire Dawa Logistics', amount: 20700, vat: 2700, status: 'OVERDUE', date: daysAgo(60), due: daysAgo(30) },
    { num: 'INV-2026-005', customer: customers[4]?.name ?? 'Bahir Dar Agriculture', amount: 46000, vat: 6000, status: 'PENDING', date: daysAgo(10), due: daysFromNow(20) },
    { num: 'INV-2026-006', customer: customers[0]?.name ?? 'Addis Trading Co.', amount: 17250, vat: 2250, status: 'DRAFT', date: daysAgo(2), due: daysFromNow(28) },
  ];

  for (const inv of invoiceData) {
    const invId = crypto.randomUUID();
    let jeId = undefined;

    const customer = customers.find((c: any) => c.name === inv.customer);

    // Create Journal Entry for the invoice if accounts are available
    if (arAcc && revenueAcc) {
      jeId = crypto.randomUUID();
      await (prisma as any).journalEntry.create({
        data: {
          id: jeId,
          reference: `JE-${inv.num}`,
          description: `Journal entry for invoice ${inv.num}`,
          status: 'POSTED',
          companyId: company.id,
          journalLine: {
            create: [
              { id: crypto.randomUUID(), accountId: arAcc.id, companyId: company.id, debit: inv.amount + inv.vat, credit: 0, description: 'Accounts Receivable' },
              { id: crypto.randomUUID(), accountId: revenueAcc.id, companyId: company.id, debit: 0, credit: inv.amount, description: 'Sales Revenue' },
              // Note: VAT account not explicitly defined in seed, skipping for simplicity or would go to a VAT liability account
            ]
          }
        }
      });
    }

    const createdInvoice = await (prisma as any).invoice.upsert({
      where: { invoiceNumber: inv.num },
      update: {},
      create: {
        id: invId,
        invoiceNumber: inv.num,
        customerName: inv.customer,
        customerId: customer?.id,
        totalAmount: inv.amount,
        vatAmount: inv.vat,
        currencyCode: 'ETB',
        currencyRate: 1.0,
        status: inv.status,
        date: inv.date,
        dueDate: inv.due,
        companyId: company.id,
        journalEntryId: jeId,
        categoryId: salesCat?.id,
        notes: 'ERP Software Services',
        qrData: `OVDS:${inv.num}:${inv.amount}:ETB`,
      },
    });

    if (inv.status === 'PAID') {
      const payId = crypto.createHash('md5').update(`PAY-INV-${inv.num}`).digest('hex');
      const existingPayment = await (prisma as any).invoicePayment.findUnique({ where: { id: payId } });
      
      if (!existingPayment) {
        let payJeId = undefined;
        if (cashAcc && arAcc) {
          payJeId = crypto.randomUUID();
          await (prisma as any).journalEntry.create({
            data: {
              id: payJeId,
              reference: `PAY-${inv.num}`,
              description: `Payment for invoice ${inv.num}`,
              status: 'POSTED',
              companyId: company.id,
              journalLine: {
                create: [
                  { id: crypto.randomUUID(), accountId: cashAcc.id, companyId: company.id, debit: inv.amount + inv.vat, credit: 0, description: 'Cash Received' },
                  { id: crypto.randomUUID(), accountId: arAcc.id, companyId: company.id, debit: 0, credit: inv.amount + inv.vat, description: 'AR Settlement' },
                ]
              }
            }
          });
        }
        await (prisma as any).invoicePayment.create({
          data: {
            id: payId,
            invoiceId: createdInvoice.id,
            amount: inv.amount + inv.vat,
            currencyCode: 'ETB',
            currencyRate: 1.0,
            method: 'BANK_TRANSFER',
            reference: `REF-${inv.num}`,
            paidAt: inv.due || inv.date,
            companyId: company.id,
            journalEntryId: payJeId,
            bankAccountId: bankAcc?.id,
          }
        });
      }
    }
  }
  console.log(`✔ ${invoiceData.length} invoices seeded`);

  // -- 2. Bills --------------------------------------------------------------
  const billData = [
    { num: 'BILL-2026-001', vendor: vendors[0], cat: 'UTILITIES', amount: 8500, vat: 0, status: 'PAID', due: daysAgo(10) },
    { num: 'BILL-2026-002', vendor: vendors[1], cat: 'UTILITIES', amount: 12000, vat: 0, status: 'PAID', due: daysAgo(5) },
    { num: 'BILL-2026-003', vendor: vendors[2], cat: 'SUPPLIES', amount: 5750, vat: 750, status: 'PENDING', due: daysFromNow(15) },
  ];

  for (const bill of billData) {
    const billId = crypto.randomUUID();
    let jeId = undefined;

    // Determine expense account based on category
    const expenseAcc = bill.cat === 'UTILITIES' ? utilitiesAcc : cogsAcc;

    if (apAcc && expenseAcc) {
      jeId = crypto.randomUUID();
      await (prisma as any).journalEntry.create({
        data: {
          id: jeId,
          reference: `JE-${bill.num}`,
          description: `Journal entry for bill ${bill.num}`,
          status: 'POSTED',
          companyId: company.id,
          journalLine: {
            create: [
              { id: crypto.randomUUID(), accountId: expenseAcc.id, companyId: company.id, debit: bill.amount, credit: 0, description: `${bill.cat} Expense` },
              { id: crypto.randomUUID(), accountId: apAcc.id, companyId: company.id, debit: 0, credit: bill.amount + bill.vat, description: 'Accounts Payable' },
            ]
          }
        }
      });
    }

    const createdBill = await (prisma as any).bill.upsert({
      where: { billNumber: bill.num },
      update: {},
      create: {
        id: billId,
        billNumber: bill.num,
        category: bill.cat,
        amount: bill.amount,
        vatAmount: bill.vat,
        total: bill.amount + bill.vat,
        currencyCode: 'ETB',
        currencyRate: 1.0,
        status: bill.status,
        dueDate: bill.due,
        vendorId: bill.vendor?.id,
        companyId: company.id,
        journalEntryId: jeId,
        categoryId: bill.cat === 'UTILITIES' ? utilitiesCat?.id : undefined,
      },
    });

    if (bill.status === 'PAID') {
      const payId = crypto.createHash('md5').update(`PAY-BILL-${bill.num}`).digest('hex');
      const existingPayment = await (prisma as any).billPayment.findUnique({ where: { id: payId } });

      if (!existingPayment) {
        let payJeId = undefined;
        if (cashAcc && apAcc) {
          payJeId = crypto.randomUUID();
          await (prisma as any).journalEntry.create({
            data: {
              id: payJeId,
              reference: `PAY-${bill.num}`,
              description: `Payment for bill ${bill.num}`,
              status: 'POSTED',
              companyId: company.id,
              journalLine: {
                create: [
                  { id: crypto.randomUUID(), accountId: apAcc.id, companyId: company.id, debit: bill.amount + bill.vat, credit: 0, description: 'AP Settlement' },
                  { id: crypto.randomUUID(), accountId: cashAcc.id, companyId: company.id, debit: 0, credit: bill.amount + bill.vat, description: 'Cash Paid' },
                ]
              }
            }
          });
        }
        await (prisma as any).billPayment.create({
          data: {
            id: payId,
            billId: createdBill.id,
            amount: bill.amount + bill.vat,
            currencyCode: 'ETB',
            currencyRate: 1.0,
            method: 'BANK_TRANSFER',
            reference: `REF-${bill.num}`,
            paidAt: bill.due,
            companyId: company.id,
            journalEntryId: payJeId,
            bankAccountId: bankAcc?.id,
          }
        });
      }
    }
  }
  console.log(`✔ ${billData.length} bills seeded`);

  // -- 3. Payroll Records ----------------------------------------------------
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  for (const emp of employees.slice(0, 10)) {
    const basic = Number(emp.baseSalary) || 15000;
    const pension = basic * 0.07;
    const empPension = basic * 0.11;
    const taxable = basic - pension;
    let pit = 0;
    if (taxable > 14000) pit = 2850 + (taxable - 14000) * 0.35;
    else if (taxable > 10000) pit = 1650 + (taxable - 10000) * 0.30;
    else if (taxable > 7000) pit = 900 + (taxable - 7000) * 0.25;
    else if (taxable > 4000) pit = 300 + (taxable - 4000) * 0.20;
    else if (taxable > 2000) pit = (taxable - 2000) * 0.15;
    const net = basic - pension - pit;

    let jeId = undefined;
    if (salaryAcc && cashAcc && taxAcc && pensionAcc) {
      jeId = crypto.randomUUID();
      await (prisma as any).journalEntry.create({
        data: {
          id: jeId,
          reference: `PAYROLL-${currentYear}-${currentMonth}-${emp.employeeId}`,
          description: `Payroll for ${emp.firstName} ${emp.lastName} - ${currentMonth}/${currentYear}`,
          status: 'POSTED',
          companyId: company.id,
          journalLine: {
            create: [
              { id: crypto.randomUUID(), accountId: salaryAcc.id, companyId: company.id, debit: basic, credit: 0, description: 'Gross Salary Expense' },
              { id: crypto.randomUUID(), accountId: cashAcc.id, companyId: company.id, debit: 0, credit: net, description: 'Net Salary Paid' },
              { id: crypto.randomUUID(), accountId: taxAcc.id, companyId: company.id, debit: 0, credit: pit, description: 'Income Tax Withheld' },
              { id: crypto.randomUUID(), accountId: pensionAcc.id, companyId: company.id, debit: 0, credit: pension, description: 'Pension Withheld' },
            ]
          }
        }
      });
    }

    await (prisma as any).payrollRecord.upsert({
      where: { employeeId_year_month_type: { employeeId: emp.id, year: currentYear, month: currentMonth, type: 'SALARY' } },
      update: {},
      create: {
        employeeId: emp.id, year: currentYear, month: currentMonth, type: 'SALARY',
        basicSalary: basic, grossPay: basic, grossTotal: basic,
        employeePension: pension, employerPension: empPension,
        incomeTax: pit, netPay: net,
        totalDeductions: pension + pit,
        workedDays: 22, presentDays: 22, workingDays: 22,
        status: 'GENERATED', companyId: company.id,
        journalEntryId: jeId,
      },
    });
  }
  console.log(`✔ Payroll records seeded for up to 10 employees`);

  // -- 4. Attendance ---------------------------------------------------------
  let attendanceCount = 0;
  for (const emp of employees.slice(0, 5)) {
    for (let d = 0; d < 5; d++) {
      const checkIn = new Date(); checkIn.setDate(checkIn.getDate() - d); checkIn.setHours(8, Math.floor(Math.random() * 15), 0);
      const checkOut = new Date(checkIn); checkOut.setHours(17, Math.floor(Math.random() * 30), 0);
      try {
        await (prisma as any).attendance.create({
          data: {
            id: crypto.randomUUID(),
            employeeId: emp.id,
            checkIn, checkOut,
            method: AttendanceMethod.BIOMETRIC,
            status: checkIn.getHours() > 8 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
            verified: true, verifiedBy: adminEmp?.id,
            latitude: 9.0320, longitude: 38.7469,
          },
        });
        attendanceCount++;
      } catch (e: any) {
        // Skip duplicate attendance records (unique constraint), fail on anything else
        if (e?.code !== 'P2002') throw e;
      }
    }
  }
  console.log(`✔ ${attendanceCount} attendance records seeded`);

  // -- 5. VAT Filings --------------------------------------------------------
  const vatPeriods = ['2026-01', '2026-02', '2026-03'];
  for (const period of vatPeriods) {
    const output = 15000 + Math.random() * 20000;
    const input = 5000 + Math.random() * 8000;
    await (prisma as any).vatFiling.upsert({
      where: { companyId_period: { companyId: company.id, period } },
      update: {},
      create: {
        period, outputVat: output, inputVat: input,
        netPayable: output - input, collected: output,
        paid: period < '2026-03' ? output - input : 0,
        status: period < '2026-03' ? 'FILED' : 'DRAFT',
        filedAt: period < '2026-03' ? daysAgo(30) : null,
        dueDate: new Date(`${period}-28`),
        companyId: company.id,
      },
    });
  }
  console.log(`✔ ${vatPeriods.length} VAT filings seeded`);

  // -- 6. Revenues & Payments (ovds Style) -----------------------------
  const categories = await (prisma as any).category.findMany({ where: { companyId: company.id } });
  const incomeCat = categories.find((c: any) => c.type === 'income');
  const expenseCat = categories.find((c: any) => c.type === 'expense');

  const revenueData = [
    { amount: 15000, desc: 'Cash sale - walk-in customer', ref: 'REV-001', customer: customers[0] },
    { amount: 25000, desc: 'Consulting fee', ref: 'REV-002', customer: customers[1] },
  ];

  for (const rev of revenueData) {
    await (prisma as any).revenue.create({
      data: {
        date: daysAgo(5),
        amount: rev.amount,
        currencyCode: 'ETB',
        description: rev.desc,
        reference: rev.ref,
        companyId: company.id,
        customerId: rev.customer?.id,
        categoryId: incomeCat?.id,
        accountId: bankAcc?.id,
      }
    });
  }

  const paymentData = [
    { amount: 5000, desc: 'Office supplies', ref: 'PAY-001', vendor: vendors[0] },
    { amount: 12000, desc: 'Rent payment', ref: 'PAY-002', vendor: vendors[1] },
  ];

  for (const pay of paymentData) {
    await (prisma as any).payment.create({
      data: {
        date: daysAgo(10),
        amount: pay.amount,
        currencyCode: 'ETB',
        description: pay.desc,
        reference: pay.ref,
        companyId: company.id,
        vendorId: pay.vendor?.id,
        categoryId: expenseCat?.id,
        accountId: bankAcc?.id,
      }
    });
  }
  console.log(`✔ ${revenueData.length} revenues and ${paymentData.length} payments seeded`);

  // -- 6b. Fund Transfers (ovds Style) ---------------------------------
  const bankAccounts = await (prisma as any).bankAccount.findMany({ where: { companyId: company.id } });
  if (bankAccounts.length >= 2) {
    await (prisma as any).fundTransfer.create({
      data: {
        amount: 5000,
        fromAccountId: bankAccounts[0].id,
        toAccountId: bankAccounts[1].id,
        type: 'INTERNAL',
        status: 'COMPLETED',
        reference: 'FT-001',
        note: 'Internal transfer between accounts',
        companyId: company.id,
      }
    });
    console.log('✔ 1 fund transfer seeded');
  }

  // -- 8. Partnerships -------------------------------------------------------
  const partnerships = [
    { name: 'CBE Digital Banking Partnership', type: 'STRATEGIC_ALLIANCE', status: 'ACTIVE', credibility: 85, tin: '0011223344' },
    { name: 'Ethio Telecom Integration', type: 'SUPPLIER', status: 'ACTIVE', credibility: 78, tin: '0055667788' },
  ];

  for (const p of partnerships) {
    await (prisma as any).partnership.upsert({
      where: { id: `partner-${p.tin}` },
      update: {},
      create: {
        id: `partner-${p.tin}`,
        name: p.name, type: p.type, status: p.status,
        credibilityScore: p.credibility, tin: p.tin,
        startDate: monthsAgo(6), companyId: company.id,
        description: `Strategic partnership with ${p.name}`,
      },
    });
  }
  console.log(`✔ ${partnerships.length} partnerships seeded`);

  // -- 9. Notifications ------------------------------------------------------
  if (adminEmp) {
    const notifications = Array.from({ length: 5 }).map(() => ({
      id: crypto.randomUUID(),
      employeeId: adminEmp.id,   // Notification.employeeId → Employee (not userId → User)
      title: faker.lorem.sentence(),
      message: faker.lorem.paragraph(),
      type: 'INFO',
      isRead: false,
      createdAt: daysAgo(Math.floor(Math.random() * 10)),
    }));
    await (prisma as any).notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });
    console.log('✔ 5 notifications seeded');
  }

  // -- 10. Leaves ------------------------------------------------------------
  for (const emp of employees.slice(0, 5)) {
    await (prisma as any).leave.create({
      data: {
        id: crypto.randomUUID(),
        employeeId: emp.id,
        type: LeaveType.ANNUAL,
        startDate: daysFromNow(10),
        endDate: daysFromNow(15),
        reason: 'Family vacation',
        status: LeaveStatus.APPROVED,
        approvedBy: adminEmp?.id,
      },
    });
  }
  console.log('✔ 5 leave requests seeded');

  // -- 11. Journal Entries ---------------------------------------------------
  if (cashAcc && revenueAcc) {
    await (prisma as any).journalEntry.create({
      data: {
        id: crypto.randomUUID(),
        reference: 'JE-2026-001',
        description: 'Opening balance / Initial investment',
        status: 'POSTED',
        companyId: company.id,
        journalLine: {
          create: [
            { id: crypto.randomUUID(), accountId: cashAcc.id, companyId: company.id, debit: 1000000, credit: 0, description: 'Initial cash injection' },
            { id: crypto.randomUUID(), accountId: revenueAcc.id, companyId: company.id, debit: 0, credit: 1000000, description: 'Initial equity/revenue' },
          ]
        }
      }
    });
    console.log('✔ 1 manual journal entry seeded');
  }

  console.log('\n✅ Demo data seeding complete!');
}

main()
  .catch((e) => {
    console.error('Demo seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
