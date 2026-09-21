/**
 * DisasterFundService
 *
 * Centralises all business logic for the Disaster Risk Management Fund
 * (Ethiopian Proclamation 1145/2019 & Regulation 570/2025).
 *
 * Levy rates per Regulation 570/2025:
 *   LOAN_VALUE             1 %   of disbursed loan
 *   INSURANCE_PREMIUM      1 %   of premium
 *   SERVICE_FEES           5 %   bank / mobile service fees
 *   AIRTIME_SALES          5 %   telecom airtime revenue
 *   TICKET_SALES           ETB 100 flat per domestic flight ticket
 *   ANNUAL_SALES_REVENUE   5 %   of paid invoice subtotals
 *   FUEL_SALES             ETB 200 flat per fuel issuance
 *   TOBACCO_ALCOHOL        5 %   of sales value
 *   GOVERNMENT_SERVICES    ETB 200 flat per government service rendered
 *   GOVERNMENT_BUDGET      0.25% of annual government budget
 *   SALARY_CONTRIBUTION    1 %   of net salary per payroll period
 *   DIVIDEND               1 %   of dividend distributions
 *   CONTRABAND_PROCEEDS    1 %   of confiscated goods value
 *   TELECOM_DIGITAL        5 %   of telecom/digital service revenue
 *   OTHER                  1 %   default fallback
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PAGINATION_DEFAULT_LIMIT } from '@ovds/shared';

import { PrismaService } from '../../common/prisma.service';

// ── Levy rate table ─────────────────────────────────────────────────────────

type FundCategory =
  | 'LOAN_VALUE'
  | 'INSURANCE_PREMIUM'
  | 'SERVICE_FEES'
  | 'AIRTIME_SALES'
  | 'TICKET_SALES'
  | 'ANNUAL_SALES_REVENUE'
  | 'FUEL_SALES'
  | 'TOBACCO_ALCOHOL'
  | 'GOVERNMENT_SERVICES'
  | 'GOVERNMENT_BUDGET'
  | 'SALARY_CONTRIBUTION'
  | 'DIVIDEND'
  | 'CONTRABAND_PROCEEDS'
  | 'TELECOM_DIGITAL'
  | 'OTHER';

export interface LevyRuleDefinition {
  category: FundCategory;
  description: string;
  rate: number;      // percentage rate (0 for flat)
  flat: number;      // flat ETB amount per unit (0 for rate-based)
  isQuarterly: boolean;
  exampleBase: number;
  exampleLevy: number;
}

const LEVY_RULES: LevyRuleDefinition[] = [
  { category: 'LOAN_VALUE',           description: '1% of disbursed loan amount',                    rate: 1,    flat: 0,   isQuarterly: false, exampleBase: 100000, exampleLevy: 1000   },
  { category: 'INSURANCE_PREMIUM',    description: '1% of insurance premium',                         rate: 1,    flat: 0,   isQuarterly: false, exampleBase: 50000,  exampleLevy: 500    },
  { category: 'SERVICE_FEES',         description: '5% of bank & mobile service fees',                rate: 5,    flat: 0,   isQuarterly: true,  exampleBase: 20000,  exampleLevy: 1000   },
  { category: 'AIRTIME_SALES',        description: '5% of telecom airtime revenue',                   rate: 5,    flat: 0,   isQuarterly: true,  exampleBase: 500000, exampleLevy: 25000  },
  { category: 'TICKET_SALES',         description: 'ETB 100 flat per domestic flight ticket',         rate: 0,    flat: 100, isQuarterly: false, exampleBase: 1,      exampleLevy: 100    },
  { category: 'ANNUAL_SALES_REVENUE', description: '5% of paid invoice subtotals',                   rate: 5,    flat: 0,   isQuarterly: true,  exampleBase: 1000000,exampleLevy: 50000  },
  { category: 'FUEL_SALES',           description: 'ETB 200 flat per fuel issuance',                  rate: 0,    flat: 200, isQuarterly: false, exampleBase: 1,      exampleLevy: 200    },
  { category: 'TOBACCO_ALCOHOL',      description: '5% of sales value',                               rate: 5,    flat: 0,   isQuarterly: true,  exampleBase: 100000, exampleLevy: 5000   },
  { category: 'GOVERNMENT_SERVICES',  description: 'ETB 200 flat per government service rendered',    rate: 0,    flat: 200, isQuarterly: false, exampleBase: 1,      exampleLevy: 200    },
  { category: 'GOVERNMENT_BUDGET',    description: '0.25% of annual government budget',               rate: 0.25, flat: 0,   isQuarterly: false, exampleBase: 10000000,exampleLevy:25000  },
  { category: 'SALARY_CONTRIBUTION',  description: '1% of net salary per payroll period',             rate: 1,    flat: 0,   isQuarterly: false, exampleBase: 30000,  exampleLevy: 300    },
  { category: 'DIVIDEND',             description: '1% of dividend distributions',                    rate: 1,    flat: 0,   isQuarterly: false, exampleBase: 200000, exampleLevy: 2000   },
  { category: 'CONTRABAND_PROCEEDS',  description: '1% of confiscated goods value',                   rate: 1,    flat: 0,   isQuarterly: false, exampleBase: 50000,  exampleLevy: 500    },
  { category: 'TELECOM_DIGITAL',      description: '5% of telecom/digital service revenue (Reg. 570/2025)', rate: 5, flat: 0, isQuarterly: true, exampleBase: 300000, exampleLevy: 15000 },
  { category: 'OTHER',                description: '1% — default fallback for uncategorized',         rate: 1,    flat: 0,   isQuarterly: false, exampleBase: 10000,  exampleLevy: 100    },
];

const LEVY_RULE_MAP = new Map<FundCategory, LevyRuleDefinition>(
  LEVY_RULES.map((r) => [r.category, r]),
);

export function calculateLevy(category: FundCategory, baseAmount: number): number {
  const rule = LEVY_RULE_MAP.get(category);
  if (!rule) return baseAmount * 0.01;
  if (rule.flat > 0) return rule.flat * baseAmount; // baseAmount = unit count for flat
  return (baseAmount * rule.rate) / 100;
}

// ── ERCA submission model (in-memory store backed by DisasterFundAuditLog) ──
// ERCA submissions are stored in DisasterFundAuditLog with action='ERCA_*'
// plus a JSON detail field so we don't need a separate migration.

@Injectable()
export class DisasterFundService {
  private readonly logger = new Logger(DisasterFundService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Levy calculation helpers ──────────────────────────────────────────────

  calcLevy(category: FundCategory, baseAmount: number): number {
    return calculateLevy(category, baseAmount);
  }

  getRules(): LevyRuleDefinition[] {
    return LEVY_RULES;
  }

  // ── Contributions (root routes) ───────────────────────────────────────────

  async listContributions(params: {
    companyId?: string;
    status?: string;
    category?: string;
    period?: string;
    search?: string;
    page?: number;
    take?: number;
  }) {
    const pg = params.page ?? 1;
    const lm = params.take ?? PAGINATION_DEFAULT_LIMIT;
    const where: Record<string, unknown> = {};
    if (params.companyId) where.companyId = params.companyId;
    if (params.status)    where.status    = params.status;
    if (params.category)  where.category  = params.category;
    if (params.period)    where.period    = params.period;
    if (params.search) {
      where.OR = [
        { description: { contains: params.search } },
        { notes:        { contains: params.search } },
        { period:       { contains: params.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.disasterFundContribution.findMany({
        where,
        skip: (pg - 1) * lm,
        take: lm,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.disasterFundContribution.count({ where }),
    ]);

    return { data, total, page: pg, take: lm, pages: Math.ceil(total / lm) };
  }

  async createContribution(body: Record<string, unknown>, userId?: string) {
    if (!body.category) throw new BadRequestException('category is required');
    if (!body.period)   throw new BadRequestException('period is required');

    const category = body.category as FundCategory;
    const baseAmount = Number(body.baseAmount ?? 0);
    const levyAmount = body.levyAmount !== undefined
      ? Number(body.levyAmount)
      : this.calcLevy(category, baseAmount);

    const data = await this.prisma.disasterFundContribution.create({
      data: { ...body, baseAmount, levyAmount } as any,
    });

    // write audit log
    await this.writeAuditLog(data.id, 'CREATED', undefined, 'PENDING', userId).catch(() => {});
    return data;
  }

  async updateContribution(id: string, body: Record<string, unknown>, companyId?: string, userId?: string) {
    const existing = await this.prisma.disasterFundContribution.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Contribution ${id} not found`);

    const data = await this.prisma.disasterFundContribution.update({
      where: { id },
      data: body as any,
    });

    if (body.status && body.status !== (existing as any).status) {
      await this.writeAuditLog(id, 'STATUS_CHANGED', (existing as any).status, body.status as string, userId).catch(() => {});
    }
    return data;
  }

  async deleteContribution(id: string, companyId?: string) {
    const existing = await this.prisma.disasterFundContribution.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) throw new NotFoundException(`Contribution ${id} not found`);
    if ((existing as any).status !== 'PENDING') {
      throw new BadRequestException('Only PENDING contributions can be deleted');
    }
    await this.writeAuditLog(id, 'DELETED', (existing as any).status, undefined, undefined).catch(() => {});
    await this.prisma.disasterFundContribution.delete({ where: { id } });
  }

  // ── Dashboard stats ───────────────────────────────────────────────────────

  async getDashboardStats(companyId?: string) {
    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;

    const contributions = await this.prisma.disasterFundContribution.findMany({ where });

    const summary = contributions.reduce(
      (acc, c: any) => {
        acc.totalLevy     += Number(c.levyAmount ?? 0);
        acc.totalRemitted += c.status === 'REMITTED' ? Number(c.levyAmount ?? 0) : 0;
        acc.totalPending  += c.status === 'PENDING'  ? Number(c.levyAmount ?? 0) : 0;
        acc.totalOverdue  += c.status === 'OVERDUE'  ? Number(c.levyAmount ?? 0) : 0;
        acc.byCategory[c.category] = (acc.byCategory[c.category] ?? 0) + Number(c.levyAmount ?? 0);
        acc.count.total++;
        if (c.status === 'REMITTED') acc.count.remitted++;
        if (c.status === 'PENDING')  acc.count.pending++;
        if (c.status === 'OVERDUE')  acc.count.overdue++;
        return acc;
      },
      {
        totalLevy: 0, totalRemitted: 0, totalPending: 0, totalOverdue: 0,
        byCategory: {} as Record<string, number>,
        count: { total: 0, remitted: 0, pending: 0, overdue: 0 },
      },
    );

    // trends — group by period, last 12 periods
    const trendMap = new Map<string, { total: number; remitted: number; pending: number; overdue: number }>();
    for (const c of contributions as any[]) {
      const p = c.period ?? 'unknown';
      if (!trendMap.has(p)) trendMap.set(p, { total: 0, remitted: 0, pending: 0, overdue: 0 });
      const t = trendMap.get(p)!;
      const lv = Number(c.levyAmount ?? 0);
      t.total     += lv;
      t.remitted  += c.status === 'REMITTED' ? lv : 0;
      t.pending   += c.status === 'PENDING'  ? lv : 0;
      t.overdue   += c.status === 'OVERDUE'  ? lv : 0;
    }
    const trends = [...trendMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([period, v]) => ({ period, ...v }));

    // upcoming dues — next 30 days
    const now  = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400_000);
    const upcoming = (contributions as any[]).filter(
      (c) => c.dueDate && c.status !== 'REMITTED' && new Date(c.dueDate) <= in30,
    );

    // recent audit
    const recentAudit = await this.prisma.disasterFundAuditLog
      .findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
      .catch(() => []);

    // forecast — extrapolate last-period average
    const sortedPeriods = [...trendMap.entries()].sort(([a], [b]) => a.localeCompare(b));
    const lastPeriods = sortedPeriods.slice(-3);
    const avgLevy = lastPeriods.length
      ? lastPeriods.reduce((s, [, v]) => s + v.total, 0) / lastPeriods.length
      : 0;

    const nextDate = new Date(now);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const forecast = {
      nextPeriod: `${nextDate.getFullYear()}-Q${Math.ceil((nextDate.getMonth() + 1) / 3)}`,
      totalForecast: avgLevy,
      basedOnPeriods: lastPeriods.map(([p]) => p),
    };

    return { summary, trends, upcoming, recentAudit, forecast };
  }

  // ── Year summary ──────────────────────────────────────────────────────────

  async getYearSummary(year: number, companyId?: string) {
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const all = await this.prisma.disasterFundContribution.findMany({ where });

    // filter by year embedded in period string (e.g. "2025-Q1", "2025-01")
    const yearStr = String(year);
    const yearContribs = (all as any[]).filter((c) => (c.period ?? '').startsWith(yearStr));

    const quarters: Record<number, { total: number; remitted: number; pending: number; overdue: number; count: number }> = {};
    for (let q = 1; q <= 4; q++) quarters[q] = { total: 0, remitted: 0, pending: 0, overdue: 0, count: 0 };

    for (const c of yearContribs) {
      const qMatch = (c.period ?? '').match(/Q(\d)/);
      const q = qMatch ? parseInt(qMatch[1], 10) : Math.ceil((new Date(c.createdAt).getMonth() + 1) / 3);
      if (!quarters[q]) quarters[q] = { total: 0, remitted: 0, pending: 0, overdue: 0, count: 0 };
      const lv = Number(c.levyAmount ?? 0);
      quarters[q].total     += lv;
      quarters[q].remitted  += c.status === 'REMITTED' ? lv : 0;
      quarters[q].pending   += c.status === 'PENDING'  ? lv : 0;
      quarters[q].overdue   += c.status === 'OVERDUE'  ? lv : 0;
      quarters[q].count++;
    }

    const quarterSummaries = Object.entries(quarters).map(([q, v]) => ({
      quarter: parseInt(q, 10),
      period: `${year}-Q${q}`,
      ...v,
    }));

    const totals = yearContribs.reduce(
      (acc, c: any) => {
        const lv = Number(c.levyAmount ?? 0);
        acc.totalLevy     += lv;
        acc.totalRemitted += c.status === 'REMITTED' ? lv : 0;
        acc.totalPending  += c.status === 'PENDING'  ? lv : 0;
        acc.totalOverdue  += c.status === 'OVERDUE'  ? lv : 0;
        acc.count++;
        return acc;
      },
      { totalLevy: 0, totalRemitted: 0, totalPending: 0, totalOverdue: 0, count: 0 },
    );

    return { year, quarters: quarterSummaries, ...totals };
  }

  // ── Schedules ─────────────────────────────────────────────────────────────

  async getScheduleForYear(year: number) {
    return this.prisma.disasterFundSchedule.findMany({
      where: { year },
      orderBy: [{ quarter: 'asc' }, { category: 'asc' }],
    });
  }

  async generateSchedule(year: number, companyId?: string) {
    // Build one schedule entry per quarter × category
    const existing = await this.prisma.disasterFundSchedule.findMany({ where: { year } });
    const existingKeys = new Set(existing.map((s: any) => `${s.quarter}::${s.category}`));

    const created: any[] = [];
    for (let q = 1; q <= 4; q++) {
      // Due date: last day of the quarter + 15 days grace
      const month = q * 3;
      const dueDate = new Date(year, month, 15); // e.g. Q1 → Apr 15
      for (const rule of LEVY_RULES) {
        const key = `${q}::${rule.category}`;
        if (existingKeys.has(key)) continue;
        const entry = await this.prisma.disasterFundSchedule.create({
          data: {
            year,
            quarter: q,
            category: rule.category,
            dueDate,
            estimatedLevy: 0,
            status: 'UPCOMING',
          } as any,
        }).catch(() => null);
        if (entry) created.push(entry);
      }
    }
    return { generated: created.length, existing: existing.length };
  }

  async updateScheduleEntry(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.disasterFundSchedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Schedule entry ${id} not found`);
    return this.prisma.disasterFundSchedule.update({ where: { id }, data: body as any });
  }

  // ── Targets ───────────────────────────────────────────────────────────────

  async getTargetsVsActual(year: number, companyId?: string) {
    const targets = await this.prisma.disasterFundTarget.findMany({ where: { year } });
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const contributions = await this.prisma.disasterFundContribution.findMany({ where });

    const yearStr = String(year);
    const yearContribs = (contributions as any[]).filter((c) => (c.period ?? '').startsWith(yearStr));

    const targetMap = new Map<string, any>((targets as any[]).map((t) => [t.category, t]));

    // collect all categories that appear
    const allCats = new Set<string>([
      ...(targets as any[]).map((t) => t.category),
      ...yearContribs.map((c) => c.category),
    ]);

    const rows = [...allCats].map((cat) => {
      const t = targetMap.get(cat);
      const catContribs = yearContribs.filter((c) => c.category === cat);
      const actualTotal  = catContribs.reduce((s, c) => s + Number(c.levyAmount ?? 0), 0);
      const remitted     = catContribs.filter((c) => c.status === 'REMITTED').reduce((s, c) => s + Number(c.levyAmount ?? 0), 0);
      const targetAmount = t ? Number(t.targetAmount ?? 0) : 0;
      const variance     = actualTotal - targetAmount;
      const pctOfTarget  = targetAmount > 0 ? (actualTotal / targetAmount) * 100 : null;
      return {
        category: cat,
        targetAmount,
        actualTotal,
        remitted,
        variance,
        pctOfTarget,
        targetId: t?.id ?? null,
        notes: t?.notes ?? null,
      };
    });

    return rows;
  }

  async upsertTarget(body: Record<string, unknown>) {
    if (!body.year)     throw new BadRequestException('year is required');
    if (!body.category) throw new BadRequestException('category is required');

    const existing = await this.prisma.disasterFundTarget.findFirst({
      where: { year: Number(body.year), category: body.category as string },
    });

    if (existing) {
      return this.prisma.disasterFundTarget.update({
        where: { id: existing.id },
        data: { targetAmount: body.targetAmount, notes: body.notes } as any,
      });
    }
    return this.prisma.disasterFundTarget.create({ data: body as any });
  }

  async deleteTarget(id: string) {
    const existing = await this.prisma.disasterFundTarget.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Target ${id} not found`);
    return this.prisma.disasterFundTarget.delete({ where: { id } });
  }

  // ── Compliance score ──────────────────────────────────────────────────────

  async getComplianceScore(year: number, companyId?: string) {
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const all = await this.prisma.disasterFundContribution.findMany({ where });
    const yearStr = String(year);
    const yearContribs = (all as any[]).filter((c) => (c.period ?? '').startsWith(yearStr));

    const total      = yearContribs.length;
    const remitted   = yearContribs.filter((c) => c.status === 'REMITTED').length;
    const overdue    = yearContribs.filter((c) => c.status === 'OVERDUE').length;
    const onTime     = yearContribs.filter((c) => {
      if (c.status !== 'REMITTED') return false;
      if (!c.dueDate || !c.remittedAt) return true;
      return new Date(c.remittedAt) <= new Date(c.dueDate);
    }).length;

    const remittanceRate = total > 0 ? (remitted / total) * 100 : 0;
    const overdueRate    = total > 0 ? (overdue  / total) * 100 : 0;
    const onTimeRate     = remitted > 0 ? (onTime / remitted) * 100 : 100;

    // Weighted score: 50% remittance rate + 30% on-time rate + 20% no-overdue bonus
    const score = Math.round(
      remittanceRate * 0.5 +
      onTimeRate     * 0.3 +
      (100 - overdueRate) * 0.2,
    );

    const grade =
      score >= 90 ? 'A' :
      score >= 75 ? 'B' :
      score >= 60 ? 'C' :
      score >= 40 ? 'D' : 'F';

    return {
      score,
      grade,
      breakdown: { total, remitted, overdue, onTime, remittanceRate, overdueRate, onTimeRate },
    };
  }

  // ── Upcoming dues ─────────────────────────────────────────────────────────

  async getUpcomingDues(days: number = 30, companyId?: string) {
    const where: any = { status: { not: 'REMITTED' } };
    if (companyId) where.companyId = companyId;
    const all = await this.prisma.disasterFundContribution.findMany({ where });
    const cutoff = new Date(Date.now() + days * 86400_000);
    return (all as any[]).filter(
      (c) => c.dueDate && new Date(c.dueDate) <= cutoff,
    );
  }

  // ── Multi-year comparison ─────────────────────────────────────────────────

  async getMultiYear(years: number[], companyId?: string) {
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const all = await this.prisma.disasterFundContribution.findMany({ where });

    return years.map((year) => {
      const yearStr = String(year);
      const yc = (all as any[]).filter((c) => (c.period ?? '').startsWith(yearStr));
      return {
        year,
        total:    yc.reduce((s, c) => s + Number(c.levyAmount ?? 0), 0),
        remitted: yc.filter((c) => c.status === 'REMITTED').reduce((s, c) => s + Number(c.levyAmount ?? 0), 0),
        pending:  yc.filter((c) => c.status === 'PENDING').reduce((s,  c) => s + Number(c.levyAmount ?? 0), 0),
        overdue:  yc.filter((c) => c.status === 'OVERDUE').reduce((s,  c) => s + Number(c.levyAmount ?? 0), 0),
        count: yc.length,
      };
    });
  }

  // ── Monthly heatmap ───────────────────────────────────────────────────────

  async getMonthlyHeatmap(year: number, companyId?: string) {
    const where: any = {};
    if (companyId) where.companyId = companyId;
    const all = await this.prisma.disasterFundContribution.findMany({ where });
    const yearStr = String(year);
    const yc = (all as any[]).filter((c) => (c.period ?? '').startsWith(yearStr));

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: new Date(year, i, 1).toLocaleString('en', { month: 'short' }),
      total: 0, remitted: 0, pending: 0, overdue: 0, count: 0,
      catMap: {} as Record<string, number>,
    }));

    for (const c of yc) {
      const mo = new Date(c.createdAt).getMonth(); // 0-indexed
      const m = months[mo];
      const lv = Number(c.levyAmount ?? 0);
      m.total     += lv;
      m.remitted  += c.status === 'REMITTED' ? lv : 0;
      m.pending   += c.status === 'PENDING'  ? lv : 0;
      m.overdue   += c.status === 'OVERDUE'  ? lv : 0;
      m.count++;
      m.catMap[c.category] = (m.catMap[c.category] ?? 0) + lv;
    }

    return months.map(({ catMap, ...m }) => ({
      ...m,
      topCategory: Object.keys(catMap).length
        ? Object.entries(catMap).sort((a, b) => b[1] - a[1])[0][0]
        : null,
    }));
  }

  // ── Bulk operations ───────────────────────────────────────────────────────

  async bulkRemit(ids: string[], userId?: string) {
    await this.prisma.disasterFundContribution.updateMany({
      where: { id: { in: ids } },
      data: { status: 'REMITTED', remittedAt: new Date() } as any,
    });
    for (const id of ids) {
      await this.writeAuditLog(id, 'STATUS_CHANGED', 'PENDING', 'REMITTED', userId).catch(() => {});
    }
    return { processed: ids.length };
  }

  async bulkStatus(ids: string[], status: string, userId?: string) {
    await this.prisma.disasterFundContribution.updateMany({
      where: { id: { in: ids } },
      data: { status } as any,
    });
    for (const id of ids) {
      await this.writeAuditLog(id, 'STATUS_CHANGED', undefined, status, userId).catch(() => {});
    }
    return { processed: ids.length };
  }

  async flagOverdue(companyId?: string) {
    const now = new Date();
    const where: any = {
      status: 'PENDING',
      dueDate: { lt: now },
    };
    if (companyId) where.companyId = companyId;

    const overdue = await this.prisma.disasterFundContribution.findMany({ where });
    if (!overdue.length) return { flagged: 0 };

    await this.prisma.disasterFundContribution.updateMany({
      where: { id: { in: overdue.map((c: any) => c.id) } },
      data: { status: 'OVERDUE' } as any,
    });

    for (const c of overdue as any[]) {
      await this.writeAuditLog(c.id, 'STATUS_CHANGED', 'PENDING', 'OVERDUE', 'system').catch(() => {});
    }

    return { flagged: overdue.length };
  }

  // ── Auto-generate contributions ───────────────────────────────────────────

  async autoGenerate(params: {
    period: string;
    sources: Record<string, number>; // category → baseAmount
    companyId?: string;
    userId?: string;
    preview?: boolean;
  }) {
    const previews: Array<{ category: string; baseAmount: number; levyAmount: number }> = [];
    const created: any[] = [];

    for (const [category, baseAmount] of Object.entries(params.sources)) {
      if (!baseAmount || isNaN(baseAmount)) continue;
      const levyAmount = this.calcLevy(category as FundCategory, baseAmount);
      previews.push({ category, baseAmount, levyAmount });

      if (!params.preview) {
        const c = await this.prisma.disasterFundContribution.create({
          data: {
            category,
            baseAmount,
            levyAmount,
            period: params.period,
            status: 'PENDING',
            description: `Auto-generated for ${params.period}`,
            ...(params.companyId ? { companyId: params.companyId } : {}),
          } as any,
        }).catch((err: Error) => {
          this.logger.warn(`auto-generate skipped ${category}: ${err.message}`);
          return null;
        });
        if (c) {
          created.push(c);
          await this.writeAuditLog(c.id, 'CREATED', undefined, 'PENDING', params.userId).catch(() => {});
        }
      }
    }

    return params.preview
      ? { preview: previews, total: previews.reduce((s, p) => s + p.levyAmount, 0) }
      : { created: created.length, total: created.reduce((s, c: any) => s + Number(c.levyAmount ?? 0), 0) };
  }

  // ── Import CSV ────────────────────────────────────────────────────────────

  async importCsv(rows: Array<Record<string, unknown>>, companyId?: string, userId?: string) {
    const results: Array<{ row: number; success: boolean; id?: string; error?: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.category) throw new BadRequestException('category missing');
        if (!row.period)   throw new BadRequestException('period missing');
        const category  = row.category as FundCategory;
        const baseAmount = Number(row.baseAmount ?? 0);
        const levyAmount = row.levyAmount !== undefined
          ? Number(row.levyAmount)
          : this.calcLevy(category, baseAmount);

        const c = await this.prisma.disasterFundContribution.create({
          data: {
            ...row,
            baseAmount,
            levyAmount,
            status: (row.status as string) ?? 'PENDING',
            ...(companyId ? { companyId } : {}),
          } as any,
        });
        await this.writeAuditLog(c.id, 'IMPORTED', undefined, 'PENDING', userId).catch(() => {});
        results.push({ row: i + 1, success: true, id: c.id });
      } catch (err: any) {
        results.push({ row: i + 1, success: false, error: err.message });
      }
    }

    return {
      imported: results.filter((r) => r.success).length,
      failed:   results.filter((r) => !r.success).length,
      results,
    };
  }

  // ── Batch calculate ───────────────────────────────────────────────────────

  async batchCalculate(items: Array<{ category: FundCategory; baseAmount: number; label?: string }>) {
    return items.map((item) => ({
      ...item,
      levyAmount: this.calcLevy(item.category, item.baseAmount),
    }));
  }

  // ── Remittances ───────────────────────────────────────────────────────────

  async getRemittances(contributionId: string) {
    return this.prisma.disasterFundRemittance.findMany({
      where: { contributionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRemittance(
    contributionId: string,
    body: { amount: number; bankName?: string; referenceNo?: string; notes?: string },
    userId?: string,
  ) {
    const contribution = await this.prisma.disasterFundContribution.findUnique({
      where: { id: contributionId },
    });
    if (!contribution) throw new NotFoundException(`Contribution ${contributionId} not found`);

    const [remittance] = await Promise.all([
      this.prisma.disasterFundRemittance.create({
        data: {
          contributionId,
          amount:      body.amount,
          bankName:    body.bankName,
          referenceNo: body.referenceNo,
          notes:       body.notes,
          remittedBy:  userId ?? 'system',
        } as any,
      }),
      this.prisma.disasterFundContribution.update({
        where: { id: contributionId },
        data: { status: 'REMITTED', remittedAt: new Date() } as any,
      }),
    ]);

    await this.writeAuditLog(contributionId, 'REMITTANCE_RECORDED', (contribution as any).status, 'REMITTED', userId).catch(() => {});
    return remittance;
  }

  async deleteRemittance(id: string) {
    const existing = await this.prisma.disasterFundRemittance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Remittance ${id} not found`);
    return this.prisma.disasterFundRemittance.delete({ where: { id } });
  }

  // ── Notes ─────────────────────────────────────────────────────────────────

  async getNotes(contributionId: string) {
    return this.prisma.disasterFundNote.findMany({
      where: { contributionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createNote(contributionId: string, content: string, authorName?: string) {
    const contribution = await this.prisma.disasterFundContribution.findUnique({
      where: { id: contributionId },
    });
    if (!contribution) throw new NotFoundException(`Contribution ${contributionId} not found`);
    return this.prisma.disasterFundNote.create({
      data: { contributionId, content, authorName } as any,
    });
  }

  async deleteNote(id: string) {
    const existing = await this.prisma.disasterFundNote.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Note ${id} not found`);
    return this.prisma.disasterFundNote.delete({ where: { id } });
  }

  // ── Audit logs ────────────────────────────────────────────────────────────

  async getAuditLogs(contributionId: string) {
    return this.prisma.disasterFundAuditLog.findMany({
      where: { contributionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async writeAuditLog(
    contributionId: string,
    action: string,
    fromStatus?: string,
    toStatus?: string,
    performedBy?: string,
    detail?: string,
  ) {
    return this.prisma.disasterFundAuditLog.create({
      data: {
        contributionId,
        action,
        fromStatus,
        toStatus,
        performedBy: performedBy ?? 'system',
        detail,
      } as any,
    });
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  async deleteReport(id: string) {
    const existing = await this.prisma.disasterFundReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Report ${id} not found`);
    return this.prisma.disasterFundReport.delete({ where: { id } });
  }

  // ── ERCA submissions ──────────────────────────────────────────────────────
  // ERCA records are stored in DisasterFundAuditLog with action prefixed 'ERCA_'
  // and detail containing JSON payload. This avoids a schema migration.

  private parseErcaLog(log: any) {
    try {
      const payload = JSON.parse(log.detail ?? '{}');
      return {
        id:               log.id,
        period:           payload.period ?? '',
        dueDate:          payload.dueDate ?? '',
        totalLevy:        payload.totalLevy ?? 0,
        totalRemitted:    payload.totalRemitted ?? 0,
        totalPending:     payload.totalPending ?? 0,
        categoryBreakdown: payload.categoryBreakdown ?? {},
        contributionIds:  payload.contributionIds ?? [],
        status:           payload.status ?? 'PENDING',
        submittedAt:      payload.submittedAt,
        submittedBy:      payload.submittedBy,
        ercaReferenceNo:  payload.ercaReferenceNo,
        paymentMethod:    payload.paymentMethod,
        bankName:         payload.bankName,
        paymentReference: payload.paymentReference,
        notes:            payload.notes,
        acknowledgedAt:   payload.acknowledgedAt,
        createdAt:        log.createdAt,
      };
    } catch {
      return null;
    }
  }

  async getErcaSubmissions(year: number) {
    const logs = await this.prisma.disasterFundAuditLog.findMany({
      where: { action: { startsWith: 'ERCA_' } },
      orderBy: { createdAt: 'desc' },
    });
    const parsed = logs.map((l) => this.parseErcaLog(l)).filter(Boolean);
    if (year) {
      return parsed.filter((s: any) => (s.period ?? '').startsWith(String(year)));
    }
    return parsed;
  }

  async previewErcaSubmission(period: string, companyId?: string) {
    const where: any = { period };
    if (companyId) where.companyId = companyId;
    const contributions = await this.prisma.disasterFundContribution.findMany({ where });

    const categoryBreakdown: Record<string, { levy: number; base: number; count: number }> = {};
    let totalLevy = 0, totalRemitted = 0, totalPending = 0;

    for (const c of contributions as any[]) {
      const lv = Number(c.levyAmount ?? 0);
      totalLevy += lv;
      if (c.status === 'REMITTED') totalRemitted += lv;
      else                         totalPending  += lv;

      if (!categoryBreakdown[c.category]) {
        categoryBreakdown[c.category] = { levy: 0, base: 0, count: 0 };
      }
      categoryBreakdown[c.category].levy  += lv;
      categoryBreakdown[c.category].base  += Number(c.baseAmount ?? 0);
      categoryBreakdown[c.category].count++;
    }

    // find the nearest schedule due date for this period
    const schedEntry = await this.prisma.disasterFundSchedule
      .findFirst({ where: { category: { contains: 'Q' } } })
      .catch(() => null);
    const dueDate = schedEntry ? (schedEntry as any).dueDate : null;

    return {
      period,
      dueDate,
      totalLevy,
      totalRemitted,
      totalPending,
      categoryBreakdown,
      contributionIds: contributions.map((c: any) => c.id),
      contributionCount: contributions.length,
    };
  }

  async prepareErcaSubmission(period: string, companyId?: string, userId?: string) {
    const payload = await this.previewErcaSubmission(period, companyId);
    const detail = JSON.stringify({ ...payload, status: 'PENDING', createdAt: new Date().toISOString() });

    // Store as an audit-log entry with action ERCA_PREPARED
    const log = await this.prisma.disasterFundAuditLog.create({
      data: {
        contributionId: 'erca', // sentinel value — no FK constraint in schema
        action:        'ERCA_PREPARED',
        performedBy:    userId ?? 'system',
        detail,
      } as any,
    });

    return this.parseErcaLog({ ...log, detail });
  }

  async submitErcaSubmission(
    params: {
      period: string;
      paymentMethod?: string;
      bankName?: string;
      paymentReference?: string;
      notes?: string;
    },
    companyId?: string,
    userId?: string,
  ) {
    const preview = await this.previewErcaSubmission(params.period, companyId);

    const payload = {
      ...preview,
      status:           'SUBMITTED',
      paymentMethod:    params.paymentMethod,
      bankName:         params.bankName,
      paymentReference: params.paymentReference,
      notes:            params.notes,
      submittedAt:      new Date().toISOString(),
      submittedBy:      userId ?? 'system',
    };

    const log = await this.prisma.disasterFundAuditLog.create({
      data: {
        contributionId: 'erca',
        action:         'ERCA_SUBMITTED',
        performedBy:    userId ?? 'system',
        detail:         JSON.stringify(payload),
      } as any,
    });

    return this.parseErcaLog({ ...log, detail: JSON.stringify(payload) });
  }

  async acknowledgeErcaSubmission(
    submissionId: string,
    ercaReferenceNo: string,
    userId?: string,
  ) {
    const log = await this.prisma.disasterFundAuditLog.findUnique({ where: { id: submissionId } });
    if (!log) throw new NotFoundException(`ERCA submission ${submissionId} not found`);

    const existing = this.parseErcaLog(log);
    if (!existing) throw new BadRequestException('Invalid ERCA submission record');

    const updated = {
      ...existing,
      status:          'ACKNOWLEDGED',
      ercaReferenceNo,
      acknowledgedAt:  new Date().toISOString(),
    };

    // Write a new audit entry for the acknowledgement
    const ackLog = await this.prisma.disasterFundAuditLog.create({
      data: {
        contributionId: 'erca',
        action:         'ERCA_ACKNOWLEDGED',
        performedBy:    userId ?? 'system',
        detail:         JSON.stringify({ ...updated, originalId: submissionId }),
      } as any,
    });

    return this.parseErcaLog({ ...ackLog, detail: JSON.stringify({ ...updated, originalId: submissionId }) });
  }

  async bulkGeneratePrepare(period: string, businessType?: string, companyId?: string) {
    // Auto-generate contributions for applicable categories and prepare ERCA payload
    const applicableCategories = LEVY_RULES.map((r) => r.category);
    const where: any = { period };
    if (companyId) where.companyId = companyId;

    // Get already-existing contributions for this period
    const existing = await this.prisma.disasterFundContribution.findMany({ where });
    const existingCats = new Set((existing as any[]).map((c) => c.category));
    const missing = applicableCategories.filter((c) => !existingCats.has(c));

    return {
      period,
      businessType,
      existingContributions: existing.length,
      missingCategories: missing,
      readyForSubmission: missing.length === 0,
      preview: applicableCategories.map((cat) => {
        const rule = LEVY_RULE_MAP.get(cat as FundCategory)!;
        return { category: cat, description: rule.description, rate: rule.rate, flat: rule.flat };
      }),
    };
  }

  async getErcaComplianceHistory(companyId?: string) {
    const logs = await this.prisma.disasterFundAuditLog.findMany({
      where: { action: { in: ['ERCA_SUBMITTED', 'ERCA_ACKNOWLEDGED'] } },
      orderBy: { createdAt: 'asc' },
    });

    const byYear = new Map<number, {
      year: number; total: number; submitted: number; acknowledged: number;
      onTime: number; totalLevy: number;
    }>();

    for (const log of logs) {
      const parsed = this.parseErcaLog(log);
      if (!parsed) continue;
      const year = parseInt((parsed.period ?? '').slice(0, 4), 10);
      if (!year || isNaN(year)) continue;
      if (!byYear.has(year)) byYear.set(year, { year, total: 0, submitted: 0, acknowledged: 0, onTime: 0, totalLevy: 0 });
      const y = byYear.get(year)!;
      y.total++;
      y.totalLevy += parsed.totalLevy ?? 0;
      if (log.action === 'ERCA_SUBMITTED' || log.action === 'ERCA_ACKNOWLEDGED') y.submitted++;
      if (log.action === 'ERCA_ACKNOWLEDGED') y.acknowledged++;
      if (parsed.submittedAt && parsed.dueDate && new Date(parsed.submittedAt) <= new Date(parsed.dueDate)) y.onTime++;
    }

    return [...byYear.values()].sort((a, b) => a.year - b.year).map((y) => ({
      ...y,
      complianceRate: y.total > 0 ? (y.submitted  / y.total) * 100 : 0,
      onTimeRate:     y.total > 0 ? (y.onTime / y.total) * 100 : 0,
    }));
  }
}
