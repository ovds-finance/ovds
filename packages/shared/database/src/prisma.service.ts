/**
 * PrismaService — type-level base class for packages that declare
 * PrismaService as an injectable parameter type.
 *
 * The runtime instance is provided by NestJS DI from
 *   apps/backend/src/common/prisma.service.ts
 *
 * This file exists solely so that packages/* can import PrismaService
 * as a type without depending on the backend app.
 *
 * Prisma v7: $connect/$disconnect are no longer lifecycle hooks on PrismaClient;
 * lifecycle management is the responsibility of the adapter passed at runtime.
 */
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../../database/prisma/generated/client';

@Injectable()
export class PrismaService extends PrismaClient {
  // Prisma v7: adapter-managed lifecycle — no $connect/$disconnect calls here.
  // The runtime implementation in apps/backend/src/common/prisma.service.ts
  // is registered via NestJS DI and handles all lifecycle concerns.
}
