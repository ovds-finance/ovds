import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ovds/database';
import { FraudEngineService, RiskScore } from './fraud-engine.service';
import { AuditWebhookDispatcher } from '@ovds/integration';
import { Big } from 'big.js';

export enum RefundState {
  RECEIVED = 'RECEIVED',
  RISK_EVALUATION = 'RISK_EVALUATION',
  PENDING_MOR_APPROVAL = 'PENDING_MOR_APPROVAL',
  QUEUED_FOR_BANK_CLEARING = 'QUEUED_FOR_BANK_CLEARING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

@Injectable()
export class RefundStateMachineService {
  constructor(
    private prisma: PrismaService,
    private fraudEngine: FraudEngineService,
    private webhookDispatcher: AuditWebhookDispatcher
  ) {}

  async advanceRefundWorkflow(declarationId: string, tenantId: string): Promise<RefundState> {
    return this.prisma.$transaction(async (tx) => {
      const declaration = await tx.vatDeclaration.findFirst({
        where: { id: declarationId, tenantId }
      });

      if (!declaration || declaration.netVatDueCents >= 0n) {
        throw new BadRequestException('Invalid operation: Target specification context does not contain a refundable balance state.');
      }

      const historicalAverage = 5000000n;
      const riskAnalysis = this.fraudEngine.analyzeDeclarationRisk({
        netAmountCents: declaration.netVatDueCents,
        vatAmountCents: declaration.netVatDueCents,
        historicalAverageMonthlyCents: historicalAverage,
        companyAgeDays: 120
      });

      let targetState = RefundState.QUEUED_FOR_BANK_CLEARING;
      if (riskAnalysis.score === RiskScore.HIGH) {
        targetState = RefundState.PENDING_MOR_APPROVAL;

        await this.webhookDispatcher.dispatchAuditAlert({
          tenantId,
          declarationId,
          riskScore: riskAnalysis.score,
          triggeredRules: riskAnalysis.warningIndicators,
          timestamp: new Date().toISOString()
        });
      }

      await tx.vatDeclaration.update({
        where: { id: declarationId },
        data: { status: `REFUND_${targetState}` }
      });

      return targetState;
    });
  }
}