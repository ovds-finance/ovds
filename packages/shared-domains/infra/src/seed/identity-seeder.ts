// apps/shared-domains/infra/src/seed/identity-seeder.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';

@Injectable()
export class IdentitySeeder {
  private prisma = new PrismaClient();

  async seedTenantIdentities(tenantId: string): Promise<void> {
    const members = [
      { email: 'admin@ovds.local', role: 'ADMIN' },
      { email: 'bookkeeper@ovds.local', role: 'BOOKKEEPER' },
      { email: 'auditor@ovds.local', role: 'AUDITOR' }
    ];
    await this.prisma.$transaction(async (tx) => {
      for (const m of members) {
        await (tx as any).tenantUserMembership.upsert({
          where: { tenantId_email: { tenantId, email: m.email } },
          update: { role: m.role },
          create: { tenantId, email: m.email, role: m.role, isActive: true }
        });
      }
    });
  }
}
