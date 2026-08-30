<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Monetization, Plans & Subscriptions

> **Part of:** [Advanced Modules](./README.md)
>
> **Requires:** ADMIN or SPURADMIN role
>
> **Navigate to:** **Plans** (`/plans`) · **Administration → Companies**

OVDS includes a built-in monetization layer for multi-tenant deployments — subscription plans, feature entitlements, trial periods, and pay-to-unlock controls. This is relevant if you are running OVDS as a SaaS platform for multiple client companies, or if your instance is managed by an OVDS reseller.

---

## System Capabilities — Full Lifecycle

OVDS is architected to handle the complete online VAT Return lifecycle at scale:

### User Scaling & Company Data Collection
- Supports a very large number of accounting users across multiple companies
- Each user is scoped to their company via `companyId` — enforced by `CompanyGuard`
- 22 RBAC roles across 6 groups (SPURADMIN → EXTERNAL_AUDITOR) with 150+ permissions
- Bulk user import via the Import Center; individual user provisioning with email invitations

### Subscription-Based Module CRUD
- All modules are registered online and controlled by subscription plans (Free → Starter → Professional → Enterprise)
- Module CRUD operations are gated by feature entitlements — admins can enable/disable modules per company
- Pay-to-unlock controls for MoR-required fiscal integrations (SRM, e-Tax bridge)
- Trial periods with automated expiry warnings and entitlement rebuilds

### Cloud Usage & Download After Payment
- **Cloud (SaaS):** Multi-tenant hosted at `ovds.com.et` — use directly from the browser
- **On-Premise:** Download the installer, deploy on your own server or laptop — fully air-gapped capable
- Both tiers share one codebase, one build graph, and one canonical data model
- On-Premise includes offline-first local SQLite with AES-256-GCM encryption and bidirectional sync

### VAT & Tax Operations → MoR Automated Submission
- Full Digital Automated Filing Lifecycle: Data Capture → Tax Calculation → Analysis → V&V → e-Tax Submission → Payment → Compliance Scoring
- Automated VAT/WHT/DRRF/BIT/PIT/Pension calculations from canonical ledger events
- Pre-submission V&V checks (output VAT reconciliation, TIN validation, ERCA QR verification)
- Direct e-Tax API submission (Cloud) or signed export file (On-Premise/air-gapped)
- Payment gateway integration (Telebirr, Chapa, CBE Pay, commercial banks)
- Compliance scoring with automated alerts and period-lock enforcement

---

## Plans & Subscriptions

Navigate to `/plans` — visible based on entitlement configuration.

### Plan Types

Plans define which features a company can access. Each plan has a set of **entitlements** — specific features or modules that are enabled.

| Plan Tier | Typical Entitlements |
|-----------|---------------------|
| Free / Trial | Core invoice, basic reports, 1 bank account |
| Starter | + Bills, expenses, bank reconciliation, payroll |
| Professional | + IoT module, multi-currency, IFRS dashboard, custom reports |
| Enterprise | + Multi-company, API access, white-label, SRM/fiscal device integration |

### Subscription Lifecycle

```
TRIAL ──► ACTIVE ──► EXPIRED
   │                    │
   └──► CANCELLED ◄─────┘
```

- **Trial** — time-limited access to a defined feature set; expires after the configured trial period
- **Active** — paid subscription with full access to purchased entitlements
- **Expired** — subscription ended; access reverted to free tier or locked
- **Cancelled** — manually cancelled before expiry

### Trial Period

When a new company is created:
1. A trial period is automatically started (duration configured per plan).
2. The company gets access to the trial entitlement set.
3. **3 days before expiry**, an automated warning notification is sent to the ADMIN user.
4. **1 day before expiry**, a final warning is sent.
5. On expiry, the subscription transitions to EXPIRED and entitlements are rebuilt automatically.

---

## Feature Entitlements

Entitlements control access to specific modules and features. They are rebuilt automatically when a subscription changes (activation, expiry, cancellation).

### How Entitlements Work

