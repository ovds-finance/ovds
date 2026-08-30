<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](../CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [../FILING-LIFECYCLE.md](../FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](../subscription%20and%20monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](../UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Installation & Setup Guide

OVDS ovds runs as a full-stack Node.js application: NestJS 11 backend + React 19 + Vite 6 frontend + Prisma 7 + MySQL/MariaDB. Choose Cloud (hosted) or On-Premise (self-hosted).

---

## System Overview

**OVDS ovds** (Online VAT Return System) is a production-ready, multi-tenant ERP platform built specifically for Ethiopian businesses. It covers HR, payroll, accounting, IFRS compliance, tax filing (VAT/TOT/BIT/DRRF), invoice, CRM, IoT device integration, and full MoR submission in a single system.

| Component | Technology |
|-----------|-----------|
| Backend | NestJS 11 (TypeScript) |
| Frontend | React 19 + Vite 6 + Tailwind CSS 3.4 |
| ORM | Prisma 7 with `@prisma/adapter-mariadb` |
| Database | MySQL 8.0+ or MariaDB 10.6+ |
| Auth | JWT (local) + Auth0 (optional SSO) |
| Real-time | Socket.io (`/realtime` namespace) |

---

## Cloud vs On-Premise

| Feature | Cloud (SaaS) | On-Premise |
| --- | --- | --- |
| Hosting | Managed at ovds.com.et | Your own server |
| Data ownership | Hosted by OVDS | 100% yours |
| Updates | Automatic | Manual (git pull + migrate) |
| Setup effort | Sign up and go | Requires server setup |
| Internet required | Yes | No — LAN deployable |
| Customization | Settings only | Full code-level |
| Data residency | Cloud-hosted | Fully local |
| Ideal for | SMEs wanting quick start | Enterprises, banks, government |

---

## Cloud Setup

Visit the in-app guide at `/getting-started` or follow these steps:

### 1. Create Your Account
1. Go to [ovds.com.et](https://ovds.com.et) and click **Get Started**
2. Enter your **Name**, **Email**, and **Password**
3. Check the **Terms and Conditions** box and click **Create New Account**
4. Confirm your email address via the link sent to your inbox

### 2. Get Your API Key
1. Log in at [ovds.com.et/login](https://ovds.com.et/login)
2. Your **API Key** is displayed at the top of the Account Dashboard
3. Click to copy — you'll need it in the Company Setup Wizard

> **Keep your API key private.** Never commit it to source control.

### 3. Create Your Company
Press **W** on any page, or go to **Administration → Companies → Add Company**:
- Paste your **API Key** when prompted
- Company name (legal name — as on MoR registration)
- TIN — 15-digit Tax Identification Number
- Business type (determines IFRS tier: Tier 1/2/3)
- Fiscal year start — Month 7 (July / Hamle) for Ethiopian fiscal year

### 4. Fill in TIN & MoR Credentials
Go to **Setup → Company Settings → TIN & MoR Credentials** (`/settings/company-profile`):
- Registered company name, TIN, Branch Code
- Business Category (A/B/C), MoR Region, AABE Tier
- eTax portal username (optional — used for portal pre-fill)

### 5. Seed Chart of Accounts
Go to **Accounting → Chart of Accounts → Seed Ethiopian Defaults** to create ~40 standard accounts aligned with IFRS and Ethiopian accounting practice.

### 6. Configure Banking & Digital Payments
- Add bank accounts: **Setup → Currencies & Banking → Bank Accounts Setup**
- Add Telebirr: **Settings → Digital Wallets** (`/settings/digital-wallets`)
- Add Chapa: **Settings → Payment Gateways → Chapa** (`/settings/payment-gateways/chapa`)

### 7. Register IoT Devices (if applicable)
Go to **App Store** → install **IoT Module** → register each MoR-approved fiscal device under **IoT → Device Registry** (`/iot/devices`).

### 8. Send Your First Invoice
**Sales → Invoices → New Invoice** — ERCA QR code is generated automatically.

---

## On-Premise Setup

Visit the in-app guide at `/getting-started/on-premise` for the full interactive guide.

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Use `nvm` or `fnm` for version management |
| MySQL / MariaDB | 8.0+ / 10.6+ | Via XAMPP, Docker, or native install |
| npm | 9+ | Bundled with Node.js |
| Git | Any | For cloning the repository |
| Docker | Optional | For containerized production deployment |

**Hardware minimum:** 2 CPU cores, 2 GB RAM (4 GB recommended), 10 GB disk space.

### Step 1 — Start MySQL

**Windows / XAMPP:**
```cmd
C:\xampp\mysql_start.bat
```

**Linux:**
```bash
sudo service mysql start
```

**Create the database:**
```sql
mysql -u root -e "CREATE DATABASE ovds CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Step 2 — Clone and Install

```bash
git clone https://github.com/ovds-platform/ovds.git
cd ovds

npm install
```

**Docker alternative (production-ready):**
```bash
docker-compose up -d
# Services: db (MySQL 3306) + api (NestJS + frontend on port 3000)
```

### Step 3 — Configure Environment

```bash
cp .env.example .env
```

Minimum required in `.env`:
```env
PRISMA_DATABASE_URL="mysql://root:@127.0.0.1:3306/ovds"
JWT_SECRET="your-strong-secret-key-min-32-chars"
AUTH0_NAMESPACE="http://localhost:3000"
AUTH0_ENFORCED=false
```

> **Security:** Change `JWT_SECRET` to a strong random value (min 32 chars) before going to production. Never use the default.

Optional — for email (silently skipped if not set):
```env
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass
```

Optional — for OCR (bank statement PDF parsing):
```env
OPENAI_API_KEY=sk-...
# or
GEMINI_API_KEY=...
```

Optional — for Auth0 SSO:
```env
# frontend/.env
VITE_AUTH0_ENABLED=true
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id
VITE_AUTH0_AUDIENCE=https://your-api-audience
```

### Step 4 — Push Schema and Seed

```bash
# Apply Prisma schema to database (includes all migrations)
npm run db:push

# Seed demo data and default users
npm run seed
```

**Migrations applied by `db:push` (as of July 2026):**

| Migration | What it adds |
|-----------|-------------|
| `20260519000001_add_tot_filing` | `totfiling` table for Category B TOT |
| `20260529000001_add_monetization_tables` | 5 monetization tables (products, subscriptions, purchases, trials, entitlements) |
| `20260614000001_add_missing_invoice_tax_columns` | Invoice tax column additions |
| `20260701000001_add_iot_tables` | IoT device registry + billing trigger tables |
| `20260702000001_add_iot_fiscal_event` | Immutable `iot_fiscal_event` table (SHA-256 signed fiscal signature) |
| `20260703000001_add_client_node` | `client_node` table for hybrid SRM deployment |
| `20260704000001_add_trial_restriction_config` | `restrictionConfig` column on `monetization_trial` |
| `20260704000002_add_data_clerk_role` | `DATA_CLERK` added to `Role` enum on `user` table |
| `20260704000003_add_hr_reimbursement_workflows` | `workflowType`, `candidateName`, `recoveryClause`, `advanceLinkId` on `ReimbursementClaim` |

### Step 5 — Start the Application

```bash
npm run dev:all
```

**URLs after startup:**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| Swagger Docs | http://localhost:3000/api/docs |
| Prisma Studio | `npm run db:studio` → http://localhost:5555 |

---

## Default Login Credentials

> Run `npm run seed` to create all users. **SPURADMIN** bypasses all RBAC route policies.

| Role | Email | Password |
|------|-------|----------|
| **SPURADMIN** | `superadmin@ovds.com` | `SuperAdmin@2026!` |
| ADMIN | `admin@ovds.com` | `changeme123` |
| HR | `hr@ovds.com` | `hr_pass_2026` |
| ovds | `ovds@ovds.com` | `fin_pass_2026` |
| ACCOUNTING | `selam@ovds.com` | `acct_pass_2026` |
| AUDITOR | `bereket@ovds.com` | `audit_pass_2026` |
| EMPLOYEE | `employee@ovds.com` | `emp_pass_2026` |
| CRM | `crm@ovds.com` | `crm_pass_2026` |
| IFRS_OFFICER | `ifrs@ovds.com` | `ifrs_pass_2026` |
| BANK_LIAISON | `banking@ovds.com` | `bank_pass_2026` |
| EXTERNAL_AUDITOR | `extaudit@ovds.com` | `extaudit_pass_2026` |

> **Change all passwords immediately after first login in production.**

---

## Common Dev Commands

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start backend (watch) + frontend (Vite) concurrently |
| `npm run dev -w @ovds/backend` | Backend only — NestJS watch mode |
| `npm run dev -w ovds-frontend` | Frontend only — Vite dev server → localhost:5173 |
| `npm run build` | Compile NestJS backend → `apps/backend/dist/` |
| `npm run build:frontend` | Build frontend for production → `apps/public/` |
| `npm run build:all` | Build libs + backend + frontend |
| `npm run db:push` | Apply Prisma schema changes to database |
| `npm run db:generate` | Regenerate Prisma client after schema change |
| `npm run db:studio` | Open Prisma Studio GUI → localhost:5555 |
| `npm run seed` | Seed demo data and default users |
| `npm run seed:demo` | Seed extended demo data |
| `npm run test:backend` | Run backend unit tests (backend unit tests) |
| `npm run test:frontend` | Run frontend tests (frontend tests) |
| `npm run test:e2e` | Run end-to-end tests |

---

## Port Reference

| Port | Service | Fix if Conflict |
|------|---------|----------------|
| 5173–5176 | Vite dev server | Kill stale node processes |
| 3000 | NestJS API | `npx kill-port 3000` |
| 3306 | MySQL / MariaDB | Start XAMPP MySQL service |
| 5555 | Prisma Studio | `npx kill-port 5555` |

---

## Company Configuration

After installation, complete the company setup:

1. Log in as ADMIN or SPURADMIN
2. Press **W** to open the Company Setup Wizard
3. Paste your **API Key** from [ovds.com.et/login](https://ovds.com.et/login) when prompted
4. Fill in: company name, TIN, Branch Code, business type, fiscal year start
5. Go to **Settings → TIN & MoR Credentials** and complete all MoR registration fields
6. Seed tax rates: **Settings → Taxes → Seed Ethiopian Defaults**
7. Seed chart of accounts: **Accounting → Chart of Accounts → Seed Ethiopian Defaults**
8. Add bank accounts: **Setup → Currencies & Banking → Bank Accounts Setup**
9. Set up Telebirr: **Settings → Digital Wallets** (if using mobile money)
10. Set up Chapa: **Settings → Payment Gateways → Chapa** (if taking online payments)
11. Register IoT devices: **App Store → IoT Module** → **IoT → Device Registry**
12. Add departments: **HR → Departments**
13. Add shifts: **HR → Shifts**
14. Add employees: **HR → Employees** (or bulk CSV import via Import Center)
15. Configure payroll: set `baseSalary > 0` for each employee
16. Configure SMTP: **Admin → Notification Settings**

---

## First-Time Setup Wizard

The Company Setup Wizard (press **W** on any page, or go to `/getting-started`) guides you through:
1. **API Key** — paste from [ovds.com.et/login](https://ovds.com.et/login)
2. **Company profile** — name, logo, TIN, Branch Code, address
3. **MoR credentials** — Business Category, MoR Region, AABE Tier, eTax username
4. **Fiscal year settings** — Ethiopian: Hamle 1 (July 7) start, Ethiopian Calendar enabled
5. **Base currency** — ETB (default)
6. **Default tax rates** — VAT 15%, WHT 2%, BIT 30%, TOT 2%/10%, Pension 7%/11%
7. **Banking setup** — add CBE or other bank accounts
8. **Digital payments** — Telebirr Business ID, Chapa API keys
9. **IoT devices** — register MoR-approved fiscal printers and POS terminals
10. **Initial user invitations** — invite team members with appropriate roles

---

## Production Deployment (On-Premise)

### Build for Production
```bash
# Build frontend (outputs to apps/public/)
npm run build:frontend

# Build backend (outputs to apps/backend/dist/)
npm run build

# Start production server
node apps/backend/dist/main.js
# or with PM2:
pm2 start ecosystem.config.js --env production
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Process Manager
```bash
npm install -g pm2
pm2 start dist/main.js --name ovds-api
pm2 startup
pm2 save
```

### SSL with Let's Encrypt
```bash
sudo certbot --nginx -d your-domain.com
```

---

## VS Code Recommended Extensions

- **Prisma** — syntax highlighting for `.prisma` files
- **ESLint** — linting
- **Prettier** — formatting (`.prettierrc` in root)
- **REST Client** — test API endpoints from `.http` files
- **Thunder Client** — lightweight Postman alternative

---

## Production Readiness Checklist

Before going live, verify the following. Full details in [REVIEW.md → Production Readiness](../REVIEW.md).

### Infrastructure
- [ ] Run `npx prisma migrate deploy` on production DB
- [ ] All required env vars set (see Section 9 of REVIEW.md)
- [ ] SMTP configured for email delivery
- [ ] `NODE_ENV=production` set
- [ ] `CORS_ORIGIN` points to your frontend domain
- [ ] MySQL daily backups + point-in-time recovery enabled
- [ ] Reverse proxy (nginx/caddy) with TLS termination active
- [ ] Health check monitoring on `GET /api/health/ready`

### Security
- [ ] `JWT_SECRET` is at least 48 random bytes — never reuse dev secret
- [ ] Rate limiting active (100 req/min via ThrottlerGuard)
- [ ] Auth0 enforced in production (`AUTH0_ENFORCED=true`) or JWT-only confirmed

### ERCA / Tax Compliance
- [ ] `COMPANY_TIN` set in env or via Settings → Company
- [ ] Ethiopian tax rates seeded via `POST /ovds/tax-rates/seed-et`
- [ ] Chart of Accounts seeded via `POST /ovds/accounts/seed`
- [ ] VAT registration status confirmed (Category A or B)
- [ ] eTax portal account active at [etax.erca.gov.et](https://etax.erca.gov.et)

### Functional Verification
- [ ] Invoice create → send → payment → GL posting verified
- [ ] Bill create → pay with WHT → GL posting verified
- [ ] Payroll generate → approve → GL posting (IAS 19) verified
- [ ] VAT auto-compute cron fires on 1st of month (check logs)
- [ ] Period close trial balance check passes





