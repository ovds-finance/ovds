import { Module } from '@nestjs/common';
import { InvoicePaymentService } from './invoice-payment.service';
import { BillPaymentService } from './bill-payment.service';
import { JournalReversalService } from './journal-reversal.service';
import { ReconciliationService } from './reconciliation.service';

@Module({
  providers: [
    InvoicePaymentService,
    BillPaymentService,
    JournalReversalService,
    ReconciliationService,
  ],
  exports: [
    InvoicePaymentService,
    BillPaymentService,
    JournalReversalService,
    ReconciliationService,
  ],
})
export class OvdsAccountingModule {}
