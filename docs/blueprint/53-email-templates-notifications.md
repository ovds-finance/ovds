# 53 — Email Templates and Notification System

## 1. Email Template Architecture

The system uses a template-based email system with per-organization customization.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Email Template System                        │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Global     │  │  Per-       │  │  Template Engine        │ │
│  │  Templates  │  │  Company    │  │  (Handlebars/Mustache)  │ │
│  │             │  │  Overrides  │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │  Email Service      │                        │
│                   │  (Nodemailer/       │                        │
│                   │   SendGrid)         │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Email Template Model

```prisma
model EmailTemplate {
  id          String   @id @default(cuid())
  organizationId String?
  alias       String   // "vat_return_due", "submission_success"
  subject     String
  body        String   // HTML
  textBody    String?  // Plain text fallback
  language    String   @default("en")
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([alias, organizationId])
  @@index([organizationId])
}
```

## 3. Template Storage

```
emails/
├── global/
│   ├── vat_return_due/
│   │   ├── subject.txt
│   │   ├── body.html
│   │   └── body.txt
│   ├── submission_success/
│   │   ├── subject.txt
│   │   ├── body.html
│   │   └── body.txt
│   ├── submission_failed/
│   ├── payment_due/
│   ├── user_invited/
│   ├── password_reset/
│   └── welcome/
└── {organization_id}/
    └── {template_alias}/
        ├── subject.txt
        ├── body.html
        └── body.txt
```

## 4. Template Engine

