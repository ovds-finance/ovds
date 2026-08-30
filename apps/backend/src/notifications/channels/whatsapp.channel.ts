/**
 * Twilio WhatsApp template-based channel.
 *
 * Uses Twilio's Content Template Builder (v1) to send pre-approved WhatsApp
 * templates. All outbound messages MUST use an approved template — free-form
 * messages outside the 24-hour session window are rejected by Meta.
 *
 * Prerequisites:
 *  TWILIO_ACCOUNT_SID   — your Twilio account SID
 *  TWILIO_AUTH_TOKEN    — auth token (never commit to source)
 *  TWILIO_WHATSAPP_FROM — your Twilio WhatsApp sender e.g. whatsapp:+14155238886
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { INotificationChannel } from './notification-channel.interface';
import type { WhatsAppJobData } from '../notification.jobs';

@Injectable()
export class WhatsAppChannel implements INotificationChannel<WhatsAppJobData> {
  readonly channelName = 'whatsapp';
  private readonly logger = new Logger(WhatsAppChannel.name);

  constructor(private readonly config: ConfigService) {}

  async send(payload: WhatsAppJobData): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken  = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from       = this.config.get<string>('TWILIO_WHATSAPP_FROM');

    if (!accountSid || !authToken || !from) {
      this.logger.warn('WhatsApp channel not configured — skipping');
      return;
    }

    /**
     * Build the Twilio Messages API body manually to avoid a hard runtime
     * dependency on the Twilio Node SDK (which adds ~4 MB to the bundle).
     * If you prefer the SDK, install `twilio` and replace this fetch call.
     */
    const body = new URLSearchParams({
      From: from,
      To:   `whatsapp:${payload.to}`,
      // Content template variables are passed as ContentVariables JSON
      ContentSid:       payload.templateName,   // use Twilio Content SID here
      ContentVariables: JSON.stringify(
        payload.templateParams.reduce<Record<string, string>>(
          (acc, val, idx) => { acc[String(idx + 1)] = val; return acc; },
          {},
        ),
      ),
    });

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const res = await fetch(url, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Twilio WhatsApp error ${res.status}: ${err}`);
    }

    this.logger.debug(`WhatsApp template sent to ${payload.to}`);
  }
}
