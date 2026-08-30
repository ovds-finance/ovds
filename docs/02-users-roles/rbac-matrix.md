<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Users, Roles & Permissions

> **Part of:** [Users & Roles](./README.md)
>
> **Requires:** Login · `users:read` · `role_permissions:read`
>
> **Navigate to:** **Administration → Users** (`/users`) · **Administration → Role Permissions** (`/role-permissions`)

OVDS uses a deny-by-default Role-Based Access Control (RBAC) system. Every action is gated — users see and can do only what their assigned role explicitly permits. There are 22 roles across 6 groups covering 150+ permissions.

---

## User Management

### Adding a User

1. Go to **Administration → Users** (`/users`) — requires `users:read`.
2. Click **New User** — requires `users:write`.
3. Fill in:
   - **Username** and **Email**
   - **Role** — select from the 22 available roles
   - **Company** — assign to one or more companies
4. Click **Save** — the user receives an email invitation with a one-time setup link (requires SMTP configured in Settings).

### Editing a User

1. Click the user's name in the Users table.
2. Update the role or company assignment.
3. Click **Save** — changes take effect immediately on the user's next request.

### Deactivating a User

1. Open the user → click **Deactivate**.
2. All active sessions for that user are revoked immediately.
3. The user cannot log in again until reactivated.
4. All actions taken by the user remain in the Audit Trail.

### Multi-Company Assignment

- Users can be assigned to one or more companies.
- The `CompanyGuard` enforces strict data isolation — a user assigned to Company A cannot access Company B's data.
- Switch between companies using the company selector in the header (if assigned to multiple).

---

## Roles Reference

### 22 roles Across 6 Groups

| Group | Role | Weight | Default Route | Primary Access |
|-------|------|:------:|---------------|----------------|
| **System** | `SPURADMIN` | 200 | `/dashboard` | Full system — bypasses all RBAC policies. Global Super Admin across all tenants |
| **System** | `DEVELOPER` | 150 | `/dashboard` | Full API access + system config; read-only audit |
| **Operations** | `ADMIN` | 100 | `/dashboard` | Tenant Admin — full org settings, branch management, user provisioning |
| **Operations** | `PROJECT_MANAGER` | 80 | `/dashboard` | Projects + read access to HR and ovds |
| **HR** | `HR` | 50 | `/dashboard` | Full HRIS, attendance, leave, payroll generation |
| **HR** | `EMPLOYEE` | 10 | `/dashboard` | Self-service only — leaves, payslips, expenses via My Workspace |
| **ovds** | `ovds` | 60 | `/accounting-dashboard` | Chief Accountant — full ovds, VAT, bank reconciliations, approve tax returns, close books |
| **ovds** | `ACCOUNTING` | 55 | `/accounting-dashboard` | Bookkeeper — invoices, bills, bank reconciliation, VAT calculation |
| **ovds** | `AUDITOR` | 30 | `/audit-logs` | Read-only access to all domains; can annotate audit logs |
| **IFRS & Banking** | `IFRS_OFFICER` | 52 | `/ifrs` | AABE-aligned IFRS compliance — IFRS 9, 10, 12, 16 |
| **IFRS & Banking** | `BANK_LIAISON` | 25 | `/business-loans` | Banking operations — loans, KYC/AML, collateral |
| **IFRS & Banking** | `EXTERNAL_AUDITOR` | 28 | `/audit-outsourcing` | Statutory audit — read-only ovds; write audit findings |
| **External** | `CRM` | 25 | `/crm` | Customer management, invoice read/create |
| **External** | `CLIENT` | 5 | `/client-portal` | Client portal only — view own invoices and pay |
| **External** | `PARTNER` | 20 | `/purchases/orders` | Vendor portal — view bills and purchase orders |
| **Operational** | `DATA_CLERK` | 8 | `/items` | Data entry — items/inventory input and draft invoices only |

### Role Hierarchy

Higher weight = broader access. `rbac.isAtLeast(role, target)` checks if a role's weight ≥ the target's weight. `SPURADMIN` (200) is always at the top.

---

## DATA_CLERK — Special Notes

