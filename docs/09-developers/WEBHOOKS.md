<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Webhooks & Integrations

OVDS supports outbound webhooks, the App Store extension system, and direct integrations with Ethiopian payment providers and government portals.

---

## Webhooks

Webhooks allow external systems to receive real-time notifications when events occur in OVDS.

### Configuration
Go to **Settings → Webhooks** (`/settings` → Webhooks tab) — requires `settings:write`.

1. Click **Add Webhook**
2. Enter the endpoint URL (must be HTTPS in production)
3. Select the events to subscribe to
4. Copy the **Signing Secret** — use it to verify webhook authenticity

### Webhook Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `invoice.created` | New invoice created | `{ invoiceId, invoiceNumber, customerId, amount, companyId }` |
| `invoice.paid` | Invoice fully paid | `{ invoiceId, invoiceNumber, amount, paymentMethod }` |
| `invoice.overdue` | Invoice past due date | `{ invoiceId, invoiceNumber, daysOverdue, amount }` |
| `bill.created` | New bill created | `{ billId, vendorId, amount, dueDate }` |
| `bill.paid` | Bill marked as paid | `{ billId, amount, paymentDate }` |
| `payroll.approved` | Payroll approved for disbursement | `{ month, year, totalNetPay, employeeCount }` |
| `employee.created` | New employee added | `{ employeeId, name, department }` |
| `vat.filed` | VAT return filed | `{ period, outputVat, inputVat, netVat }` |
| `pension.submitted` | Pension submission recorded | `{ period, employeeCount, totalAmount }` |
| `tax.payment_reference` | MoR payment voucher generated | `{ taxType, period, amount, referenceNumber }` |
| `leave.approved` | Leave request approved | `{ employeeId, leaveType, fromDate, toDate }` |
| `attendance.checkin` | Employee checks in | `{ employeeId, timestamp, method }` |
| `iot.sale` | POS/fiscal device records a sale | `{ deviceId, amount, vatAmount, receiptQR, timestamp }` |
| `iot.event` | Sensor/telematics event received | `{ deviceId, eventType, payload, timestamp }` |
| `iot.device_offline` | Device stops sending heartbeat | `{ deviceId, deviceType, lastSeen }` |
| `iot.device_restored` | Offline device comes back online | `{ deviceId, downtime_minutes }` |
| `banking.digital_payment` | Telebirr or Chapa payment received | `{ provider, reference, amount, invoiceId, matched }` |

### Webhook Payload Structure
```json
{
  "event": "invoice.paid",
  "timestamp": "2026-04-29T10:30:00Z",
  "companyId": "clx...",
  "data": {
    "invoiceId": "clx...",
    "invoiceNumber": "INV-2026-1042",
    "amount": 15000.00,
    "paymentMethod": "TELEBIRR"
  }
}
```

### Verifying Webhook Signatures
OVDS signs every webhook payload with HMAC-SHA256 using your signing secret:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return `sha256=${expected}` === signature;
}

