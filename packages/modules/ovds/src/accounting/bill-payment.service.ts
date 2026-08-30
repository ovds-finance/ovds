import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';

export interface RecordBillPaymentInput {
  billId: string;
  companyId: string;
  bankAccountId: string;
  amount: number;
  method?: string;
  reference?: string;
  notes?: string;
  userId?: string;
}

export interface BillPaymentResult {
  success: boolean;
  billId: string;
  billNumber: string;
  amount: number;
  newStatus: string;
  journalEntryId?: string;
  message: string;
}

@Injectable()
export class BillPaymentService {
  private readonly logger = new Logger(BillPaymentService.name);

  constructor(private prisma: PrismaClient) {}

  async recordPayment(input: RecordBillPaymentInput): Promise<BillPaymentResult> {
    const {
      billId,
      companyId,
      bankAccountId,
      amount,
      method = 'BANK_TRANSFER',
      reference,
      notes,
      userId,
    } = input;

    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id: billId, companyId },
      });

      if (!bill) {
        throw new NotFoundException('Bill not found');
      }

      const totalAmount = Number(bill.total || bill.amount || 0);
      const previousPayments = await tx.billPayment.aggregate({
        where: { billId },
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

      const updatedBill = await tx.bill.update({
        where: { id: billId },
        data: {
          status: newStatus,
        },
      });

      const billPayment = await tx.billPayment.create({
        data: {
          billId,
          companyId,
          amount,
          currencyCode: bill.currencyCode || 'ETB',
          method,
          reference: reference ?? null,
          paidAt: new Date(),
        },
      });

      const apAccount = await tx.account.findFirst({
        where: {
          companyId,
          OR: [
            { code: '2000' },
            { category: 'ACCOUNTS_PAYABLE' },
          ],
        },
      });

      if (!apAccount) {
        throw new BadRequestException('Accounts Payable account not found.');
      }

      const jeDescription = `Payment for Bill #${bill.billNumber}${reference ? ` (ref: ${reference})` : ''}`;

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
                accountId: apAccount.id,
                description: `Reduce AP — ${bill.billNumber}`,
                debit: Math.round(amount * 100) / 100,
                credit: 0,
                companyId,
                costCenterId: null,
                taxType: null,
              },
              {
                accountId: bankAccountId,
                description: `Payment made — ${bill.billNumber}`,
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

      await tx.billPayment.update({
        where: { id: billPayment.id },
        data: { journalEntryId: journalEntry.id },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          action: 'CREATE',
          userId: userId ?? companyId,
          details: JSON.stringify({
            entityType: 'BillPayment',
            entityId: billPayment.id,
            billId,
            amount,
            newStatus,
            journalEntryId: journalEntry.id,
          }),
        },
      });

      return {
        success: true,
        billId,
        billNumber: bill.billNumber,
        amount,
        newStatus,
        journalEntryId: journalEntry.id,
        message: `Payment of ETB ${amount.toFixed(2)} recorded successfully. Bill status: ${newStatus}`,
      };
    });
  }
}
