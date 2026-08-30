<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Users & Roles

> **Part of:** [OVDS Documentation](../README.md) › Users & Roles

OVDS uses a deny-by-default Role-Based Access Control (RBAC) system with 22 roles across 6 groups, covering 150+ permissions. Every action is gated — users see and can do only what their role explicitly allows.

---

## Standalone Guides

| Guide | Description |
|-------|-------------|
| [RBAC Matrix & Permissions Reference](./rbac-matrix.md) | All 22 roles, weight hierarchy, capabilities table, full permissions list, Auth0 SSO setup, audit logs |
| [Multi-Company Management](./multi-company.md) | Creating companies, switching context, data isolation, per-company config, user assignment, IFRS 10 consolidation |

---

---

## 1. User Management

### Adding a User
1. Go to **Administration → Users** (`/users`) — requires `users:read`
2. Click **New User** — requires `users:write`
3. Fill in: username, email, role, and assign to a company
4. The user receives an email invitation (if SMTP is configured)

### Editing & Deactivating
- Edit a user's role or company assignment from the Users table
- Deactivating a user revokes all active sessions immediately
- All actions are logged in the Audit Trail

### Bulk Operations
- Use **Import Center** (`/import-center`) to bulk-create employees (HR module)
- Admin users are created individually — no bulk import for security reasons

---

## 2. Roles Reference

### 22 roles Across 6 Groups

| Group | Role | Weight | Default Route | Primary Access |
|-------|------|--------|---------------|----------------|
| **System** | `SPURADMIN` | 200 | `/dashboard` | Full system — bypasses all RBAC policies. Global Super Admin: oversees all tenants, subscriptions, platform config |
| **System** | `DEVELOPER` | 150 | `/dashboard` | Full API + system, read-only audit |
| **Operations** | `ADMIN` | 100 | `/dashboard` | Tenant Admin: full org settings, branch management, user provisioning |
| **Operations** | `PROJECT_MANAGER` | 80 | `/dashboard` | Projects + read HR/ovds |
| **HR** | `HR` | 50 | `/dashboard` | Full HRIS, payroll generate |
| **HR** | `EMPLOYEE` | 10 | `/dashboard` | Self-service: leaves, payslips, expenses |
| **ovds** | `ovds` | 60 | `/accounting-dashboard` | Chief Accountant: full ovds, VAT, bank reconciliations, approve tax returns, close books |
| **ovds** | `ACCOUNTING` | 55 | `/accounting-dashboard` | Accountant: bookkeeping, bank reconciliation, VAT calculate |
| **ovds** | `AUDITOR` | 30 | `/audit-logs` | Read-only all domains + annotate audit logs |
| **IFRS & Banking** | `IFRS_OFFICER` | 52 | `/ifrs` | AFIS-aligned IFRS compliance (IFRS 9, 10, 12, 16) |
| **IFRS & Banking** | `BANK_LIAISON` | 25 | `/business-loans` | Banking ops: loans, KYC/AML, collateral |
| **IFRS & Banking** | `EXTERNAL_AUDITOR` | 28 | `/audit-outsourcing` | Statutory audit — read ovds, write findings |
| **External** | `CRM` | 25 | `/crm` | Customer management, invoice read |
| **External** | `CLIENT` | 5 | `/client-portal` | Client portal, invoice read |
| **External** | `PARTNER` | 20 | `/purchases/orders` | Vendor portal, bills, purchase orders |
| **Operational** | `DATA_CLERK` | 8 | `/items` | Data Clerk / Secretary — input raw item/inventory data, draft sales entries only. Cannot approve, access ledgers, or file taxes |

### Role Hierarchy
Higher weight = broader access. `rbac.isAtLeast(role, target)` checks if a role's weight is ≥ the target's weight. `SPURADMIN` (200) is always at the top.

### DATA_CLERK Role (added July 2026)

Maps to the "Data Clerk / Secretary" persona — typically used for data entry staff who need to input stock and draft invoices but must not access financial records.

