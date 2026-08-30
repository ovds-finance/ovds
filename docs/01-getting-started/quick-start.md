<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Quick Start Guide

> **Part of:** [Getting Started](./INSTALL.md)
>
> This guide covers the fastest path from a fresh install to your first invoice — whether you are using the cloud (SaaS) or running on-premise.

---

## Cloud (SaaS) — 8 Steps to First Invoice

If you are using the hosted OVDS platform at [ovds.com.et](https://ovds.com.et), follow this path. No server setup required.

### Step 1 — Create Your Account

1. Go to [ovds.com.et](https://ovds.com.et) → click **Get Started**.
2. Enter your name, email, and password.
3. Accept the Terms and Conditions → click **Create New Account**.
4. Confirm your email via the link sent to your inbox.

### Step 2 — Run the Setup Wizard

Press **W** on any page, or go to `/getting-started`.

The wizard walks through:
1. **API Key** — paste from [ovds.com.et/login](https://ovds.com.et/login)
2. **Company profile** — legal name, logo, TIN, address
3. **MoR credentials** — Business Category (A/B/C), MoR Region, AABE Tier
4. **Fiscal year** — set to Ethiopian: Hamle 1 (July 7) start
5. **Base currency** — ETB
6. **Default tax rates** — VAT 15%, WHT 2%, BIT 30%, TOT 2%/10%, Pension 7%/11%
7. **Banking** — add your CBE or other bank account
8. **Digital payments** — Telebirr Business ID and/or Chapa API keys (optional)

### Step 3 — Seed Chart of Accounts

Go to **Accounting → Chart of Accounts → Seed Ethiopian Defaults**.

This creates ~40 standard GL accounts aligned with IFRS and Ethiopian accounting practice. Required before recording any transactions.

### Step 4 — Add Your First Customer

Go to **Sales → Customers → New Customer**. Enter the customer's name and payment currency — these are the only required fields to get started.

### Step 5 — Add Your First Item

Go to **Items → New Item**. Enter a name, unit price, and VAT rate (15%, 0%, or Exempt).

### Step 6 — Create and Send Your First Invoice

1. Go to **Sales → Invoices → New Invoice**.
2. Select the customer.
3. Add an item.
4. Click **Save** → then **Send To** to email it.

The ERCA NBE-IQR QR code is generated automatically on the invoice PDF.

### Step 7 — Invite Your Team

Go to **Administration → Users → New User**. Assign each team member the appropriate role:
- **ovds** for your chief accountant
- **ACCOUNTING** for bookkeepers
- **HR** for HR managers
- **EMPLOYEE** for staff self-service

### Step 8 — Configure Remaining Settings (As Needed)

| Need | Where to go |
|------|------------|
| Upload company logo | Settings → Company Profile |
| Set invoice template & numbering | Settings → invoice tab |
| Configure SMTP for email delivery | Admin → Notification Settings |
| Add more bank accounts | Setup → Currencies & Banking |
| Register IoT / POS devices | App Store → IoT Module → IoT → Device Registry |
| Add employees for payroll | HR → Employees |
| Set up departments and shifts | HR → Departments / Shifts |

---

## On-Premise — Minimum Setup Sequence

For self-hosted installations after completing the [Installation Guide](./INSTALL.md):

```
1. Start MySQL                         xampp → start MySQL
2. Clone + npm install                 git clone ... && npm install
3. Copy and configure .env             cp .env.example .env
4. Push schema                         npm run db:push
5. Seed defaults                       npm run seed
6. Start application                   npm run dev:all
7. Open browser                        http://localhost:5173
8. Log in as SPURADMIN                 superadmin@ovds.com / SuperAdmin@2026!
9. Run Setup Wizard                    Press W → complete all steps
10. Change all default passwords       Administration → Users
```

---

## Setup Checklist

Use this before going to production or handing over to end users.

### Company & Tax
- [ ] Company legal name, TIN, and address entered in Settings → Company Profile
- [ ] Business Category (A/B/C) set — determines VAT vs TOT
- [ ] MoR Region and AABE Tier configured
- [ ] Ethiopian tax rates seeded (VAT, WHT, BIT, TOT, Pension, PIT)
- [ ] Chart of Accounts seeded with Ethiopian defaults
- [ ] Fiscal year start set to Hamle 1 (July 7)

### Banking & Payments
- [ ] At least one bank account added
- [ ] Telebirr credentials entered (if using mobile money)
- [ ] Chapa keys entered (if taking online payments)

### Users & Access
- [ ] All team members invited with correct roles
- [ ] Default passwords changed
- [ ] MFA enabled for ovds and Admin roles (via Auth0 if SSO is configured)

### HR (if using payroll)
- [ ] Departments created
- [ ] Shifts created
- [ ] Employees added with Base Salary > 0
- [ ] Pension numbers entered for each employee

### invoice
- [ ] Invoice template and numbering configured
- [ ] SMTP configured for invoice email delivery
- [ ] At least one customer added
- [ ] Items / services catalog populated

### Production Only
- [ ] `NODE_ENV=production` set in environment
- [ ] `JWT_SECRET` is a strong, unique value (min 48 random bytes)
- [ ] CORS_ORIGIN points to your frontend domain
- [ ] MySQL daily backups active
- [ ] Nginx reverse proxy with TLS (HTTPS) active
- [ ] Health check monitoring on `GET /api/health/ready`

---

## Default Login Credentials (Development / Demo Only)

> Run `npm run seed` to create all users. **Change all passwords immediately in production.**

| Role | Email | Password |
|------|-------|----------|
| SPURADMIN | `superadmin@ovds.com` | `SuperAdmin@2026!` |
| ADMIN | `admin@ovds.com` | `changeme123` |
| ovds | `ovds@ovds.com` | `fin_pass_2026` |
| ACCOUNTING | `selam@ovds.com` | `acct_pass_2026` |
| HR | `hr@ovds.com` | `hr_pass_2026` |
| AUDITOR | `bereket@ovds.com` | `audit_pass_2026` |
| EMPLOYEE | `employee@ovds.com` | `emp_pass_2026` |

---

## Where to Go Next

| I want to… | Go to |
|-----------|-------|
| Create my first invoice | [Creating an Invoice](../04-financial-ops/creating-an-invoice.md) |
| Set up my company profile and taxes | [Settings Guide](../03-settings/company-and-tax.md) |
| Review full system administration checklist | [System Administration Setup](../03-settings/system-administration-setup.md) |
| Understand user roles and permissions | [RBAC Matrix](../02-users-roles/rbac-matrix.md) |
| Configure Telebirr or Chapa | [Settings → Banking Setup](../03-settings/banking-and-payments.md) |
| Run payroll | [HR & Payroll](../08-advanced/hr-and-payroll.md) |
| File VAT | [VAT & TOT](../06-tax-compliance/vat-and-tot.md) |
| Generate a Balance Sheet | [Financial Reports](../07-reports/financial-reports.md) |
| Set up IoT / POS devices | [IoT & POS](../08-advanced/iot-and-pos.md) |




