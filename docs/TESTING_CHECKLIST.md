<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](./CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [./FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](./subscription and monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](./UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# Testing Checklist - Post Bug Fixes

## ✅ Critical Path Testing

### 1. Search Functionality (High Priority - MariaDB Compatibility)

#### Invoice Search
- [ ] Search invoices by invoice number
- [ ] Search invoices by customer name
- [ ] Search invoices by TIN
- [ ] Search invoices by telecom receipt reference
- [ ] Verify results are case-insensitive (collation-based)

#### Vendor/Customer Search
- [ ] Search vendors by name
- [ ] Search customers by name/email
- [ ] Search estimates by invoice number/customer

#### Bank Reconciliation
- [ ] Search transactions by description
- [ ] Search transactions by reference
- [ ] Search transactions by counterparty

#### Payroll GL Account Lookup
- [ ] Verify "Salaries" expense account found
- [ ] Verify "Salary" payable account found
- [ ] Verify "Pension" payable account found
- [ ] Verify "Tax" payable account found
- [ ] Verify "Deduction" payable account found

#### Tax Calculations
- [ ] Entertainment expense aggregation (contains "entertainment")
- [ ] Donation expense aggregation (contains "donation")
- [ ] Verify BIT deductions calculate correctly

---

### 2. oRPC Contract Usage (Type Safety)

#### Frontend oRPC Client
```typescript
// Test these imports work:
import { orpc } from './lib/orpc';
import { ovdsContract } from '@ovds/contracts/router';

// Test these calls work:
const invoices = await orpc.ovds.invoices.list({ page: 1 });
const customers = await orpc.ovds.customers.list({ companyId });
const items = await orpc.inventory.items.list({ page: 1 });
```

- [ ] Import `ovdsContract` from `@ovds/contracts/router`
- [ ] Call `orpc.ovds.invoices.list()` - no TypeScript errors
- [ ] Call `orpc.ovds.customers.list()` - no TypeScript errors
- [ ] Call `orpc.inventory.items.list()` - no TypeScript errors
- [ ] Verify autocomplete works on contract methods

---

### 3. Newly Exported Hooks

#### useOfflineResilience
```typescript
import { useOfflineResilience } from '@/hooks';

const { capabilities, slaReport, loading } = useOfflineResilience(companyId);
```

- [ ] Import `useOfflineResilience` - no module errors
- [ ] Hook returns capabilities object
- [ ] Hook returns slaReport object
- [ ] SLA violations show toast when > 0

#### usePagePin
```typescript
import { usePagePin } from '@/hooks';

const { pinned, toggle } = usePagePin('/iot', 'IoT Hub');
```

- [ ] Import `usePagePin` - no module errors
- [ ] Pin a page - appears in sidebar favorites
- [ ] Unpin a page - removed from sidebar favorites
- [ ] Favorites persist across page refresh

#### useInlineMath
```typescript
import { useInlineMath } from '@/hooks';

const math = useInlineMath(100);
// User types "10*5" → computed = 50
```

- [ ] Import `useInlineMath` - no module errors
- [ ] Evaluate "2*3" → 6
- [ ] Evaluate "120+15" → 135
- [ ] Evaluate "1000/4" → 250
- [ ] Invalid expression shows error

#### useBusinessRegistration
```typescript
import { useBusinessRegistration } from '@/hooks';

const wizard = useBusinessRegistration();
```

- [ ] Import `useBusinessRegistration` - no module errors
- [ ] Wizard steps through NID → TIN → License → VAT → Cross-ref
- [ ] Draft saves to localStorage
- [ ] Harmonization percentage calculates
- [ ] Submit completes successfully

---

### 4. Offline Queue (End-to-End)

#### Attendance Check-in (Offline)
1. [ ] Disconnect network
2. [ ] Click "Check In" button
3. [ ] Verify toast: "saved offline — will sync when reconnected"
4. [ ] Verify badge shows pending count
5. [ ] Reconnect network
6. [ ] Verify toast: "1 offline action synced"
7. [ ] Verify server has check-in record

#### Invoice Creation (Offline)
1. [ ] Disconnect network
2. [ ] Create invoice
3. [ ] Verify queued to IndexedDB
4. [ ] Reconnect network
5. [ ] Verify synced to server
6. [ ] Verify invoice appears in list

---

### 5. Build & TypeScript Validation

#### Build Commands
```bash
# Backend
npm run build:backend
# Should complete with no errors

# Frontend  
npm run build:frontend
# Should complete with no errors

# Packages
npm run build:libs
# Should complete with no errors

# Full build
npm run build:all
# Should complete with no errors
```

- [ ] Backend builds cleanly
- [ ] Frontend builds cleanly
- [ ] Packages build cleanly
- [ ] No TypeScript errors in any project

#### Type Check Commands
```bash
# All projects
npm run typecheck
# Should show 0 errors

# Specific packages
npx nx typecheck contracts
npx nx typecheck database
npx nx typecheck shared
```

- [ ] No type errors in contracts
- [ ] No type errors in database
- [ ] No type errors in shared
- [ ] No type errors in backend
- [ ] No type errors in frontend

---

## 🧪 Regression Testing

### Search Queries (Database-Level)

Run these SQL queries directly to verify collation:

```sql
-- Should return matches regardless of case
SELECT * FROM Invoice 
WHERE customerName LIKE '%acme%';

SELECT * FROM Invoice 
WHERE customerName LIKE '%ACME%';

SELECT * FROM Invoice 
WHERE customerName LIKE '%Acme%';

-- All three should return the same results
```

- [ ] Case-insensitive search works in MySQL/MariaDB
- [ ] utf8mb4_general_ci collation confirmed on string columns

---

## 🔍 Code Quality Checks

### Lint
```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

- [ ] No ESLint errors
- [ ] No unused imports
- [ ] No console.log statements in production code

### Audit
```bash
npm run audit
```

- [ ] No high/critical npm vulnerabilities

### Architecture
```bash
npm run check:arch
```

- [ ] No module boundary violations
- [ ] Frontend doesn't import backend
- [ ] Backend doesn't import @ovds/ui

---

## 📊 Performance Checks

### Search Performance
- [ ] Invoice search returns results < 200ms (for 1000 records)
- [ ] Customer search returns results < 100ms (for 500 records)
- [ ] No N+1 query issues

### oRPC Performance
- [ ] oRPC calls complete < 150ms (local)
- [ ] Request deduplication prevents duplicate requests
- [ ] Cache serves stale data during background refetch

### Offline Queue
- [ ] Queue drain processes 100 items in < 5s
- [ ] IndexedDB writes don't block UI
- [ ] Background sync triggers on reconnect

---

## 🚨 Error Scenarios

### Search with Special Characters
- [ ] Search "O'Brien" - no SQL errors
- [ ] Search "50% discount" - no errors
- [ ] Search with emoji 🎉 - no errors

### Offline Edge Cases
- [ ] Queue 500 items while offline - no crash
- [ ] Reconnect after 24h offline - sync completes
- [ ] Conflicting updates resolve correctly

### Contract Type Errors
- [ ] Pass wrong input type to oRPC call - TypeScript error at compile time
- [ ] Missing required field - TypeScript error
- [ ] Invalid response shape - runtime error with clear message

---

## ✅ Sign-Off Criteria

All checkboxes above must be ✅ before marking as **Production Ready**.

**Tested By:** _________________  
**Date:** _________________  
**Status:** [ ] PASS  [ ] FAIL  
**Notes:** _________________

