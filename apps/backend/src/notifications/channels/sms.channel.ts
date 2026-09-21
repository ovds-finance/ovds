/**
 * Twilio SMS channel.
 * Uses the same credentials as WhatsApp but sends plain SMS via Messaging API.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { SmsJobData } from '../notification.jobs';

import type { INotificationChannel } from './notification-channel.interface';

@Injectable()
export class SmsChannel implements INotificationChannel<SmsJobData> {
  readonly channelName = 'sms';
  private readonly logger = new Logger(SmsChannel.name);

  constructor(private readonly config: ConfigService) {}

  async send(payload: SmsJobData): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken  = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from       = this.config.get<string>('TWILIO_SMS_FROM');

    if (!accountSid || !authToken || !from) {
      this.logger.warn('SMS channel not configured — skipping');
      return;
    }

    const body = new URLSearchParams({
      From: from,
      To:   payload.to,
      Body: payload.body,
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
      throw new Error(`Twilio SMS error ${res.status}: ${err}`);
    }

    this.logger.debug(`SMS sent to ${payload.to}`);
  }
}
