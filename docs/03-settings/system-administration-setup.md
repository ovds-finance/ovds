<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->

# System Administration Setup

> **Part of:** [Settings](../README.md)
>
> **Requires:** Login · `settings:read` · `settings:write`
>
> **Navigate to:** **Administration → System Administration Setup** (`/settings/setup-wizard`)

The System Administration Setup Wizard guides administrators through 14 sequential phases to configure an OVDS instance from legal entity registration to production go-live. Each phase maps to one or more backend setup steps defined in `SettingsSetupService` (`apps/backend/src/settings/settings-setup.service.ts`).

Progress is persisted in the `system_setting` key-value store as `company_setup_progress_<companyId>` and exposes:
- **Scope summary** — which configuration scopes (company, financial, modules, users, system, deployment) are complete
- **Module activities** — audit log of module activation actions
- **Step dependencies** — some steps enforce sequencing (e.g., TIN credentials before module selection)

---

## Step 1: Establish Core Company Data

Define the fundamental identities and localization settings for the system instance.

- **Identity Configuration** — legal name, registration numbers, and logo.
- **Localization Mapping** — timezone, language, physical address.
- **System Isolation** — data partitioned strictly by `companyId` via `CompanyGuard` + `TenantModule`.

> Backend steps: `setup_wizard`, `admin_setup_wizard`

---

## Step 2: Configure Financial Parameters

Lock down the accounting engine rules before activating operational modules.

- **Currency Settings** — base currency (ETB), exchange rate providers (NBE, open.er), revaluation rules.
- **Fiscal Boundaries** — fiscal year start month, period lock rules, EFY / Gregorian mapping.
- **Tax Engine** — VAT, TOT, BIT, WHT, DRRF, and pension rule seeds.
- **Chart of Accounts** — assets, liabilities, equity, revenue, expenses following IFRS / AABE tier.

> Backend steps: `currency_exchange`, `fiscal_year`, `universal_tax_config`

---

## Step 3: Define Scope and Project Parameters

Establish project structural boundaries mirroring OVDS-style project management extensions.

- **Scope Baselines** — operational boundaries and deliverables per project.
- **Milestone Rules** — automated progress tracking markers.
- **Billing Triggers** — milestone-to-invoice generation mapping.

> Backend step: `project_management`

---

## Step 4: Deploy Progress Tracking Tools

Operational tools to measure time, budget, and resources.

- **Time Tracking** — timesheets linked to payroll and invoice.
- **Gantt Pipelines** — real-time visual project dependency maps.
- **Budget Analytics** — baseline-to-actual comparison via the ovds Workflow Engine.

> Backend step: `project_management`

---

## Step 5: Map Module Permissions (RBAC)

Strict separation of duties across administration, ovds, and operations.

- **Role Definition** — Admin, Accountant, Project Manager, Employee, plus 12 extended roles (`packages/shared/src/rbac.ts`).
- **Feature Flags** — toggle module visibility per role via the permission matrix.
- **Audit Logging** — configuration changes, data exports, and updates recorded through `AuditLogService`.

> Backend steps: `roles_permissions`, `users`, `onboarding`

---

## Step 6: Configure Deployment Environment

Establish the runtime topology before any application-level configuration.

- **Setup Wizard** — launch the guided wizard to configure core company data, financial parameters, and system modules.
- **Deployment Mode** — choose **Cloud** (hosted, managed updates, backups) or **On-Premise** (self-hosted, offline sync via `@ovds/`, edge node resilience).
- **Enterprise Client** — hybrid cloud sync, offline-first architecture, multi-entity IFRS reporting.

> Backend steps: `setup_wizard`, `cloud_deployment`, `on_premise_deployment`, `enterprise_client`

---

## Step 7: Register Tax and Legal Credentials

Bind the system to Ethiopian statutory authorities before any transactions are recorded.

