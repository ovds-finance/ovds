import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DoubleEntryService, CreateJournalEntryInput } from '@ovds/domains-double-entry';
import { INVOICE_EVENTS, InvoiceSnapshot } from '@ovds/shared';

import { PrismaService } from '../common/prisma.service';

/**
 * InvoiceLedgerListener
 *
 * Decoupled event-driven listener that bridges the InvoicingModule and the
 * DoubleEntryService.  When the InvoicingModule emits an `invoice.invoice.created`
 * event, this listener catches it **asynchronously** and posts a balanced
 * GAAP journal entry:
 *
 *   Debit  Accounts Receivable   (Asset ↑)
 *   Credit Sales Revenue          (Revenue ↑)
 *
 * This keeps the two domains fully decoupled — the InvoicingModule never
 * imports the DoubleEntryService directly.
 */
@Injectable()
export class InvoiceLedgerListener {
  private readonly logger = new Logger(InvoiceLedgerListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly doubleEntryService: DoubleEntryService,
  ) {}

  @OnEvent(INVOICE_EVENTS.CREATED, { async: true })
  async handleInvoiceCreatedEvent(payload: { invoice: InvoiceSnapshot }): Promise<void> {
    const { invoice } = payload;
    const { companyId, totalAmount, baseAmount } = invoice;

    if (!companyId) {
      this.logger.warn(`Invoice ${invoice.invoiceNumber} has no companyId — skipping ledger post.`);
      return;
    }

    // Resolve default AR and Revenue accounts for this company by AccountCategory.
    // The PrismaService $extends extension auto-injects companyId for tenant-scoped
    // models, so the query is automatically scoped to the active tenant.
    const [arAccount, revenueAccount] = await Promise.all([
      this.findDefaultAccountByCategory(companyId, 'ACCOUNTS_RECEIVABLE'),
      this.findDefaultAccountByCategory(companyId, 'REVENUE'),
    ]);

    if (!arAccount || !revenueAccount) {
      throw new NotFoundException(
        `Default ledger accounts not configured for company ${companyId}. ` +
          'Required: Accounts Receivable and Revenue accounts.',
      );
    }

    const amount = baseAmount || totalAmount;

    const journalInput: CreateJournalEntryInput = {
      companyId,
      date: invoice.date.toISOString().split('T')[0],
      reference: invoice.invoiceNumber,
      description: `Automated ledger sync — invoice ${invoice.invoiceNumber} issued to ${invoice.customerName}`,
      lines: [
        {
          accountId: arAccount.id,
          debit: amount,
          credit: 0,
        },
        {
          accountId: revenueAccount.id,
          debit: 0,
          credit: amount,
        },
      ],
    };

    // createJournalEntry validates debits === credits internally
    await this.doubleEntryService.createJournalEntry(journalInput, `system:invoicing:${invoice.id}`);

    this.logger.log(
      `Posted balanced journal entry for invoice ${invoice.invoiceNumber} — ` +
        `Debit AR ${arAccount.id}, Credit Revenue ${revenueAccount.id}, Amount ${amount}`,
    );
  }

  /**
   * Find the first active, leaf-level account of a given AccountCategory
   * for a tenant.  Returns only the id for use in journal line creation.
   */
  private async findDefaultAccountByCategory(
    companyId: string,
    category: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.account.findFirst({
      where: {
        companyId,
        category: category as any,
        isActive: true,
        isLeaf: true,
      },
      select: { id: true },
    });
  }
}
