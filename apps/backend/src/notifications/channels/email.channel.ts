import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { INotificationChannel } from './notification-channel.interface';
import type { EmailJobData } from '../notification.jobs';

@Injectable()
export class EmailChannel implements INotificationChannel<EmailJobData> {
  readonly channelName = 'email';
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host:   config.get('SMTP_HOST', 'smtp.gmail.com'),
      port:   parseInt(config.get('SMTP_PORT', '587'), 10),
      secure: config.get('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  async send(payload: EmailJobData): Promise<void> {
    const from = this.config.get('SMTP_FROM', 'noreply@ovds.app');
    await this.transporter.sendMail({
      from,
      to:      payload.to,
      subject: payload.subject,
      html:    payload.html,
    });
    this.logger.debug(`Email sent to ${payload.to}`);
  }
}
