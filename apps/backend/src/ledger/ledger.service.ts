import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@ovds/database';
import { randomUUID } from 'crypto';

import { PrismaService } from '../common/prisma.service';
import { CreateLedgerEntryDTO } from '@ovds/dto';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async postJournalEntry(dto: CreateLedgerEntryDTO) {
    // 1. Enforce Accounting Invariance Axiom (Debits === Credits)
    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of dto.lines) {
      if (line.amount <= 0) {
        throw new BadRequestException('Transaction amounts must be positive values.');
      }
      if (line.type === 'DEBIT') totalDebits += line.amount;
      else if (line.type === 'CREDIT') totalCredits += line.amount;
    }

    // Handle floating-point arithmetic precision variations safely
    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      throw new BadRequestException(
        `Unbalanced Transaction! Debits (${totalDebits}) must exactly equal Credits (${totalCredits}).`,
      );
    }

    // 2. Wrap Execution inside isolated SQL ACID Database Transaction
    return this.prisma.$transaction(async (tx) => {
      const postedAt = dto.postedAt ? new Date(dto.postedAt) : new Date();

      const entry = await tx.journalEntry.create({
        data: {
          entryNumber: randomUUID(),
          date: postedAt,
          description: dto.description,
          reference: dto.reference,
          status: 'POSTED',
          period: postedAt.toISOString().slice(0, 7),
          companyId: dto.companyId,
        },
      });

      const journalLinesData = dto.lines.map((line) => ({
        journalEntryId: entry.id,
        accountId: line.accountId,
        debit: line.type === 'DEBIT' ? new Prisma.Decimal(line.amount) : new Prisma.Decimal(0),
        credit: line.type === 'CREDIT' ? new Prisma.Decimal(line.amount) : new Prisma.Decimal(0),
        companyId: dto.companyId,
      }));

      await tx.journalLine.createMany({
        data: journalLinesData,
      });

      // Post immutable ledger entries — one per journal line
      await tx.ledgerEntry.createMany({
        data: dto.lines.map((line) => ({
          journalEntryId: entry.id,
          accountId: line.accountId,
          companyId: dto.companyId,
          debit: line.type === 'DEBIT' ? new Prisma.Decimal(line.amount) : new Prisma.Decimal(0),
          credit: line.type === 'CREDIT' ? new Prisma.Decimal(line.amount) : new Prisma.Decimal(0),
        })),
      });

      return tx.journalEntry.findUnique({
        where: { id: entry.id },
        include: { journalLine: { include: { account: true } }, ledgerEntries: true },
      });
    });
  }
}
