import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { TENANT_CONTEXT, type RequestContext } from '@ovds/database';
import { Request, Response, NextFunction } from 'express';

import { PrismaService } from './prisma.service';

interface CacheEntry {
  companyId: string;
  expiresAt: number;
}

interface TenantResolutionMetrics {
  hits: number;
  misses: number;
  errors: number;
  lastReset: number;
}

const SUBDOMAIN_CACHE_MAX = 4096;
const SUBDOMAIN_CACHE_TTL_MS = 5 * 60 * 1000;
const METRICS_LOG_INTERVAL_MS = 60 * 1000;

const DEFAULT_RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'localhost', 'admin', 'app', 'dashboard', 'auth',
  'static', 'assets', 'mail', 'ftp', 'smtp', 'pop', 'imap',
]);

const DEFAULT_TRUSTED_DOMAINS = new Set([
  'ovds.com',
  'ovds.local',
  'ovds.io',
]);

function getEnvSet(envVar: string, defaults: Set<string>): Set<string> {
  const raw = process.env[envVar];
  if (!raw) return defaults;
  return new Set(raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
}

function isValidSubdomain(value: string): boolean {
  if (!value || value.length < 3 || value.length > 63) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value)) return false;
  return true;
}

function pruneCache(cache: Map<string, CacheEntry>): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

@Injectable()
export class TenantSubdomainMiddleware implements NestMiddleware {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly metrics: TenantResolutionMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    lastReset: Date.now(),
  };
  private readonly deploymentMode: 'CLOUD_SAAS' | 'ON_PREMISE_SINGLE' | 'ON_PREMISE_MULTI';
  private readonly logger = new Logger(TenantSubdomainMiddleware.name);
  private readonly reservedSubdomains: Set<string>;
  private readonly trustedDomains: Set<string>;

  constructor(private readonly prisma: PrismaService) {
    this.deploymentMode = (process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS') as
      | 'CLOUD_SAAS'
      | 'ON_PREMISE_SINGLE'
      | 'ON_PREMISE_MULTI';
    this.reservedSubdomains = getEnvSet('TENANT_RESERVED_SUBDOMAINS', DEFAULT_RESERVED_SUBDOMAINS);
    this.trustedDomains = getEnvSet('TENANT_TRUSTED_DOMAINS', DEFAULT_TRUSTED_DOMAINS);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (this.deploymentMode === 'ON_PREMISE_SINGLE') {
      return next();
    }

    // ── x-company-id header: trusted only from internal service calls ────────
    // Accepting this header from arbitrary external requests is a tenant
    // impersonation vector — any unauthenticated client could inject a
    // companyId and bypass tenant scoping.
    // We trust this header ONLY when the request carries a valid internal
    // service secret via x-internal-token (set by trusted backend services).
    // For all other requests the header is silently stripped and ignored.
    const headerCompanyId = (req.headers['x-company-id'] as string | undefined)?.trim();
    const internalToken = (req.headers['x-internal-token'] as string | undefined)?.trim();
    const configuredInternalToken = process.env['INTERNAL_SERVICE_TOKEN'];

    // Strip the header regardless — downstream code must never see an
    // unverified x-company-id.
    delete (req.headers as Record<string, unknown>)['x-company-id'];

    if (
      headerCompanyId &&
      configuredInternalToken &&
      internalToken === configuredInternalToken
    ) {
      const ctx: RequestContext = {
        companyId: headerCompanyId,
        userId: null,
        role: null,
      };
      return TENANT_CONTEXT.run(ctx, () => next());
    }

    const host = req.hostname;
    const parts = host.split('.');

    if (parts.length <= 2) {
      return next();
    }

    const rawSubdomain = parts[0].toLowerCase();

    if (!rawSubdomain || this.reservedSubdomains.has(rawSubdomain) || !isValidSubdomain(rawSubdomain)) {
      return next();
    }

    const tld = parts.slice(1).join('.');

    if (!this.isTrustedDomain(tld)) {
      return next();
    }

    this.resolveTenant(rawSubdomain)
      .then((companyId) => {
        const ctx: RequestContext = {
          companyId: companyId || null,
          userId: null,
          role: null,
        };
        TENANT_CONTEXT.run(ctx, () => next());
      })
      .catch((err) => {
        this.metrics.errors++;
        this.logger.warn(`Subdomain resolution error for "${rawSubdomain}": ${err instanceof Error ? err.message : String(err)}`);
        next();
      });
  }

  private isTrustedDomain(hostSuffix: string): boolean {
    if (this.trustedDomains.has(hostSuffix)) return true;
    for (const trusted of this.trustedDomains) {
      if (hostSuffix === trusted || hostSuffix.endsWith(`.${trusted}`)) return true;
    }
    return false;
  }

  private async resolveTenant(subdomain: string): Promise<string | null> {
    const cached = this.cache.get(subdomain);
    if (cached && cached.expiresAt > Date.now()) {
      this.metrics.hits++;
      return cached.companyId || null;
    }

    this.metrics.misses++;
    pruneCache(this.cache);

    try {
      const company = await this.prisma.company.findUnique({
        where: { subdomain },
        select: { id: true },
      });

      if (company) {
        if (this.cache.size >= SUBDOMAIN_CACHE_MAX) {
          const oldest = [...this.cache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
          if (oldest) this.cache.delete(oldest[0]);
        }
        this.cache.set(subdomain, { companyId: company.id, expiresAt: Date.now() + SUBDOMAIN_CACHE_TTL_MS });
        return company.id;
      }

      this.cache.set(subdomain, { companyId: '', expiresAt: Date.now() + SUBDOMAIN_CACHE_TTL_MS });
      return null;
    } catch (err) {
      this.metrics.errors++;
      this.logger.error(`Failed to resolve tenant for subdomain "${subdomain}"`, err instanceof Error ? err.stack : String(err));
      return null;
    }
  }

  getMetrics(): TenantResolutionMetrics & { cacheSize: number; hitRatio: number } {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      hitRatio: total > 0 ? this.metrics.hits / total : 0,
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.log('Subdomain cache cleared');
  }
}