// In your webhook handler:
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-ovds-signature'];
  if (!verifyWebhook(req.body, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  // Process the event
  console.log(req.body.event, req.body.data);
  res.status(200).send('OK');
});
```

### Retry Policy
- Failed webhooks (non-2xx response or timeout) are retried up to **5 times**
- Retry intervals: 1min, 5min, 30min, 2hr, 24hr (exponential backoff)
- After 5 failures, the webhook is marked as **failed** and disabled
- Re-enable from Settings → Webhooks

---

## App Store (Extensions)

The App Store allows installing extension modules without modifying core code.

### Installing an App
1. Go to **Administration → App Store** (`/app-store`) — requires `apps:read`
2. Browse available apps
3. Click **Install** — requires `apps:write`
4. The app is activated for your company immediately

### Available Apps

| App | Category | Description |
|-----|----------|-------------|
| 2FA Authenticator | Security | TOTP-based two-factor authentication |
| Address Finder | Productivity | Ethiopian address autocomplete |
| Live Currency | ovds | Real-time ETB exchange rates |
| Calendar | Productivity | Sync business activities with calendar |
| Telebirr Gateway | Payments | Direct Ethio Telecom mobile money integration |
| CBE Pay | Payments | Commercial Bank of Ethiopia payment gateway |
| Stripe | Payments | International card payments |
| Slack Notifications | Integrations | Send OVDS alerts to Slack channels |
| Intercom | Support | Customer support chat integration |

### Building an App
Apps are NestJS modules + React pages packaged for the App Store. See [AGENTS.md](AGENTS.md) for the full module development guide.

---

## Payment Gateway Integrations

### Telebirr (Ethio Telecom)
```env
TELEBIRR_BUSINESS_ID=your_merchant_id
TELEBIRR_APP_KEY=your_app_key
TELEBIRR_PUBLIC_KEY=your_public_key
TELEBIRR_SHORT_CODE=your_short_code
TELEBIRR_WEBHOOK_SECRET=your_signing_secret
```

**How it works:**
1. Customer clicks **Pay with Telebirr** on the invoice or client portal
2. OVDS calls the Telebirr Business API to initiate payment
3. Customer approves on their Telebirr app
4. Telebirr sends a webhook callback to `/api/webhooks/telebirr`
5. OVDS auto-matches the payment to the open invoice and marks it PAID
6. `payment.confirmed.for.fiscal.print` event fires — SRM prints receipt per tenant's §3.5 mode
7. The `banking.digital_payment` webhook fires to any subscribed external systems

**Setup in OVDS:** Settings → Currencies & Banking → Digital Wallets (`/settings/digital-wallets`)

**Circuit breaker:** If 3 consecutive API calls fail, the gateway is temporarily disabled and falls back to manual payment recording.

### Chapa Payment Gateway
```env
CHAPA_SECRET_KEY=your_secret_key
CHAPA_PUBLIC_KEY=your_public_key
CHAPA_WEBHOOK_SECRET=your_webhook_secret
CHAPA_CALLBACK_URL=https://your-domain.com/api/webhooks/chapa
```

**How it works:**
1. Customer clicks **Pay Now** on a client-portal invoice
2. OVDS calls Chapa API to create a payment link
3. Customer completes payment on the Chapa checkout page
4. Chapa sends a webhook to `/api/webhooks/chapa`
5. OVDS verifies the signature, marks the invoice PAID, and posts the receipt
6. Settlement reaches the company bank account within T+1 or T+2

**Setup in OVDS:** Settings → Payment Gateways → Chapa (`/settings/payment-gateways/chapa`)

### IoT Devices
```env
IOT_API_TOKEN_SECRET=your_token_signing_secret
IOT_HEARTBEAT_INTERVAL_SEC=300
IOT_OFFLINE_THRESHOLD_MIN=15
```

Devices authenticate with device-specific tokens generated in the IoT Device Registry. Each token is scoped to a single device and company:
```http
POST /api/iot/events
Authorization: Bearer <device_token>
Content-Type: application/json

{
  "deviceId": "DEV-FP-001",
  "eventType": "sale",
  "timestamp": "2026-07-01T10:30:00Z",
  "payload": {
    "amount": 1500.00,
    "vatAmount": 195.65,
    "items": [{ "sku": "ITEM-001", "qty": 2, "price": 750.00 }],
    "receiptQR": "ERCA-QR-XXXX"
  }
}
```

The IoT module processes the event, creates an invoice/receipt entry, posts VAT to the ledger, and fires the `iot.sale` webhook.

### CBE Pay / CBE Birr (Commercial Bank of Ethiopia)

```env
CBE_BIRR_MERCHANT_ID=your_merchant_id
CBE_BIRR_API_KEY=your_api_key
CBE_BIRR_WEBHOOK_SECRET=your_hmac_secret
```

**§2.3 — How it works:**
1. Customer pays via CBE Birr mobile wallet
2. CBE sends a webhook callback to `/api/webhooks/cbe-birr`
3. OVDS records the `BankTransaction` with `status: UNRECONCILED`
4. Auto-reconciliation scores the transaction against open invoices (§2.3)
5. Invoice marked PAID; GL auto-posted (Dr Cash, Cr AR)
6. `banking.digital_payment` webhook fires to external subscribers

**CBE Birr event normalisation (§2.3):**
- `transaction.confirmed` → normalised to `charge.success`
- `transaction.failed` → normalised to `charge.failed`

**§3.5 — Fiscal printing mode:**
On confirmation, OVDS emits `payment.confirmed.for.fiscal.print`. The IoT/SRM gateway reads the tenant's `fiscal_printing_mode` setting and either auto-prints (AUTOMATED) or unlocks the receipt button (MANUAL).

**Setup in OVDS:** Settings → Banking → CBE Birr (`/settings/digital-wallets`)

**Endpoint:** `POST /api/webhooks/cbe-birr` (public, HMAC-SHA256 verified in production)

### Bank Transfer (Manual)
No API integration required. Record bank transfers manually:
1. Customer makes a bank transfer
2. ovds team verifies the transfer
3. Records payment in OVDS with bank reference number

---

## eTax Portal Integration (ERCA)

OVDS integrates with the Ethiopian Revenue and Customs Authority (ERCA) eTax portal.

### VAT Filing
1. OVDS calculates the VAT return
2. Generates the ERCA-compliant XML/JSON file
3. Click **Submit to eTax** — opens [etax.erca.gov.et](https://etax.erca.gov.et) with pre-filled data
4. Or download the file for manual upload

### ERCA QR Code (NBE-IQR)
Every invoice automatically includes an ERCA-compliant QR code:
- Encodes: TIN, invoice number, date, amount, VAT amount
- Format: NBE-IQR (National Bank of Ethiopia IQR standard)
- Customers can scan to verify invoice authenticity on the ERCA portal

---

## Slack Integration

Send OVDS alerts to Slack channels:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../...
```