```typesystem
// emails/services/template-engine.service.ts
@Injectable()
export class TemplateEngineService {
  async render(template: EmailTemplate, data: TemplateData): Promise<EmailContent> {
    const subject = await this.compile(template.subject, data);
    const body = await this.compile(template.body, data);
    const textBody = template.textBody ? await this.compile(template.textBody, data) : this.htmlToText(body);

    return { subject, body, textBody };
  }

  private async compile(template: string, data: TemplateData): Promise<string> {
    // Use Handlebars for template compilation
    const compiled = handlebars.compile(template);
    return compiled(data);
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

## 5. Template Variables

```handlebars
<!-- emails/global/vat_return_due/body.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{subject}}</title>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background: #f8f9fa; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
    .footer { padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VAT Return Due Soon</h1>
    </div>
    <div class="content">
      <p>Dear {{user.firstName}},</p>

      <p>Your VAT return for the period <strong>{{return.periodStart}} to {{return.periodEnd}}</strong> is due on <strong>{{return.dueDate}}</strong>.</p>

      <h2>Return Details</h2>
      <ul>
        <li>Return Number: {{return.number}}</li>
        <li>Period: {{return.periodStart}} - {{return.periodEnd}}</li>
        <li>Due Date: {{return.dueDate}}</li>
        <li>Status: {{return.status}}</li>
      </ul>

      {{#if return.netVatDue}}
      <h2>Amount Due</h2>
      <p>Net VAT Due: <strong>{{formatCurrency return.netVatDue return.currencyCode}}</strong></p>
      {{/if}}

      <p>
        <a href="{{appUrl}}/vat-returns/{{return.id}}" class="button">View VAT Return</a>
      </p>

      <p>If you have already submitted this return, please ignore this notification.</p>
    </div>
    <div class="footer">
      <p>© {{year}} {{organization.name}}. All rights reserved.</p>
      <p><a href="{{appUrl}}/settings/notifications">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>
```

## 6. Template Data Context

```typescript
// emails/types/template-data.types.ts
export interface TemplateData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  organization: {
    name: string;
    url?: string;
  };
  return?: {
    id: string;
    number: string;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
    status: string;
    netVatDue?: number;
    currencyCode: string;
  };
  appUrl: string;
  year: number;
  supportEmail: string;
}

export interface EmailContent {
  subject: string;
  body: string;
  textBody: string;
}
```

## 7. Email Service

```typescript
// emails/services/email.service.ts
@Injectable()
export class EmailService {
  constructor(
    private readonly templateEngine: TemplateEngineService,
    private readonly mailerService: MailerService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  async send(params: SendEmailParams): Promise<void> {
    // 1. Get template
    const template = await this.emailTemplateService.findByAlias(params.templateAlias, params.organizationId);

    // 2. Render template
    const content = await this.templateEngine.render(template, params.data);

    // 3. Send email
    await this.mailerService.sendMail({
      to: params.to,
      from: this.getFromAddress(params.organizationId),
      subject: content.subject,
      html: content.body,
      text: content.textBody,
      headers: {
        'X-Email-Type': params.templateAlias,
        'X-Organization-ID': params.organizationId,
      },
    });
  }

  private getFromAddress(organizationId: string): { name: string; email: string } {
    const org = this.organizationCache.get(organizationId);
    return {
      name: org?.name || 'VAT SaaS',
      email: 'noreply@vat-saas.com',
    };
  }
}
```

## 8. Notification Email Queue

```typescript
// queue/jobs/send-notification-email.job.ts
export interface SendNotificationEmailJobData {
  notificationId: string;
  organizationId: string;
  userId: string;
  templateAlias: string;
  data: TemplateData;
}

@Processor('emails')
export class SendNotificationEmailProcessor {
  constructor(private readonly emailService: EmailService) {}

  @Process('send_notification_email')
  async handleSendEmail(job: Job<SendNotificationEmailJobData>) {
    const { notificationId, organizationId, userId, templateAlias, data } = job.data;

    try {
      await this.emailService.send({
        organizationId,
        to: data.user.email,
        templateAlias,
        data,
      });

      await this.markAsSent(notificationId);
    } catch (error) {
      await this.markAsFailed(notificationId, error.message);
      throw error;
    }
  }
}
```

## 9. Email Preferences

```typescript
// notifications/models/notification-preference.ts
export interface NotificationPreference {
  userId: string;
  organizationId: string;
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  types: {
    vatReturnDue: { email: boolean; push: boolean; inApp: boolean };
    submissionSuccess: { email: boolean; push: boolean; inApp: boolean };
    submissionFailed: { email: boolean; push: boolean; inApp: boolean };
    paymentDue: { email: boolean; push: boolean; inApp: boolean };
    integrationExpired: { email: boolean; push: boolean; inApp: boolean };
  };
}

// notifications/services/notification-preference.service.ts
@Injectable()
export class NotificationPreferenceService {
  async shouldSend(userId: string, organizationId: string, type: string, channel: string): Promise<boolean> {
    const preference = await this.getPreference(userId, organizationId);
    return preference.types[type]?.[channel] ?? true;
  }
}
```

## 10. Email Analytics

```typescript
// emails/services/email-analytics.service.ts
@Injectable()
export class EmailAnalyticsService {
  async trackOpen(notificationId: string, userId: string): Promise<void> {
    await this.prisma.emailEvent.create({
      data: {
        notificationId,
        userId,
        organizationId: TenantContext.getOrganizationId()!,
        type: 'open',
        userAgent: TenantContext.get('userAgent'),
        ipAddress: TenantContext.get('ipAddress'),
      },
    });
  }

  async trackClick(notificationId: string, userId: string, url: string): Promise<void> {
    await this.prisma.emailEvent.create({
      data: {
        notificationId,
        userId,
        organizationId: TenantContext.getOrganizationId()!,
        type: 'click',
        url,
        userAgent: TenantContext.get('userAgent'),
        ipAddress: TenantContext.get('ipAddress'),
      },
    });
  }

  async getStats(organizationId: string, period: DateRange): Promise<EmailStats> {
    const [sent, opens, clicks, bounces] = await Promise.all([
      this.prisma.emailEvent.count({
        where: { organizationId, type: 'send', createdAt: { gte: period.from, lte: period.to } },
      }),
      this.prisma.emailEvent.count({
        where: { organizationId, type: 'open', createdAt: { gte: period.from, lte: period.to } },
      }),
      this.prisma.emailEvent.count({
        where: { organizationId, type: 'click', createdAt: { gte: period.from, lte: period.to } },
      }),
      this.prisma.emailEvent.count({
        where: { organizationId, type: 'bounce', createdAt: { gte: period.from, lte: period.to } },
      }),
    ]);

    return {
      sent,
      opens,
      clicks,
      bounces,
      openRate: sent > 0 ? (opens / sent) * 100 : 0,
      clickRate: sent > 0 ? (clicks / sent) * 100 : 0,
      bounceRate: sent > 0 ? (bounces / sent) * 100 : 0,
    };
  }
}
```