The `DATA_CLERK` role maps to the Data Clerk / Secretary persona — data entry staff who input stock and draft invoices but must not access financial records.

**Permitted:**
- Input raw item data (`items:read`, `items:write`)
- Log inventory movements (`inventory:read`, `inventory:write`)
- Draft invoices — `invoices:write` with a contextual rule blocking any status transition away from `DRAFT`
- Read customer records for invoice drafts (`crm:contacts:read`)
- View notifications

**Not permitted:**
- Sending, posting, or approving invoices
- Accessing ledgers, GL entries, or financial reports
- Reviewing or filing tax returns
- Bank reconciliation, payroll, or any admin/HR operations

> The contextual rule is enforced in `packages/shared/src/rbac.ts`. Even with `invoices:write`, the engine blocks any status transition away from `DRAFT`.

---

## Role Capabilities Quick Reference

| Role | Create Invoices | Approve Bills | File VAT | Run Payroll | View Audit Logs |
|------|:--------------:|:-------------:|:--------:|:-----------:|:---------------:|
| SPURADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| ovds | ✅ | ✅ approve | ✅ | ✅ approve | ✅ |
| ACCOUNTING | ✅ | ✅ create | ✅ calculate | ✅ generate | ✅ |
| HR | ❌ | ❌ | ❌ | ✅ generate | ❌ |
| AUDITOR | ❌ | ❌ | ❌ | ❌ | ✅ |
| IFRS_OFFICER | ❌ | ❌ | ❌ | ❌ | ✅ |
| PROJECT_MANAGER | ❌ | ❌ | ❌ | ❌ | ❌ |
| CRM | ✅ create | ❌ | ❌ | ❌ | ❌ |
| EMPLOYEE | ❌ | ❌ | ❌ | ❌ | ❌ |
| DATA_CLERK | ✅ draft only | ❌ | ❌ | ❌ | ❌ |
| CLIENT | ❌ | ❌ | ❌ | ❌ | ❌ |
| PARTNER | ❌ | ❌ view | ❌ | ❌ | ❌ |
| EXTERNAL_AUDITOR | ❌ | ❌ | ❌ | ❌ | ✅ read |

---

## Permissions Reference

### ovds Permissions
| Permission | Description |
|-----------|-------------|
| `ovds:read` | View financial records and dashboards |
| `ovds:write` | Create and edit journal entries |
| `ovds:approve` | Approve payments, bill settlements, write-offs |
| `invoices:read/write/delete` | AR invoice management |
| `bills:read/write/delete` | AP bill management |
| `expenses:read/write/approve` | Expense claim workflow |
| `purchase_orders:read/write/approve` | PO workflow |
| `bank_reconciliation:read/write` | Bank reconciliation |
| `period_close:read/write` | Accounting period lock/unlock |
| `fund_transfers:read/write` | Transfers between accounts |

### Tax Permissions
| Permission | Description |
|-----------|-------------|
| `vat:read` | View VAT reports and calculations |
| `vat:write` | Record VAT transactions |
| `vat:calculate` | Compute monthly VAT totals |
| `vat:file` | Submit VAT returns and generate payment vouchers |
| `vat:withholding` | Manage WHT deductions and certificates |
| `bit:read/write/file` | Business Income Tax management |
| `disaster_fund:read/write` | DRRF levy management |

### HR Permissions
| Permission | Description |
|-----------|-------------|
| `employees:read/write/delete` | Employee record management |
| `departments:read/write` | Department management |
| `attendance:read/verify` | Attendance records |
| `leaves:read/write/approve/delete` | Leave workflow |
| `shifts:read/write/delete` | Shift scheduling |
| `payroll:read` | View payroll records |
| `payroll:generate` | Compute payroll (HR) |
| `payroll:verify` | Verify computed payroll |
| `payroll:finalize` | Lock payroll period |
| `payroll:approve` | Approve for disbursement (ovds) |
| `payroll:export` | Export payslips and reports |
| `payroll:admin` | Full payroll administration |