**Configurable alerts:**
- VAT deadline approaching (7 days, 3 days)
- Payroll approval pending
- Invoice overdue
- New employee added
- System health alerts

**Setup:**
1. Create a Slack Incoming Webhook in your Slack workspace
2. Go to **Admin → Notification Settings → Slack**
3. Paste the webhook URL
4. Select which events to send to Slack

---

## Intercom Integration

Customer support chat integration:

```env
INTERCOM_APP_ID=your_app_id
INTERCOM_SECRET_KEY=your_secret_key
```

**Features:**
- Identify users in Intercom with their OVDS role and company
- Track key events (invoice created, payroll run, VAT filed)
- Support agents can see user context in Intercom

---

## API Keys

For programmatic access without user credentials:

1. Go to **Settings → API Keys** — requires `settings:write`
2. Click **Generate API Key**
3. Copy the key — it's only shown once
4. Use it as a Bearer token: `Authorization: Bearer ovds_key_...`

API keys are scoped to a company and have the same permissions as the user who created them.

---

## Data Export & Backup

### Manual Export
- **Settings → Export** — downloads a full JSON backup of all company data
- **Reports → Builder → Scheduled Exports** — automated CSV exports via email

### Database Backup (On-Premise)
```bash
# MySQL dump
mysqldump -u root ovds > ovds_backup_$(date +%Y%m%d).sql

# Restore
mysql -u root ovds < ovds_backup_20260429.sql
```

### Prisma Studio (Development)
```bash
npm run db:studio
# Opens at http://localhost:5555
# Browse and edit all database records
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PRISMA_DATABASE_URL` | ✅ | MySQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `AUTH0_NAMESPACE` | ✅ | Auth0 namespace (or localhost for local) |
| `AUTH0_ENFORCED` | ✅ | `true` to require Auth0; `false` for local JWT |
| `MAIL_HOST` | Optional | SMTP host |
| `MAIL_PORT` | Optional | SMTP port (587 or 465) |
| `MAIL_USER` | Optional | SMTP username |
| `MAIL_PASS` | Optional | SMTP password |
| `OPENAI_API_KEY` | Optional | For OCR bank statement / receipt parsing |
| `GEMINI_API_KEY` | Optional | Alternative to OpenAI for OCR |
| `SLACK_WEBHOOK_URL` | Optional | Slack notifications |
| `TELEBIRR_BUSINESS_ID` | Optional | Telebirr merchant ID |
| `TELEBIRR_APP_KEY` | Optional | Telebirr app key |
| `TELEBIRR_PUBLIC_KEY` | Optional | Telebirr public key |
| `TELEBIRR_WEBHOOK_SECRET` | Optional | Telebirr webhook signing secret |
| `CHAPA_SECRET_KEY` | Optional | Chapa payment gateway secret key |
| `CHAPA_PUBLIC_KEY` | Optional | Chapa payment gateway public key |
| `CHAPA_WEBHOOK_SECRET` | Optional | Chapa webhook signing secret |
| `CBE_MERCHANT_ID` | Optional | CBE Pay gateway merchant ID |
| `CBE_API_KEY` | Optional | CBE Pay gateway API key |
| `IOT_API_TOKEN_SECRET` | Optional | Signing secret for IoT device tokens |
| `IOT_HEARTBEAT_INTERVAL_SEC` | Optional | Heartbeat interval (default: 300) |
| `IOT_OFFLINE_THRESHOLD_MIN` | Optional | Minutes before device marked offline (default: 15) |
| `VITE_AUTH0_ENABLED` | Optional | Enable Auth0 in frontend |
| `VITE_AUTH0_DOMAIN` | Optional | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | Optional | Auth0 client ID |
| `VITE_AUTH0_AUDIENCE` | Optional | Auth0 API audience |