**Permitted actions:**
- Input raw item data (`items:read`, `items:write`)
- Log inventory movements (`inventory:read`, `inventory:write`)
- Draft sales entries — `invoices:write` with a contextual rule that blocks posting if `status !== 'draft'`
- Read customer records for invoice drafts (`crm:contacts:read`)
- View notifications (`notifications:read`)

**Not permitted:**
- Sending, posting, or approving invoices
- Accessing ledgers, financial reports, or GL entries
- Reviewing or filing tax returns
- Bank reconciliation, payroll, or any admin/HR operations

> The contextual rule is enforced in `packages/shared/src/rbac.ts` — even with `invoices:write`, the engine blocks any status transition away from `DRAFT`.

---

## 3. RBAC Permissions Matrix

### Key Permission Groups

**HR Permissions**
- `employees:read/write/delete` — employee records
- `departments:read/write` — department management
- `attendance:read/verify` — attendance records
- `leaves:read/write/approve/delete` — leave workflow
- `shifts:read/write/delete` — shift scheduling
- `holidays:read/write/delete` — holiday calendar
- `enrollment:write` — biometric enrollment

**HR Reimbursement Workflows**

HR departments process two main types of reimbursement workflows. Clear, transparent agreements must be established upfront to manage fees, refunds, and applicant reimbursements efficiently.

_Workflow A — Corporate Agency invoice_ applies when hiring is outsourced to a staffing or placement agency. The agency fee is processed as a vendor bill (AP workflow), not an employee expense claim.

| Action | Permission | Role |
|--------|-----------|------|
| Create agency placement bill | `bills:write` | ACCOUNTING / ovds |
| Approve and pay agency bill (net of WHT) | `bills:write` + `ovds:approve` | ovds |
| Issue debit note (guarantee refund) | `bills:write` | ACCOUNTING / ovds |
| View agency billing history | `bills:read` | HR / ovds / ACCOUNTING |

_Workflow B — Worker / Candidate Cost Recovery_ applies when the company advances costs on behalf of candidates (travel, relocation, medicals). Recovery is tracked as a staff advance or receivable.

| Action | Permission | Role |
|--------|-----------|------|
| Record interview reimbursement to candidate | `expenses:write` | HR |
| Create staff advance for candidate cost | `expenses:write` | HR / ovds |
| Approve advance | `expenses:approve` | ovds |
| Set up payroll deduction for recovery | `payroll:admin` | HR |
| Reclassify advance to receivable (no-join) | `ovds:write` | ovds |
| Write off irrecoverable advance | `ovds:write` + `ovds:approve` | ovds |

**Payroll Permissions**
- `payroll:read` — view payroll records
- `payroll:generate` — compute payroll (HR role)
- `payroll:verify` — verify computed payroll
- `payroll:finalize` — lock payroll period
- `payroll:approve` — approve for disbursement (ovds role)
- `payroll:export` — export payslips and reports
- `payroll:admin` — full payroll administration

**ovds Permissions**
- `ovds:read/write/approve/delete` — general ovds
- `invoices:read/write/delete` — AR invoices
- `bills:read/write/delete` — AP bills
- `expenses:read/write/approve` — expense claims
- `purchase_orders:read/write/approve` — PO workflow
- `bank_reconciliation:read/write` — bank reconciliation
- `period_close:read/write` — accounting period close

**Tax Permissions**
- `vat:read/write/file/calculate` — VAT operations
- `vat:withholding` — WHT management
- `bit:read/write/file` — Business Income Tax
- `disaster_fund:read/write/delete` — DRRF levy

**Reports Permissions**
- `reports:read` — standard reports
- `reports:financial:full` — full financial statements
- `reports:bs:read` — Balance Sheet
- `reports:pl:read` — Profit & Loss
- `reports:gl:read` — General Ledger
- `reports:cf:read` — Cash Flow

---

## 4. Invite Your Team

### Invitation Flow
1. **Admin** creates user account with assigned role
2. System sends invitation email with a one-time setup link
3. User sets their password and completes profile
4. User is redirected to their role's default route

