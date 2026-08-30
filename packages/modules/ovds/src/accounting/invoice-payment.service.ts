import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';

export interface RecordPaymentInput {
  invoiceId: string;
  companyId: string;
  cashAccountId: string;
  amount: number;
  method?: string;
  reference?: string;
  notes?: string;
  userId?: string;
}

export interface PaymentResult {
  success: boolean;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  newStatus: string;
  journalEntryId?: string;
  message: string;
}

@Injectable()
export class InvoicePaymentService {
  private readonly logger = new Logger(InvoicePaymentService.name);

  constructor(private prisma: PrismaClient) {}

  async recordPayment(input: RecordPaymentInput): Promise<PaymentResult> {
    const {
      invoiceId,
      companyId,
      cashAccountId,
      amount,
      method = 'CASH',
      reference,
      notes,
      userId,
    } = input;

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, companyId },
        include: { invoiceItem: true },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      const totalAmount = Number(invoice.totalAmount || 0);
      const previousPayments = await tx.invoicePayment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      });
      const alreadyPaid = Number(previousPayments._sum.amount || 0);
      const remainingBalance = Math.max(0, totalAmount - alreadyPaid);

      if (amount > remainingBalance + 0.01) {
        throw new BadRequestException(
          `Payment amount ETB ${amount} exceeds remaining balance ETB ${remainingBalance.toFixed(2)}`,
        );
      }

      const newTotalPaid = alreadyPaid + amount;
      let newStatus = 'PENDING';
      if (newTotalPaid >= totalAmount - 0.01) {
        newStatus = 'PAID';
      } else if (newTotalPaid > 0) {
        newStatus = 'PARTIAL';
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus as any,
          notes: notes
            ? invoice.notes
              ? `${invoice.notes}\n[PAYMENT] ${method} payment received: ETB ${amount.toFixed(2)} ref:${reference ?? 'N/A'}`
              : `[PAYMENT] ${method} payment received: ETB ${amount.toFixed(2)} ref:${reference ?? 'N/A'}`
            : invoice.notes,
        },
      });

      const invoicePayment = await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount,
          currencyCode: invoice.currencyCode,
          method,
          reference: reference ?? null,
          notes: notes ?? null,
          companyId,
          paidAt: new Date(),
          paymentSource: method === 'CASH' ? 'cash' : method === 'BANK_TRANSFER' ? 'bank' : 'other',
        },
      });

      const receivableAccount = await tx.account.findFirst({
        where: {
          companyId,
          OR: [
            { code: '1200' },
            { category: 'ACCOUNTS_RECEIVABLE' },
          ],
        },
      });

      if (!receivableAccount) {
        throw new BadRequestException(
          'Accounts Receivable account not found. Please set up your Chart of Accounts before recording payments.',
        );
      }

      const jeDescription = `Payment received for Invoice #${invoice.invoiceNumber}${reference ? ` (ref: ${reference})` : ''}`;

      const journalEntry = await tx.journalEntry.create({
        data: {
          companyId,
          date: new Date(),
          description: jeDescription,
          status: 'POSTED',
          postedBy: userId ?? null,
          period: new Date().toISOString().slice(0, 7),
          journalLine: {
            create: [
              {
                accountId: cashAccountId,
                description: `Payment received — ${invoice.invoiceNumber}`,
                debit: Math.round(amount * 100) / 100,
                credit: 0,
                companyId,
                costCenterId: null,
                taxType: null,
              },
              {
                accountId: receivableAccount.id,
                description: `Reduce AR — ${invoice.invoiceNumber}`,
                debit: 0,
                credit: Math.round(amount * 100) / 100,
                companyId,
                costCenterId: null,
                taxType: null,
              },
            ],
          },
        },
        include: { journalLine: true },
      });

      const lastPayment = await tx.invoicePayment.findFirst({
        where: { invoiceId },
        orderBy: { createdAt: 'desc' },
      });

      if (lastPayment) {
        await tx.invoicePayment.update({
          where: { id: lastPayment.id },
          data: { journalEntryId: journalEntry.id },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId,
          action: 'CREATE',
          userId: userId ?? companyId,
          details: JSON.stringify({
            entityType: 'InvoicePayment',
            entityId: invoicePayment.id,
            invoiceId,
            amount,
            newStatus,
            journalEntryId: journalEntry.id,
          }),
        },
      });

      return {
        success: true,
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        amount,
        newStatus,
        journalEntryId: journalEntry.id,
        message: `Payment of ETB ${amount.toFixed(2)} recorded successfully. Invoice status: ${newStatus}`,
      };
    });
  }
}
