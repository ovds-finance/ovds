<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Email, Notifications, API Keys & App Store

> **Part of:** [Settings](./README.md)
>
> **Requires:** Login · `settings:read` · `settings:write` · `notifications:config`
>
> **Navigate to:** **Administration → Notification Settings** (`/admin/notifications-settings`) · **Settings → API Keys**

---

## Email / SMTP Configuration

Navigate to **Administration → Notification Settings → Email** — requires `notifications:config`.

OVDS sends emails for invoice delivery, payslips, payment reminders, leave approvals, password resets, and system alerts. All outbound email goes through your configured SMTP provider.

### SMTP Settings

| Field | Description | Example |
|-------|-------------|---------|
| Host | SMTP server hostname | `smtp.gmail.com` |
| Port | SMTP port | `587` (TLS) or `465` (SSL) |
| Username | SMTP login username | `noreply@yourcompany.com` |
| Password | SMTP password (stored encrypted) | — |
| From Address | Sender email address | `noreply@yourcompany.com` |
| From Name | Display name for outbound emails | `Your Company Name` |
| Encryption | TLS or SSL | TLS recommended |

### Common SMTP Providers

| Provider | Host | Port | Notes |
|----------|------|:----:|-------|
| Gmail (G Suite) | `smtp.gmail.com` | 587 | Requires App Password if 2FA enabled |
| Outlook / Microsoft 365 | `smtp.office365.com` | 587 | OAuth2 recommended for M365 |
| Mailtrap (testing) | `smtp.mailtrap.io` | 2525 | Development only — intercepts all emails |
| SendGrid | `smtp.sendgrid.net` | 587 | Requires API key as password |
| Amazon SES | `email-smtp.[region].amazonaws.com` | 587 | Requires verified domain |

### Testing the Connection

1. Enter your SMTP credentials.
2. Click **Test Connection** — OVDS sends a test email to the admin's email address.
3. If the test fails, check the host, port, and credential fields.

> If SMTP is not configured, email features are silently skipped — invoices save but are not emailed; payslips generate but are not delivered. Configure SMTP before inviting users or sending invoices.

---

## Email Templates

Navigate to **Administration → Email Templates** (`/email-templates`).

Customizable HTML templates for every outbound email OVDS sends. Each template supports dynamic variables.

| Template | Trigger | Key Variables |
|----------|---------|--------------|
| Invoice Sent | Invoice emailed to customer | `{{customerName}}`, `{{invoiceNumber}}`, `{{amount}}`, `{{dueDate}}`, `{{payLink}}` |
| Payment Received | Invoice marked Paid | `{{customerName}}`, `{{invoiceNumber}}`, `{{amount}}`, `{{paidDate}}` |
| Payment Reminder | Automated reminder | `{{customerName}}`, `{{invoiceNumber}}`, `{{daysOverdue}}`, `{{balance}}` |
| Payslip Delivery | Monthly payroll export | `{{employeeName}}`, `{{month}}`, `{{netPay}}` |
| Leave Approval | Leave request approved | `{{employeeName}}`, `{{leaveType}}`, `{{fromDate}}`, `{{toDate}}` |
| Leave Rejection | Leave request rejected | `{{employeeName}}`, `{{reason}}` |
| Password Reset | User requests password reset | `{{userName}}`, `{{resetLink}}` |
| User Invitation | New user added | `{{userName}}`, `{{role}}`, `{{setupLink}}` |
| Tax Filing Alert | Filing deadline approaching | `{{taxType}}`, `{{deadline}}`, `{{daysRemaining}}` |

### Editing a Template

1. Go to **Administration → Email Templates**.
2. Click a template name.
3. Edit the subject line and HTML body — variables are shown in the sidebar.
4. Click **Preview** to see the rendered output.
5. Click **Save**.

> Use plain HTML with inline styles — email clients have limited CSS support.

---

## Notification Channels

Navigate to **Administration → Notification Settings** (`/admin/notifications-settings`) — requires `notifications:config`.

OVDS supports four notification channels in addition to email:

| Channel | Use Case | Setup |
|---------|---------|-------|
| **Email (SMTP)** | Invoices, payslips, alerts | SMTP credentials above |
| **In-App** | Real-time WebSocket notifications in the UI | No setup required — always active |
| **Slack** | Team alerts, deadline reminders, approval requests | Enter Slack Incoming Webhook URL |
| **Intercom** | Customer support and billing issue management | Enter Intercom App ID and Secret |

### Slack Integration

1. In your Slack workspace, create an **Incoming Webhook** for the target channel.
2. Copy the webhook URL (format: `https://hooks.slack.com/services/...`).
3. Go to **Notification Settings → Slack** in OVDS.
4. Paste the webhook URL.
5. Select which events trigger Slack notifications:
   - Invoice overdue
   - Tax filing deadline approaching
   - Payroll approved
   - New helpdesk ticket
   - IoT device offline
6. Click **Save** → click **Test** to send a sample message.

### Notification Campaigns

Create targeted bulk notifications for specific audiences:

1. Go to **Notification Settings → Campaigns → New Campaign**.
2. Select the **audience** — All Customers, All Employees, ovds team, etc.
3. Select the **channel** — Email, In-App, or Slack.
4. Write the **subject** and **message body**.
5. Set a **send time** — immediately or scheduled.
6. Click **Send** or **Schedule**.

Common use cases:
- Remind all customers with overdue invoices to pay
- Notify the ovds team of an upcoming tax deadline
- Alert all employees about a system maintenance window

---

## Attendance & Geofencing Settings

Navigate to **Settings → Attendance tab** — requires `settings:write`.

### Geofence Setup

Used for GPS-based mobile attendance check-in.

1. Enter the **workplace coordinates** (latitude and longitude).
   - Find coordinates by right-clicking your location in Google Maps → "What's here?"
2. Set the **allowed radius** in meters — default: 100m.
3. Toggle **Geofence Enforcement** to On.

When enforcement is on, employees who check in from outside the geofence radius receive a warning and their attendance is flagged for HR review.

### Attendance Methods Quick Reference

| Method | Setup Required | Notes |
|--------|---------------|-------|
| Mobile (GPS) | Geofence coordinates | Employee checks in via browser |
| QR Code | Print QR from Settings | New QR generated daily |
| Biometric | Device enrollment at `/enrollment` | Fingerprint or face ID |
| Manual | None | HR records attendance directly |

### Working Hours

- **Standard hours** — set per shift in **HR → Shifts**
- **Overtime threshold** — minutes after shift end before overtime applies
- **Grace period** — minutes after shift start before a late arrival is flagged

---

## API Keys

Navigate to **Settings → API Keys** (`/settings?tab=api-keys`) — requires `settings:read`.

Generate API keys to allow external systems, scripts, and integrations to access OVDS data programmatically.

### Creating an API Key

1. Go to **Settings → API Keys** → click **New API Key**.
2. Fill in:

| Field | Description |
|-------|-------------|
| Name | Descriptive label — e.g. "Zapier Integration" or "Monthly Export Script" |
| Scopes | Permissions granted — select only what the integration needs |
| Expires In | 30 / 90 / 180 / 365 days, or Never |

3. Click **Create** — the full key is displayed **once only**. Copy it immediately.
4. Store it securely in a password manager or secret vault — it cannot be retrieved again.

### Available Scopes

| Scope | Access Granted |
|-------|---------------|
| `invoices:read` | Read invoices and customer payment history |
| `invoices:write` | Create and update invoices |
| `bills:read` | Read vendor bills |
| `payroll:read` | Read payroll records and payslips |
| `employees:read` | Read employee records |
| `reports:read` | Run and download reports |
| `vat:read` | Read VAT calculations and filings |
| `settings:read` | Read company settings |

> Apply the **principle of least privilege** — grant only the scopes the integration actually needs.

### Managing Keys

- Keys are listed with their name, scopes, creation date, expiry, and first 8 characters (prefix).
- Rotate a key by deleting it and creating a new one.
- Revoke a compromised key immediately by deleting it — all requests using the old key will return 401.