### Multi-Company Assignment
- Users can be assigned to one or more companies
- `CompanyGuard` enforces strict data isolation between companies
- Switching companies via the company selector in the header

---

## 5. Auth0 / SSO Setup

Auth0 integration is optional and disabled by default (`AUTH0_ENFORCED=false`).

### Enable Auth0
```env
# frontend/.env
VITE_AUTH0_ENABLED=true
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://your-api-audience

# .env (backend)
AUTH0_NAMESPACE=https://your-api-audience
AUTH0_ENFORCED=true
```

### How It Works
1. User clicks **Login with Auth0** on the login page
2. Auth0 authenticates the user (supports Google, Microsoft, SAML, etc.)
3. OVDS exchanges the Auth0 token for a local JWT via `POST /api/auth/auth0/session`
4. The local JWT is used for all subsequent API calls

### MFA Step-Up Routes
Sensitive routes require MFA re-authentication for Auth0 users:
- `/users`, `/role-permissions`, `/settings`, `/audit-logs`
- `/payroll-administration`, `/vat-administration`, `/tax-filing`
- `/admin/notifications-settings`, `/multi-company-admin`

---

## 6. Audit Logs

Every CRUD operation is logged and cannot be retroactively edited.

### Viewing Audit Logs
- Go to **Administration → Audit Logs** (`/audit-logs`) — requires `audit_logs:read`
- Filter by: user, action type, module, date range, company
- Export to CSV for compliance reporting

### What Gets Logged
- All create, update, delete operations
- Login and logout events
- Permission denials (403 responses)
- Data exports
- Payroll approvals and VAT filings

### Audit Log Fields
| Field | Description |
|-------|-------------|
| `timestamp` | UTC timestamp of the action |
| `userId` | User who performed the action |
| `action` | CREATE, UPDATE, DELETE, LOGIN, EXPORT, DENIED |
| `resource` | Module affected (e.g., `Invoice`, `Employee`) |
| `resourceId` | ID of the affected record |
| `companyId` | Company context |
| `ipAddress` | Client IP address |
| `changes` | JSON diff of before/after values |

---

## 7. Role Permissions Page

The **Role Permissions** page (`/role-permissions`) provides a visual matrix of all roles and permissions.

- View which roles have which permissions
- See the full permission coverage per role
- Requires `role_permissions:read` (ADMIN/SPURADMIN only to modify)

---

## Navigation Flow

```
Administration
├── Users              /users              (users:read)
├── Role Permissions   /role-permissions   (role_permissions:read)
├── Audit Logs         /audit-logs         (audit_logs:read)
├── Multi-Company      /multi-company-admin (companies:write)
└── Helpdesk           /helpdesk           (helpdesk:read)
      Manage support tickets; view and respond to employee/customer requests
```

---

## Role Quick Reference

| Role | Can create invoices? | Can approve bills? | Can file VAT? | Can run payroll? | Can view audit logs? |
|------|---------------------|-------------------|--------------|-----------------|---------------------|
| SPURADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| ovds | ✅ | ✅ | ✅ | ✅ approve | ✅ |
| ACCOUNTING | ✅ | ✅ create | ✅ calculate | ✅ generate | ✅ |
| HR | ❌ | ❌ | ❌ | ✅ generate | ❌ |
| AUDITOR | ❌ | ❌ | ❌ | ❌ | ✅ |
| IFRS_OFFICER | ❌ | ❌ | ❌ | ❌ | ✅ |
| CRM | ✅ create | ❌ | ❌ | ❌ | ❌ |
| EMPLOYEE | ❌ | ❌ | ❌ | ❌ | ❌ |
| DATA_CLERK | ✅ draft only | ❌ | ❌ | ❌ | ❌ |
| CLIENT | ❌ | ❌ | ❌ | ❌ | ❌ |
| PARTNER | ❌ | ❌ view | ❌ | ❌ | ❌ |




