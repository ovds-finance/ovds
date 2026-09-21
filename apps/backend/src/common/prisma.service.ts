import { Injectable } from '@nestjs/common';
import { buildTenantScopedExtension } from '@ovds/database';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

import { getTenantContext } from './tenant-context.middleware';


type DeploymentMode = 'CLOUD_SAAS' | 'ON_PREMISE_SINGLE' | 'ON_PREMISE_MULTI';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString = process.env.PRISMA_DATABASE_URL;
    if (!connectionString) {
      throw new Error('PRISMA_DATABASE_URL environment variable is required');
    }

    super({
      adapter: new PrismaMariaDb(connectionString),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error', 'warn'],
    });

    const deploymentMode = (process.env.DEPLOYMENT_MODE || 'CLOUD_SAAS') as DeploymentMode;

    const extended = (this as unknown as { $extends: (ext: any) => PrismaClient }).$extends(
      buildTenantScopedExtension(getTenantContext, deploymentMode),
    );

    (extended as unknown as { onModuleInit: () => Promise<void> }).onModuleInit = async () => {
      await extended.$connect();
    };
    (extended as unknown as { onModuleDestroy: () => Promise<void> }).onModuleDestroy = async () => {
      await extended.$disconnect();
    };

    return extended as unknown as PrismaService;
  }
}
