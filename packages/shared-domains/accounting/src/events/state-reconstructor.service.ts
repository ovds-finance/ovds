// apps/shared-domains/accounting/src/events/state-reconstructor.service.ts
import { Injectable } from '@nestjs/common';
import { EventStoreService } from './event-store.service';

export interface ReconstructedAccountState { accountId: string; runningDebit: number; runningCredit: number; netBalance: number; lastMutatedEventTimestamp: Date | null; }

@Injectable()
export class StateReconstructorService {
  constructor(private readonly eventStore: EventStoreService) {}

  async reconstructAccountState(tenantId: string, accountId: string, upToDate: Date): Promise<ReconstructedAccountState> {
    const rawEvents = await this.eventStore.getEventStream(tenantId, accountId);
    const filtered = rawEvents.filter(e => new Date(e.timestamp) <= upToDate);
    let runningDebit = 0, runningCredit = 0;
    let lastMutatedEventTimestamp: Date | null = null;
    for (const envelope of filtered) {
      const payload = JSON.parse(envelope.eventPayload);
      lastMutatedEventTimestamp = new Date(envelope.timestamp);
      switch (envelope.eventType) {
        case 'JOURNAL_LINE_DEBIT_RECORDED': runningDebit += Number(payload.amount || 0); break;
        case 'JOURNAL_LINE_CREDIT_RECORDED': runningCredit += Number(payload.amount || 0); break;
        case 'LEDGER_BALANCE_ADJUSTMENT_APPLIED': runningDebit += Number(payload.debitAdjustment || 0); runningCredit += Number(payload.creditAdjustment || 0); break;
      }
    }
    return { accountId, runningDebit: Number(runningDebit.toFixed(2)), runningCredit: Number(runningCredit.toFixed(2)), netBalance: Number((runningDebit - runningCredit).toFixed(2)), lastMutatedEventTimestamp };
  }
}
