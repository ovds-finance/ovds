<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Getting Started

> **Part of:** [OVDS Documentation](../README.md)

Everything you need to go from zero to a running, configured OVDS instance — whether you are using the cloud platform or self-hosting on your own server.

---

## Guides in This Section

| Guide | Description |
|-------|-------------|
| [Quick Start](./quick-start.md) | Fastest path from sign-up to first invoice — cloud or on-premise. Includes setup checklist and default credentials |
| [Installation Guide](./INSTALL.md) | Full on-premise setup: Node.js, MySQL, environment variables, schema push, dev commands, production deployment, Nginx, PM2, SSL |
| [Dashboard & Widgets Guide](./dashboard-guide.md) | Role-aware dashboard widgets, accounting dashboard, keyboard shortcuts, starred pages, default routes per role |
| [Troubleshooting & FAQ](./troubleshooting.md) | Common errors and fixes: database connection, login issues, VAT computation, payroll, reconciliation, reports, email |
| [System Administration Setup](../03-settings/system-administration-setup.md) | 14-phase setup wizard — deployment, company, financial, modules, users, system controls |

---

## Which Guide Should I Use?

**Use [Quick Start](./quick-start.md) if:**
- You are signing up for the cloud (SaaS) platform at [ovds.com.et](https://ovds.com.et)
- You have already installed OVDS and want a checklist to complete initial configuration
- You want a concise reference for the Setup Wizard steps

**Use [Installation Guide](./INSTALL.md) if:**
- You are setting up OVDS on your own server or laptop
- You need the full environment variable reference
- You are deploying to production with Nginx, PM2, and SSL
- You need the database migration history or Docker setup

---

## The Four-Phase Workflow

OVDS organizes every task into four phases that follow Ethiopia's financial compliance cycle:

```
Phase 1 · Setup
  ├── Register company, TIN, MoR credentials
  ├── Configure tax engine, bank accounts, digital payments
  ├── Register IoT / fiscal devices
  └── Invite team members with appropriate roles

Phase 2 · Daily Operations
  ├── Create and send invoices
  ├── Record bills and vendor payments
  ├── Run payroll
  ├── Sync Telebirr / Chapa / POS transactions
  └── Import bank statements

Phase 3 · Analysis
  ├── Review Balance Sheet, P&L, Cash Flow
  ├── Check AR/AP aging and tax liability estimator
  ├── Review inventory valuation (IAS 2)
  └── Run IFRS 9 ECL provision

Phase 4 · Submit to MoR
  ├── File VAT/TOT/WHT on eTax portal
  ├── Submit pension and PIT remittances
  ├── File quarterly BIT installments and DRRF
  ├── Lock the accounting period
  └── Generate audited financial statements
```

---

## Setup Wizard

Press **W** on any page after logging in, or navigate to `/getting-started`.

The wizard guides you through all Phase 1 steps in order:

| Step | Action |
|------|--------|
| 1 | Paste your API Key from [ovds.com.et/login](https://ovds.com.et/login) |
| 2 | Enter company name, logo, TIN, and address |
| 3 | Fill in MoR credentials — Business Category, MoR Region, AABE Tier |
| 4 | Set fiscal year start (Hamle 1 / July 7 for Ethiopian calendar) |
| 5 | Confirm base currency (ETB) |
| 6 | Verify default tax rates — VAT 15%, WHT 2%, BIT 30%, TOT 2%/10%, Pension 7%/11% |
| 7 | Add bank accounts |
| 8 | Enter Telebirr Business ID and/or Chapa API keys |
| 9 | Register IoT / POS devices (if applicable) |
| 10 | Invite team members with their roles |

---

## What to Configure Next

After completing the Setup Wizard, continue with:

| Task | Where to go |
|------|-------------|
| Configure SMTP for email delivery | [Settings → Email & Notifications](../03-settings/notifications-and-api.md) |
| Set up invoice template and numbering | [Settings → Company & Tax](../03-settings/company-and-tax.md#invoice-customization) |
| Import customers, vendors, and items | [Financial Ops → Data Import/Export](../04-financial-ops/data-import-export.md) |
| Set opening balances | [Financial Ops → Data Import/Export → Opening Balances](../04-financial-ops/data-import-export.md#setting-opening-balances) |
| Add employees for payroll | [Advanced → HR & Payroll](../08-advanced/hr-and-payroll.md) |
| Understand user roles | [Users & Roles → RBAC Matrix](../02-users-roles/rbac-matrix.md) |
| Review full system administration checklist | [Settings → System Administration Setup](../03-settings/system-administration-setup.md) |




