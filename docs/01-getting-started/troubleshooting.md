<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Troubleshooting & FAQ

> **Part of:** [Getting Started](./README.md)
>
> Common issues, error messages, and their solutions across all areas of OVDS.

---

## Installation & Startup

### "Cannot connect to database" on startup

**Symptom:** Backend fails to start with `PrismaClientInitializationError` or `ECONNREFUSED`.

**Causes and fixes:**

| Cause | Fix |
|-------|-----|
| MySQL not running | Start MySQL: `C:\xampp\mysql_start.bat` (Windows) or `sudo service mysql start` (Linux) |
| Wrong database URL | Check `PRISMA_DATABASE_URL` in `.env` — must match your MySQL host, port, user, password, and database name |
| Database doesn't exist | Run `mysql -u root -e "CREATE DATABASE ovds CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"` |
| Wrong port | MySQL default is `3306` — verify with `netstat -an \| find "3306"` |

---

### "Port already in use" when starting

**Fix:** Kill the process occupying the port:
```bash
npx kill-port 3000    # Backend
npx kill-port 5173    # Frontend
npx kill-port 5555    # Prisma Studio
```
Or restart your machine to clear all stale Node processes.

---

### Schema out of date / `P1001` error after `npm install`

**Fix:**
```bash
npm run db:push       # Apply schema changes to database
npm run db:generate   # Regenerate Prisma client
```

---

### Frontend shows blank page after login

**Causes:**

| Cause | Fix |
|-------|-----|
| `VITE_API_URL` not set | Add `VITE_API_URL=/api` to `apps/frontend/.env` |
| Backend not running | Start backend: `npm run dev -w @ovds/backend` |
| CORS error | Set `CORS_ORIGIN=http://localhost:5173` in backend `.env` |

---

## Authentication

### "Invalid credentials" on login with seed users

**Fix:** Run the seed command — the default users only exist after seeding:
```bash
npm run seed
```
Then log in with `superadmin@ovds.com` / `SuperAdmin@2026!`.

> Change all default passwords immediately in any environment with real data.

---

### "Your session has expired" appearing too frequently

**Fix:** Increase the JWT expiry in your `.env`:
```env
JWT_EXPIRES_IN=168h   # 7 days — adjust to your policy
```
Restart the backend for the change to take effect.

---

### Auth0 login redirects back to login page

**Causes and fixes:**

| Cause | Fix |
|-------|-----|
| `VITE_AUTH0_ENABLED` not set to `true` | Set in `apps/frontend/.env` |
| Auth0 callback URL not registered | Add `http://localhost:5173/auth0-callback` to Auth0 Allowed Callback URLs |
| `AUTH0_NAMESPACE` mismatch | Must match exactly between frontend `VITE_AUTH0_AUDIENCE` and backend `AUTH0_NAMESPACE` |

---

## invoice

### Invoice PDF has no ERCA QR code

**Cause:** Company TIN not configured.

**Fix:** Go to **Settings → Company Profile** and enter the 15-digit TIN. The QR code is generated from the TIN — without it, the NBE-IQR code cannot be produced.

---

### "Customer TIN required" error when saving invoice

**Cause:** The company is configured for B2B VAT invoice, which requires a customer TIN.

**Fix:** Either:
- Add the customer's TIN to their profile in **Sales → Customers → Edit**, or
- For non-VAT customers, mark the invoice as **Exempt** or **0%** VAT rate on the line items

---

### Recurring invoice not generating automatically

**Cause:** The cron job runs daily at 06:00 EAT. If it hasn't run yet, or if the scheduled date hasn't been reached, the invoice won't appear.

**Checks:**
1. Verify the recurring invoice is **Active** (not paused) — go to the invoice → check the recurring schedule settings
2. Check the **start date** — invoices only generate on or after this date
3. Check the **Audit Trail** for `RECURRING_INVOICE_GENERATED` events — if absent, the cron may not be running

**Manual trigger (developer):**
```bash
# Trigger manually via API
POST /api/ovds/invoices/generate-recurring
Authorization: Bearer <admin_token>
```

---

### Payment recorded but invoice still shows "Sent"

**Cause:** The payment amount was entered as 0, or the payment was saved against the wrong invoice.

**Fix:**
1. Open the invoice → check the **Payment History** tab
2. If no payment appears, delete and re-record the payment with the correct amount
3. If payment shows but status hasn't updated, click **Refresh** — status updates in real time via WebSocket

---

## VAT & Tax

### VAT computation shows ETB 0 for a month with transactions

**Causes and fixes:**

| Cause | Fix |
|-------|-----|
| Invoices not marked as Paid | Only **paid** invoices contribute to Output VAT — check invoice statuses |
| Bills not marked as Paid | Only **paid** bills contribute to Input VAT — check bill statuses |
| Tax rate not assigned | Check that line items on invoices have a VAT rate (15%, 0%, or Exempt) assigned |
| Wrong period selected | Verify the computation period matches the invoice and bill dates |

---

### "Zero declaration required" warning appearing unexpectedly

**Cause:** OVDS detected no paid invoices or bills for the period and flagged the mandatory zero filing.

**Fix:** If you do have transactions, verify they are in **Paid** status and the dates fall within the selected VAT period. If the period genuinely had no transactions, file the zero return — it is legally required.

---

### WHT not being calculated on a vendor bill

**Causes and fixes:**

