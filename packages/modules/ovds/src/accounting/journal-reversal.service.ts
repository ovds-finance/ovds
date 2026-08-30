import { Injectable, BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@ovds/database';

export interface ReverseJournalEntryInput {
  journalEntryId: string;
  companyId: string;
  reason: string;
  userId?: string;
}

export interface ReversalResult {
  success: boolean;
  reversalId: string;
  originalId: string;
  description: string;
  message: string;
}

@Injectable()
export class JournalReversalService {
  private readonly logger = new Logger(JournalReversalService.name);

  constructor(private prisma: PrismaClient) {}

  async reverse(input: ReverseJournalEntryInput): Promise<ReversalResult> {
    const { journalEntryId, companyId, reason, userId } = input;

    return this.prisma.$transaction(async (tx) => {
      const original = await tx.journalEntry.findUnique({
        where: { id: journalEntryId },
        include: { journalLine: true },
      });

      if (!original) {
        throw new NotFoundException('Journal entry not found');
      }

      if (original.companyId !== companyId) {
        throw new ForbiddenException('Journal entry does not belong to this company');
      }

      if (original.reference?.startsWith('REVERSED_BY_')) {
        throw new BadRequestException('Journal entry has already been reversed');
      }

      const reversal = await tx.journalEntry.create({
        data: {
          companyId,
          date: new Date(),
          description: `Reversal of ${original.id}: ${reason}`,
          reference: original.id,
          status: 'POSTED',
          postedBy: userId ?? null,
          period: new Date().toISOString().slice(0, 7),
          journalLine: {
            create: original.journalLine.map((line) => ({
              accountId: line.accountId,
              description: `Reversal: ${line.description ?? ''}`,
              debit: line.credit,
              credit: line.debit,
              taxType: line.taxType,
              companyId,
              costCenterId: line.costCenterId,
            })),
          },
        },
        include: { journalLine: true },
      });

      await tx.journalEntry.update({
        where: { id: journalEntryId },
        data: { reference: `REVERSED_BY_${reversal.id}` },
      });

      await tx.auditLog.create({
        data: {
          companyId,
          action: 'REVERSE',
          userId: userId ?? companyId,
          details: JSON.stringify({
            entityType: 'JournalEntry',
            entityId: reversal.id,
            originalId: original.id,
            reversalId: reversal.id,
            reason,
          }),
        },
      });

      return {
        success: true,
        reversalId: reversal.id,
        originalId: original.id,
        description: reversal.description,
        message: `Journal entry ${original.id} reversed successfully. Reversal ID: ${reversal.id}`,
      };
    });
  }
}
