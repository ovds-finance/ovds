// apps/shared-domains/infra/src/lifecycle/resilient-connector.ts
import { PrismaClient } from '@ovds/database';

export class ResilientConnector {
  static async connectWithRetry(client: PrismaClient, maxRetries = 5, initialDelayMs = 1000): Promise<void> {
    let attempts = 0; let delay = initialDelayMs;
    while (attempts < maxRetries) {
      try { attempts++; await client.$connect(); return; }
      catch (error: any) {
        if (attempts >= maxRetries) throw new Error(`DB connection failed after ${maxRetries} attempts.`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }
}