- **TIN & MoR Credentials** — 15-digit TIN, branch code, MoR portal access, e-Tax credentials, ERCA registration details.
- **Business Registration** — structure type (PLC, Share Company, OPC, LLP, General Partnership, Limited Partnership, Sole Proprietor), trade license upload, government ID harmonization (NID, TIN, VAT).
- **SME Profile** — classification (micro / small / medium), sector mapping, turnover thresholds, MoR compliance profile.
- **Multi-Company & Group** — subsidiaries, consolidation hierarchy, ownership percentages, intercompany elimination rules.

> Backend steps: `tin_mor_credentials`, `business_registration`, `sme_profile`, `multi_company`

---

## Step 8: Activate Payment and Financial Modules

Enable revenue and expense pathways before invoice generation.

- **Payment Gateways** — Chapa, ArifPay, Stripe, settlement accounts, webhook URLs, reconciliation rules.
- **Chapa Integration** — API keys, callback endpoints, Ethiopian bank settlement accounts.
- **Digital Wallets** — Telebirr, CBE Birr, mobile money wallets, SMS notifications, settlement rules.

> Backend steps: `payment_gateways`, `chapa_gateway`, `digital_wallets`

---

## Step 9: Finalize Tax Configuration

Lock the universal tax engine with VAT, TOT, BIT, WHT, and pension rules.

- **Universal Tax Config** — GL account mappings, sector-based filing calendars, RBAC policies.
- **Currency & Exchange** — base currency activation, foreign currency supports, exchange rate provider selection.
- **Fiscal Year** — EFY (Hamle 1 ≈ July 7) or GC (January 1), accounting periods, period lock rules.

> Backend steps: `universal_tax_config`, `currency_exchange`, `fiscal_year`

---

## Step 10: Enable Functional Modules

Toggle application modules from the App Store to match business scope.

- **Module Selection** — invoice, Accounting, Projects, Inventory, CRM, HR, IoT, Reports, and marketplace integrations.
- **Project Management** — project tracking, milestones, tasks, timesheets, budget controls, resource allocation.
- **IoT & Devices** — POS terminals, barcode scanners, weight scales, offline sync streams, device control policies, TASS compliance.

> Backend steps: `module_selection`, `project_management`, `iot_devices`

---

## Step 11: Provision Users and Roles

Create the administrative identity layer and enforce access boundaries.

- **Users & Access** — admin user creation, MFA, authentication providers (Auth0, local, OAuth2).
- **Roles & Permissions** — RBAC roles, permission matrices, data isolation policies, branch-level access controls.
- **Onboarding** — welcome flow, default dashboards, training checklist, email invitations, guided tours.

> Backend steps: `users`, `roles_permissions`, `onboarding`

---

## Step 12: Configure System Administration Controls

Define runtime governance, API exposure, and update policies.

- **Settings Catalog** — schema, categories, groups, validation rules, modular KV storage (`setting_category` / `setting_group` / `setting` tables).
- **Unified Control Node** — local system settings, TIN status monitoring, license validation, IoT device streams.
- **API Documentation** — Swagger / OpenAPI specs, webhook endpoints, rate limits.
- **Developer Guide** — SDK references, webhook documentation, quickstart guides, sandbox environments.
- **System Updates** — auto-update preferences, changelog notifications, version pinning, rollback policies, scheduled maintenance windows.

> Backend steps: `settings_catalog`, `control_node`, `api_docs`, `developer_guide`, `system_updates`

---

## Step 13: Finalize Notification Channels

Deploy digital communication pathways for automated stakeholder alerts.

- **Notification Settings** — SMTP, SMS (Ethio Telecom), in-app alerts, automated reminders, escalation rules.
- **Email & SMTP** — outbound email for invoices, payslips, system notifications.
- **Security Notifications** — brute-force, injection, privilege escalation, MFA, JWT, rate-limiting alerts via the Security Evaluator.

> Backend step: `notifications`