| Cause | Fix |
|-------|-----|
| Vendor has no TIN | Add the vendor's TIN in **Purchases → Vendors → Edit** |
| Bill amount below threshold | Services WHT threshold is ETB 500; Goods is ETB 10,000 |
| Vendor marked as WHT Exempt | Check **Vendor Profile → WHT Exempt** toggle |
| Wrong bill category | Ensure the bill category maps to a service or goods type — not a capital item |

---

## Payroll

### PIT calculated incorrectly

**Cause:** Most common causes are stale PIT brackets (pre-2025) or incorrect base salary entry.

**Fix:**
1. Verify PIT brackets are up to date: **Settings → Taxes → PIT Brackets** should show Proclamation 1395/2025 rates (0% up to ETB 2,000; 35% above ETB 14,000)
2. Re-seed if brackets are outdated: `POST /ovds/tax-rates/seed-et`
3. Verify the employee's **Base Salary** is correctly entered — `0` means payroll won't compute for that employee

---

### Payroll generate button not available

**Cause:** The payroll period may already have a generated run, or required employee data is missing.

**Checks:**
1. Go to **HR → Payroll** — check if a payroll run already exists for the selected month
2. Ensure at least one employee has `baseSalary > 0`
3. Verify the user has `payroll:generate` permission (HR role required)

---

### Employee not appearing in payroll

**Cause:** The employee's `baseSalary` is `0` or their employment nature is set to a type excluded from auto-payroll.

**Fix:** Go to **HR → Employees → [Employee] → Edit** → set `Base Salary` to the correct ETB amount and ensure `Employment Nature` is `PERMANENT`, `CONTRACT`, or `PART_TIME`.

---

## Banking & Reconciliation

### Bank statement import fails with column mapping error

**Fix:** Download the CSV template from **Banking → Import Statement → Download Template** and compare your bank's export format. The required columns are: Date, Description, Debit (or Amount), Credit, Balance. Map them in the column mapping step before importing.

---

### OCR (PDF statement) extraction is inaccurate

**Causes and fixes:**

| Cause | Fix |
|-------|-----|
| `OPENAI_API_KEY` not set | Add to `.env` and restart the backend |
| Low-quality scan | Use a 300 DPI or higher scan — blurry images extract poorly |
| Non-standard PDF format | Try exporting as CSV from the bank portal instead |

---

### Reconciliation difference not reaching ETB 0.00

**Common causes:**

| Issue | Fix |
|-------|-----|
| Outstanding cheque | Mark as **Excluded (in-transit)** — it clears when the cheque is cashed |
| Bank charge not in OVDS | Click **Create** in the reconciliation screen to add the missing transaction |
| Timing difference | Check if the transaction was recorded in a different period |
| Decimal rounding | Look for small differences (ETB 0.01–0.10) — may be a rounding issue on a foreign currency payment |

---

## Reports

### Balance Sheet doesn't balance (Assets ≠ Liabilities + Equity)

**Cause:** A journal entry was posted with unequal debits and credits (data integrity issue), or opening balances were entered incorrectly.

**Fix:**
1. Run **Reports → Trial Balance** — look for accounts with unexpected balances
2. Go to **Accounting → General Ledger** — filter by the period and look for entries where `debit ≠ credit`
3. Fix the entry via a manual correcting journal entry
4. Contact your accountant if the imbalance cannot be traced

---

### P&L shows revenue in the wrong period

**Cause:** Invoice date or payment date falls outside the selected report period.

**Fix:** OVDS reports on **invoice date** (accrual basis) by default. Check that the invoice date — not the payment date — falls within your selected period. To switch to cash basis, select **Cash Basis** in the report options.

---

## Environment & Production

### Emails not being sent

**Checks:**
1. SMTP configured: **Admin → Notification Settings → Email** — click **Test Connection**
2. `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM_ADDRESS` all set in `.env`
3. Check spam/junk folder for test email
4. Check the Audit Trail for `EMAIL_SEND_FAILED` events

---

### "Service Unavailable" (503) error page

**Cause:** The backend is either starting up, in maintenance mode, or the database is unreachable.

**Checks:**
1. Check `GET /api/health/detailed` — shows uptime, memory, and database status
2. If `MAINTENANCE_MODE=true` in `.env`, the 503 page is intentional — change to `false` and restart
3. Verify the database is running and `PRISMA_DATABASE_URL` is correct

---

### IoT device showing "offline" in the device registry

**Fix:**
1. Check the device's network connectivity — it must be able to reach `https://your-domain.com/api/iot/events`
2. Verify the device's API token hasn't expired — regenerate if needed in **IoT → Device Registry → [Device] → Regenerate Token**
3. Check **IoT → Alerts** for the last heartbeat timestamp
4. For fiscal printers, verify the MoR approval number matches what is registered in TASS

---

## Getting Further Help

| Channel | Details |
|---------|---------|
| In-app helpdesk | **Helpdesk → New Ticket** — for billing, HR, and operational issues |
| Developer API docs | `http://localhost:3000/api/docs` (Swagger) — for API-level debugging |
| MoR / ERCA support | [etax.erca.gov.et](https://etax.erca.gov.et) · +251 11 662 98 00 |
| Audit logs | **Administration → Audit Logs** — every system action is logged |
| Health check | `GET /api/health/detailed` — live database and server status |

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Full installation guide | [Installation Guide](./INSTALL.md) |
| Setup checklist | [Quick Start → Setup Checklist](./quick-start.md#setup-checklist) |
| Production environment variables | [REVIEW.md → Section 9](../REVIEW.md) |
| Security issues | [Advanced → Security Guide](../08-advanced/security-guide.md) |




