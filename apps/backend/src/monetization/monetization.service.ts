/**
 * MonetizationService — real Prisma-backed implementation.
 *
 * Manages the full SaaS billing lifecycle:
 *   Products   → plan definitions (MonetizationProduct)
 *   Subscriptions → time-bounded access (MonetizationSubscription)
 *   Trials        → free trial grants (MonetizationTrial)
 *   Purchases     → lifetime one-time grants (MonetizationPurchase)
 *   Entitlements  → O(1) feature-flag cache (MonetizationEntitlement)
 *
 * Entitlements are rebuilt atomically after every state change so the
 * feature-check guard (`GET /monetization/check/:featureKey`) always reads
 * from a pre-computed cache row — no fan-out joins at request time.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MonetizationService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Entitlement cache rebuild ─────────────────────────────────────────────

  /**
   * Recompute the full entitlement set for a company by scanning:
   *   1. Active subscriptions whose currentPeriodEnd is in the future
   *   2. Active / non-expired trials
   *   3. Completed lifetime purchases
   *
   * All previous entitlement rows for the company are deleted and replaced in
   * a single transaction so there is never a partial state.
   */
  async rebuildEntitlements(companyId: string): Promise<void> {
    const now = new Date();

    // Active subscriptions
    const activeSubs = await this.prisma.monetizationSubscription.findMany({
      where: { companyId, status: 'ACTIVE', currentPeriodEnd: { gte: now } },
      include: { product: true },
    });

    // Active trials
    const activeTrials = await this.prisma.monetizationTrial.findMany({
      where: { companyId, status: 'ACTIVE', endsAt: { gte: now } },
      include: { product: true },
    });

    // Completed lifetime purchases
    const purchases = await this.prisma.monetizationPurchase.findMany({
      where: { companyId, status: 'COMPLETED' },
      include: { product: true },
    });

    // Build the effective entitlement set
    const grants: Map<string, { source: string; expiresAt: Date | null }> = new Map();

    for (const sub of activeSubs) {
      const keys: string[] = JSON.parse(sub.product.featureKeys || '[]');
      for (const key of keys) {
        grants.set(key, { source: 'SUBSCRIPTION', expiresAt: sub.currentPeriodEnd });
      }
      // Also grant the plan slug itself
      grants.set(`plan:${sub.product.slug}`, { source: 'SUBSCRIPTION', expiresAt: sub.currentPeriodEnd });
    }

    for (const trial of activeTrials) {
      const keys: string[] = JSON.parse(trial.product.featureKeys || '[]');
      for (const key of keys) {
        if (!grants.has(key)) {
          grants.set(key, { source: 'TRIAL', expiresAt: trial.endsAt });
        }
      }
    }

    for (const purchase of purchases) {
      const keys: string[] = JSON.parse(purchase.product.featureKeys || '[]');
      for (const key of keys) {
        // Lifetime grants override time-bounded ones
        grants.set(key, { source: 'LIFETIME', expiresAt: null });
      }
      grants.set(`plan:${purchase.product.slug}`, { source: 'LIFETIME', expiresAt: null });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.monetizationEntitlement.deleteMany({ where: { companyId } });
      if (grants.size > 0) {
        await tx.monetizationEntitlement.createMany({
          data: Array.from(grants.entries()).map(([featureKey, g]) => ({
            companyId,
            featureKey,
            source: g.source,
            expiresAt: g.expiresAt,
          })),
        });
      }
    });
  }

  // ── Status & entitlement checks ───────────────────────────────────────────

  async getStatus(companyId: string) {
    const now = new Date();

    const [activeSub, activeTrial, entitlements] = await Promise.all([
      this.prisma.monetizationSubscription.findFirst({
        where: { companyId, status: 'ACTIVE', currentPeriodEnd: { gte: now } },
        include: { product: true },
        orderBy: { currentPeriodEnd: 'desc' },
      }),
      this.prisma.monetizationTrial.findFirst({
        where: { companyId, status: 'ACTIVE', endsAt: { gte: now } },
        include: { product: true },
        orderBy: { endsAt: 'desc' },
      }),
      this.prisma.monetizationEntitlement.findMany({
        where: { companyId, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        select: { featureKey: true, source: true, expiresAt: true },
      }),
    ]);

    const entitledFeatures = entitlements.map((e) => e.featureKey);

    if (activeSub) {
      return {
        plan: activeSub.product.slug,
        planName: activeSub.product.name,
        status: 'active',
        billingCycle: activeSub.billingCycle,
        currentPeriodEnd: activeSub.currentPeriodEnd,
        entitledFeatures,
        companyId,
        expiresAt: activeSub.currentPeriodEnd,
        isTrial: false,
      };
    }

    if (activeTrial) {
      return {
        plan: activeTrial.product.slug,
        planName: activeTrial.product.name,
        status: 'trialing',
        billingCycle: null,
        currentPeriodEnd: activeTrial.endsAt,
        entitledFeatures,
        companyId,
        expiresAt: activeTrial.endsAt,
        isTrial: true,
        trialEndsAt: activeTrial.endsAt,
      };
    }

    return {
      plan: 'free',
      planName: 'Free Plan',
      status: 'active',
      billingCycle: null,
      currentPeriodEnd: null,
      entitledFeatures,
      companyId,
      expiresAt: null,
      isTrial: false,
    };
  }

  async checkFeature(companyId: string, featureKey: string): Promise<boolean> {
    const now = new Date();
    const entitlement = await this.prisma.monetizationEntitlement.findFirst({
      where: {
        companyId,
        featureKey,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
    });
    return entitlement !== null;
  }

  // ── Products ──────────────────────────────────────────────────────────────

  async listProducts() {
    return this.prisma.monetizationProduct.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { priceMonthly: 'asc' }],
    });
  }

  async getProduct(id: string) {
    const product = await this.prisma.monetizationProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  async createSubscription(companyId: string, dto: {
    productId: string;
    billingCycle?: string;
    providerRef?: string;
    providerSubId?: string;
  }) {
    const product = await this.prisma.monetizationProduct.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);
    if (product.type !== 'SUBSCRIPTION') {
      throw new BadRequestException('Product is not a subscription type');
    }

    const billingCycle = dto.billingCycle ?? 'MONTHLY';
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'ANNUAL') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Cancel any existing active subscription for the same company
    await this.prisma.monetizationSubscription.updateMany({
      where: { companyId, status: 'ACTIVE' },
      data: { status: 'CANCELLED', cancelledAt: now, cancelReason: 'replaced_by_new_subscription' },
    });

    const sub = await this.prisma.monetizationSubscription.create({
      data: {
        companyId,
        productId: dto.productId,
        billingCycle,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        providerRef: dto.providerRef,
        providerSubId: dto.providerSubId,
      },
      include: { product: true },
    });

    await this.rebuildEntitlements(companyId);
    return sub;
  }

  async cancelSubscription(companyId: string, id: string, reason?: string) {
    const sub = await this.prisma.monetizationSubscription.findFirst({
      where: { id, companyId },
    });
    if (!sub) throw new NotFoundException(`Subscription ${id} not found`);
    if (sub.status === 'CANCELLED') {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updated = await this.prisma.monetizationSubscription.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
    });

    await this.rebuildEntitlements(companyId);
    return updated;
  }

  async pauseSubscription(companyId: string, id: string) {
    const sub = await this.prisma.monetizationSubscription.findFirst({
      where: { id, companyId, status: 'ACTIVE' },
    });
    if (!sub) throw new NotFoundException(`Active subscription ${id} not found`);

    const updated = await this.prisma.monetizationSubscription.update({
      where: { id },
      data: { status: 'PAUSED' },
    });

    await this.rebuildEntitlements(companyId);
    return updated;
  }

  async resumeSubscription(companyId: string, id: string) {
    const sub = await this.prisma.monetizationSubscription.findFirst({
      where: { id, companyId, status: 'PAUSED' },
    });
    if (!sub) throw new NotFoundException(`Paused subscription ${id} not found`);

    // Extend the current period by the remaining time if the pause was short
    const updated = await this.prisma.monetizationSubscription.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.rebuildEntitlements(companyId);
    return updated;
  }

  async switchSubscription(companyId: string, id: string, newProductId: string, billingCycle?: string) {
    const sub = await this.prisma.monetizationSubscription.findFirst({
      where: { id, companyId },
    });
    if (!sub) throw new NotFoundException(`Subscription ${id} not found`);

    const product = await this.prisma.monetizationProduct.findUnique({ where: { id: newProductId } });
    if (!product) throw new NotFoundException(`Product ${newProductId} not found`);

    const updated = await this.prisma.monetizationSubscription.update({
      where: { id },
      data: {
        productId: newProductId,
        billingCycle: billingCycle ?? sub.billingCycle,
        status: 'ACTIVE',
      },
      include: { product: true },
    });

    await this.rebuildEntitlements(companyId);
    return updated;
  }

  async renewSubscription(companyId: string, subscriptionId: string) {
    const sub = await this.prisma.monetizationSubscription.findFirst({
      where: { id: subscriptionId, companyId },
    });
    if (!sub) throw new NotFoundException(`Subscription ${subscriptionId} not found`);

    const newEnd = new Date(Math.max(sub.currentPeriodEnd.getTime(), Date.now()));
    if (sub.billingCycle === 'ANNUAL') {
      newEnd.setFullYear(newEnd.getFullYear() + 1);
    } else {
      newEnd.setMonth(newEnd.getMonth() + 1);
    }

    const updated = await this.prisma.monetizationSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: newEnd,
      },
    });

    await this.rebuildEntitlements(companyId);
    return updated;
  }

  // ── Trials ────────────────────────────────────────────────────────────────

  async startTrial(companyId: string, productId: string) {
    const product = await this.prisma.monetizationProduct.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    if (product.trialDays <= 0) {
      throw new BadRequestException('This product does not offer a free trial');
    }

    const existing = await this.prisma.monetizationTrial.findFirst({
      where: { companyId, productId },
    });
    if (existing) {
      throw new ConflictException('A trial for this product has already been started for this company');
    }

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + product.trialDays);

    const trial = await this.prisma.monetizationTrial.create({
      data: { companyId, productId, status: 'ACTIVE', endsAt },
      include: { product: true },
    });

    await this.rebuildEntitlements(companyId);
    return trial;
  }

  // ── Lifetime purchases ────────────────────────────────────────────────────

  async createPurchase(companyId: string, dto: {
    productId: string;
    amountPaid: number;
    providerRef?: string;
    receiptUrl?: string;
  }) {
    const product = await this.prisma.monetizationProduct.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);
    if (product.type !== 'LIFETIME') {
      throw new BadRequestException('Product is not a lifetime type');
    }

    const purchase = await this.prisma.monetizationPurchase.create({
      data: {
        companyId,
        productId: dto.productId,
        status: 'COMPLETED',
        amountPaid: new Prisma.Decimal(dto.amountPaid),
        providerRef: dto.providerRef,
        receiptUrl: dto.receiptUrl,
      },
      include: { product: true },
    });

    await this.rebuildEntitlements(companyId);
    return purchase;
  }

  // ── License activation ────────────────────────────────────────────────────

  async activateLicense(companyId: string, licenseKey: string) {
    // Look for a FeatureEntitlement or a stored license key in SettingValue
    const stored = await this.prisma.settingValue.findFirst({
      where: { key: `license.key.${licenseKey}`, companyId: null },
    });

    if (!stored) {
      throw new NotFoundException('License key not found or already redeemed');
    }

    let payload: { productId?: string; featureKeys?: string[] } = {};
    try {
      payload = JSON.parse(stored.value);
    } catch {
      throw new BadRequestException('Malformed license key payload');
    }

    if (!payload.productId && !payload.featureKeys?.length) {
      throw new BadRequestException('License key grants no features');
    }

    // Mark the key as redeemed (update companyId)
    await this.prisma.settingValue.update({
      where: { id: stored.id },
      data: { key: `license.key.${licenseKey}.redeemed`, value: JSON.stringify({ ...payload, redeemedBy: companyId, redeemedAt: new Date().toISOString() }) },
    });

    // Grant the entitlement
    const featureKeys: string[] = payload.featureKeys ?? [];
    if (featureKeys.length) {
      await this.prisma.monetizationEntitlement.createMany({
        data: featureKeys.map((fk) => ({
          companyId,
          featureKey: fk,
          source: 'LIFETIME',
          expiresAt: null,
        })),
        skipDuplicates: true,
      });
    }

    return { activated: true, licenseKey, featureKeys, companyId };
  }

  // ── Admin billing ─────────────────────────────────────────────────────────

  async getCompanyBilling(companyId: string) {
    const now = new Date();
    const [activeSub, trials, purchases, entitlements] = await Promise.all([
      this.prisma.monetizationSubscription.findFirst({
        where: { companyId, status: 'ACTIVE', currentPeriodEnd: { gte: now } },
        include: { product: true },
      }),
      this.prisma.monetizationTrial.findMany({
        where: { companyId },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.monetizationPurchase.findMany({
        where: { companyId },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.monetizationEntitlement.count({ where: { companyId } }),
    ]);

    const totalSpend = purchases.reduce(
      (sum, p) => sum + p.amountPaid.toNumber(),
      0,
    );

    return {
      companyId,
      plan: activeSub?.product.slug ?? 'free',
      planName: activeSub?.product.name ?? 'Free Plan',
      status: activeSub?.status ?? 'active',
      currentPeriodEnd: activeSub?.currentPeriodEnd ?? null,
      totalSpend,
      entitlementCount: entitlements,
      subscriptionHistory: activeSub ? [activeSub] : [],
      trialHistory: trials,
      purchaseHistory: purchases,
    };
  }
}