---

## App Store & Extensions

Navigate to **Administration → App Store** (`/app-store`) — requires `apps:write`.

Install optional extensions to add functionality to your OVDS instance:

| Extension | Description | Category |
|-----------|-------------|---------|
| **2FA Authenticator** | TOTP two-factor authentication for all users | Security |
| **IoT Module** | Fiscal printers, POS terminals, sensors, GPS fleet | IoT / Compliance |
| **Telebirr Gateway** | Ethio Telecom mobile money integration | Payments |
| **Chapa Gateway** | Online card and mobile payment processing | Payments |
| **CBE Pay** | Commercial Bank of Ethiopia direct API | Payments |
| **Stripe** | International card payments (USD/EUR) | Payments |
| **Address Finder** | Ethiopian address autocomplete on forms | Utilities |
| **Live Currency** | Real-time ETB exchange rate feed | ovds |
| **Calendar Integration** | Sync leave and payroll events with Google Calendar | HR |
| **Custom Fields** | Add Text, Checkbox, Toggle Button, Date, Time, and other custom information to invoices, customers, items, accounts, transfers, vendors, and more. Create unlimited custom fields tailored to your needs, mark data as required, define positions, set defaults, and customize field sizes. | Customization |

### Installing an Extension

1. Go to **App Store**.
2. Browse or search for the extension.
3. Click **Install**.
4. Follow the configuration steps shown after installation (e.g., enter API keys for payment gateways).
5. The new module appears in the relevant section of the sidebar immediately.

### Uninstalling

Click the installed extension → **Uninstall**. Data created by the extension (payments, IoT events) is retained — only the UI and API connections are removed.

---

## Settings Quick Reference

| Setting | Route | Permission |
|---------|-------|-----------|
| Company profile & TIN | `/settings/company-profile` | `settings:write` |
| Localization & Calendar | `/settings` | `settings:write` |
| Tax Engine | `/tax/dashboard` | `vat:read` |
| Invoice template & numbering | `/settings` → Invoices tab | `settings:write` |
| Currencies & FX | `/fx-rates` | `ovds:read` |
| Bank Accounts | `/banking/accounts` | `banking:read` |
| Digital Wallets (Telebirr) | `/settings/digital-wallets` | `banking:read` |
| Chapa Gateway | `/settings/payment-gateways/chapa` | `apps:read` |
| CBE Pay | `/settings/payment-gateways/cbepay` | `apps:read` |
| Stripe | `/settings/payment-gateways/stripe` | `apps:read` |
| Payment Terms | `/settings` → Payment Terms tab | `settings:write` |
| SMTP Email | `/admin/notifications-settings` | `notifications:config` |
| Email Templates | `/email-templates` | `notifications:config` |
| Slack / Intercom | `/admin/notifications-settings` | `notifications:config` |
| Attendance & Geofencing | `/settings` → Attendance tab | `settings:write` |
| API Keys | `/settings?tab=api-keys` | `settings:read` |
| App Store | `/app-store` | `apps:write` |
| White-label / Branding | `/settings` → Branding tab | ADMIN / SPURADMIN |
| IoT Device Registry | `/iot/devices` | `api_docs:read` |
| Users & Roles | `/users` | `users:read` |
| Role Permissions Matrix | `/role-permissions` | `role_permissions:read` |
| Setup Wizard | `/getting-started` | `settings:read` |

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| System Administration Setup checklist | [System Administration Setup](./system-administration-setup.md) |
| Company profile and tax rates | [Company & Tax Settings](./company-and-tax.md) |
| Bank accounts and payment gateways | [Banking & Payments Settings](./banking-and-payments.md) |
| Telebirr and Chapa daily operations | [Banking → Digital Payments](../05-banking/digital-payments.md) |
| User roles and permissions | [Users & Roles → RBAC Matrix](../02-users-roles/rbac-matrix.md) |
| IoT device setup | [Advanced → IoT & POS](../08-advanced/iot-and-pos.md) |




