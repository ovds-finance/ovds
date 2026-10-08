import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@ovds/database';
import { createTenantClient, TenantContext } from './tenant-isolation.extension';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      tenantPrisma?: ReturnType<typeof createTenantClient>;
    }
  }
}

@Injectable()
export class TenantRoutingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantRoutingMiddleware.name);
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.get('host') || '';
    const subdomain = this.extractSubdomain(host);

    if (!subdomain) {
      this.logger.warn(`No subdomain found for host: ${host}`);
      return next();
    }

    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { subdomain },
        select: { id: true, subdomain: true, status: true },
      });

      if (!tenant) {
        this.logger.warn(`Tenant not found for subdomain: ${subdomain}`);
        return res.status(404).json({ error: 'Tenant not found' });
      }

      if (tenant.status !== 'ACTIVE') {
        this.logger.warn(`Tenant inactive: ${subdomain}, status: ${tenant.status}`);
        return res.status(403).json({ error: 'Tenant account is not active' });
      }

      const context: TenantContext = {
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
      };

      req.tenant = context;
      req.tenantPrisma = createTenantClient(this.prisma, context);

      this.logger.debug(`Tenant resolved: ${subdomain} (${tenant.id})`);
      next();
    } catch (error) {
      this.logger.error(`Error resolving tenant for ${subdomain}:`, error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  private extractSubdomain(host: string): string | null {
    const parts = host.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }
    if (process.env.NODE_ENV === 'development' && parts.length === 2) {
      return parts[0];
    }
    return null;
  }
}

export const TENANT_CONTEXT_KEY = 'tenant';
export const TENANT_PRISMA_KEY = 'tenantPrisma';