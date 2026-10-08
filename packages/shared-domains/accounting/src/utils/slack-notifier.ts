// apps/shared-domains/accounting/src/utils/slack-notifier.ts
import { Injectable, Logger } from '@nestjs/common';

interface SlackPayload { entryId: string; tenantId: string; debits: number; credits: number; variance: number; }

@Injectable()
export class SlackNotifierService {
  private readonly logger = new Logger(SlackNotifierService.name);
  private readonly webhookUrl = process.env.SLACK_OPS_WEBHOOK_URL;

  async dispatchBreachAlert(payload: SlackPayload): Promise<void> {
    if (!this.webhookUrl) { this.logger.warn('Slack webhook missing.'); return; }
    try {
      await fetch(this.webhookUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 LEDGER IMBALANCE: Tenant ${payload.tenantId}, Entry ${payload.entryId}`,
          attachments: [{ color: '#ef4444', blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `*Debits:* $${payload.debits.toFixed(2)} | *Credits:* $${payload.credits.toFixed(2)} | *Variance:* $${payload.variance.toFixed(2)}` } }] }]
        })
      });
    } catch (error: any) { this.logger.error(`Slack alert failed: ${error.message}`); }
  }
}