---

## Step 14: Validate Setup and Enable Production

Complete the governance lifecycle with scope summary verification and module activity logging.

- **Scope Summary** — review completed steps across scopes (company, financial, modules, users, system, compliance, deployment).
- **Module Activities** — audit log review (`initiated_setup_wizard`, `configured_system_administration`, `provisioned_cloud_deployment`, etc.).
- **Completion Check** — verify all required steps are completed before enabling production transactions.

> Backend: `getCompletionSummary()` + `buildModuleActivities()`

---

## Setup Wizard Reference

| Step | Key | Category | Required | Route |
|------|-----|----------|:--------:|-------|
| Setup Wizard | `setup_wizard` | deployment | Yes | `/getting-started` |
| Admin Setup Wizard | `admin_setup_wizard` | deployment | Yes | `/settings/setup-wizard` |
| Cloud Deployment | `cloud_deployment` | deployment | No | `/getting-started/cloud` |
| On-Premise Deployment | `on_premise_deployment` | deployment | No | `/getting-started/on-premise` |
| Enterprise Client | `enterprise_client` | deployment | No | `/getting-started/client` |
| TIN & MoR Credentials | `tin_mor_credentials` | company | Yes | `/settings/company-profile` |
| Business Registration | `business_registration` | company | Yes | `/business-registration` |
| SME Profile | `sme_profile` | company | No | `/smes` |
| Multi-Company & Group | `multi_company` | company | No | `/settings/multi-company` |
| Payment Gateways | `payment_gateways` | financial | No | `/ovds/payment-gateways` |
| Chapa Gateway | `chapa_gateway` | financial | No | `/settings/payment-gateways/chapa` |
| Digital Wallets | `digital_wallets` | financial | No | `/settings/digital-wallets` |
| Universal Tax Config | `universal_tax_config` | tax | Yes | `/tax/universal-config` |
| Currency & Exchange | `currency_exchange` | financial | Yes | `/settings/currencies` |
| Fiscal Year | `fiscal_year` | financial | Yes | `/accounting/period-close` |
| App Store & Modules | `module_selection` | modules | Yes | `/settings/app-store` |
| Project Management | `project_management` | modules | No | `/ovds/projects` |
| IoT & Devices | `iot_devices` | modules | No | `/control/iot` |
| Users & Access | `users` | users | Yes | `/settings/users` |
| Roles & Permissions | `roles_permissions` | users | Yes | `/settings/roles` |
| Onboarding | `onboarding` | users | No | `/settings/onboarding` |
| Settings Catalog | `settings_catalog` | system | No | `/settings/catalog` |
| Unified Control Node | `control_node` | system | No | `/control` |
| API Documentation | `api_docs` | system | No | `/settings/api-docs` |
| Developer Guide | `developer_guide` | system | No | `/settings/developers` |
| System Updates | `system_updates` | system | No | `/settings/releases` |
| Notification Settings | `notifications` | system | No | `/admin/notifications-settings` |

---

## Related Topics

> **Lifecycle context:** The 14-step setup wizard completes [Phase 1 — Data Capture preparation](./../FILING-LIFECYCLE.md#2-phase-1--data-capture) of the Digital Automated Filing Lifecycle. All terminology (TIN, ERCA, e-Tax, MAT, etc.) is standardized in [`CORE-CONFIG.md`](./../CORE-CONFIG.md#1-terminology-registry).

| Topic | Where to go |
|-------|-------------|
| Company profile & TIN configuration | [Company Profile & Tax Configuration](./company-and-tax.md) |
| Banking and payment gateway setup | [Banking & Payments Settings](./banking-and-payments.md) |
| SMTP and notification channels | [Notifications & API Settings](./notifications-and-api.md) |
| Security posture monitoring | [Security Guide](../08-advanced/security-guide.md) |
| Module architecture | [Modular Architecture](../09-developers/modular-architecture.md) |