1. A company subscribes to a plan.
2. The plan's entitlement set is applied to the company.
3. Every page load checks the entitlement cache — gated features show a **Payment Required** screen (`/payment-required`) if not entitled.
4. The `MandatoryReleaseGuard` in the backend also enforces entitlements at the API level.

### Checking Entitlements

Admins can see the active entitlement set for their company in:
- **Administration → Company Settings → Plan & Billing**
- The **Plans** page (`/plans`) shows what is included in the current plan and what requires an upgrade

---

## Pay-to-Unlock (SRM / Feature Flags)

Some features — particularly MoR-required fiscal integrations — are locked behind a payment gate that can only be unlocked by the platform operator.

### SRM Lockout

**SRM (Sales Register Machine)** integration is required by ERCA for fiscal printers and POS terminals. If SRM features are locked:

1. Navigate to **Plans** → click **Unlock SRM Features**.
2. Complete the payment or contact your OVDS reseller.
3. The platform operator unlocks SRM access for your company.
4. IoT → Device Registry and Smart Billing features become available.

> See [Advanced → IoT & POS Devices](./iot-and-pos.md) for SRM device registration once unlocked.

### Release / Feature Flag Management

Navigate to **Administration → Releases** (`/releases`) — ADMIN only.

Feature flags control gradual rollout of new features to specific companies:

| Flag State | Access |
|------------|--------|
| ENABLED | Feature is fully accessible |
| DISABLED | Feature is hidden from the UI and blocked at the API |
| BETA | Available only to companies explicitly opted into beta |

The `MandatoryReleaseGuard` checks the flag state on every request to a flagged route. If disabled, the request returns `402 Payment Required` or `403 Forbidden` depending on the flag type.

---

## Multi-Company Administration

Navigate to **Administration → Multi-Company** (`/multi-company-admin`) — SPURADMIN only.

For platform operators managing multiple tenant companies:

1. **View all companies** — list of all tenants with plan, status, and usage
2. **Switch company context** — act on behalf of any company for support purposes
3. **Manage subscriptions** — manually activate, extend, or cancel subscriptions
4. **Assign plans** — change a company's plan tier
5. **Unlock features** — grant specific entitlements outside the standard plan

### Company Status States

| Status | Meaning |
|--------|---------|
| ACTIVE | Company is live with a valid subscription |
| TRIAL | Company is in their trial period |
| EXPIRED | Subscription expired — limited access |
| SUSPENDED | Manually suspended by the platform operator |
| CANCELLED | Company account closed |

---

## Production Environment Variables

| Variable | Description |
|----------|-------------|
| `MONETIZATION_ENABLED` | Set to `true` to enable the monetization layer (default: `false`) |
| `DEFAULT_TRIAL_DAYS` | Number of days for new company trials (default: 14) |
| `DEFAULT_PLAN_ID` | Plan ID assigned to new companies automatically |

> If `MONETIZATION_ENABLED=false`, all companies have full access to all features — no entitlement checks are performed. This is the recommended setting for single-tenant self-hosted deployments.

---

## Monetization Cron Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| Expire subscriptions | Every hour | Transitions ACTIVE past `currentPeriodEnd` → EXPIRED; rebuilds entitlement cache |
| Expire trials | Every hour | Transitions ACTIVE trials past `endsAt` → EXPIRED; rebuilds entitlement cache |
| Purge expired entitlements | Daily 03:00 EAT | Deletes expired entitlement cache rows to keep the cache clean |
| Trial expiry warnings | Daily 09:00 EAT | Sends warning notifications 1–3 days before trial ends |

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| IoT device setup (requires SRM unlock) | [IoT & POS Devices](./iot-and-pos.md) |
| User roles and company assignment | [Users & Roles → RBAC Matrix](../02-users-roles/rbac-matrix.md) |
| Multi-company invoice | [Multi-Company Management](../02-users-roles/multi-company.md) |
| Production environment variables | [Getting Started → Installation Guide](../01-getting-started/INSTALL.md) |