### Reports Permissions
| Permission | Description |
|-----------|-------------|
| `reports:read` | Standard operational reports |
| `reports:financial:read` | Financial statements access |
| `reports:financial:full` | Full financial reports including ratios, health score, IFRS 9 |
| `reports:bs:read` | Balance Sheet |
| `reports:pl:read` | Profit & Loss |
| `reports:gl:read` | General Ledger and Trial Balance |
| `reports:cf:read` | Cash Flow Statement |
| `reports:custom:read` | Custom Report Builder |

### System Permissions
| Permission | Description |
|-----------|-------------|
| `users:read/write` | User management |
| `role_permissions:read` | View role permissions matrix |
| `audit_logs:read` | View audit trail |
| `companies:write` | Multi-company management |
| `api_docs:read` | API documentation and IoT device management |

---

## Invitation Flow

1. Admin creates a user account with the assigned role.
2. OVDS sends an invitation email with a one-time setup link (valid 72 hours).
3. User clicks the link → sets their password and completes profile.
4. User is redirected to their role's **Default Route** automatically.

---

## Auth0 / SSO Setup

Auth0 integration is optional and disabled by default (`AUTH0_ENFORCED=false`).

### Enabling Auth0

Add the following to your environment files:

```env
# apps/frontend/.env
VITE_AUTH0_ENABLED=true
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://your-api-audience

# .env (backend root)
AUTH0_NAMESPACE=https://your-api-audience
AUTH0_ENFORCED=true
```

### How It Works

1. User clicks **Login with Auth0** on the login page.
2. Auth0 authenticates the user — supports Google, Microsoft, SAML, and custom identity providers.
3. OVDS exchanges the Auth0 token for a local JWT via `POST /api/auth/auth0/session`.
4. The local JWT is used for all subsequent API calls.

### MFA Step-Up Routes

Sensitive routes require MFA re-authentication for Auth0 users before access is granted:

| Route | Reason |
|-------|--------|
| `/users`, `/role-permissions` | User and permission management |
| `/settings`, `/audit-logs` | System configuration and audit |
| `/payroll-administration` | Sensitive payroll data |
| `/vat-administration`, `/tax-filing` | Tax filing operations |
| `/admin/notifications-settings` | System notification config |
| `/multi-company-admin` | Multi-tenant management |

---

## Audit Logs

Every CRUD operation is logged automatically and cannot be retroactively edited.

Navigate to **Administration → Audit Logs** (`/audit-logs`) — requires `audit_logs:read`.

### What Gets Logged

- All create, update, and delete operations
- Login and logout events
- Permission denial events (403 responses)
- Data exports
- Payroll approvals and VAT filings
- Period locks and unlocks

### Audit Log Fields

| Field | Description |
|-------|-------------|
| `timestamp` | UTC timestamp of the action |
| `userId` | User who performed the action |
| `action` | CREATE, UPDATE, DELETE, LOGIN, EXPORT, DENIED |
| `resource` | Module affected (e.g. Invoice, Employee, Bill) |
| `resourceId` | ID of the affected record |
| `companyId` | Company context (for multi-company environments) |
| `ipAddress` | Client IP address |
| `changes` | JSON diff showing before and after values |

### Filtering Logs

Filter by: user, action type, module, date range, or company. Export to CSV for compliance reporting or external audit evidence.

---

## Role Permissions Page

Navigate to **Administration → Role Permissions** (`/role-permissions`) — requires `role_permissions:read`.

Provides a full visual matrix of all roles and permissions:
- See which roles hold which permissions at a glance
- Identify permission gaps before onboarding a new team member
- Only `ADMIN` and `SPURADMIN` can modify role definitions

---

## Related Topics

| Topic | Where to go |
|-------|-------------|
| Invite and manage users | [Users & Roles README](./README.md) |
| Expense claim RBAC | [Financial Ops → Expense Claims](../04-financial-ops/expense-claims.md#rbac-requirements) |
| HR recruitment RBAC | [Financial Ops → Expense Claims](../04-financial-ops/expense-claims.md#rbac-requirements-1) |
| External audit access | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#audit-outsourcing) |
| Period lock permissions | [Tax & Compliance → IFRS & Audit](../06-tax-compliance/ifrs-and-audit.md#compliance-sign-off-period-lock) |




