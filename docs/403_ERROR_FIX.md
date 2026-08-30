<!-- 📌 CORE CONFIG: [docs/CORE-CONFIG.md](./CORE-CONFIG.md)`n     📌 FILING LIFECYCLE: [./FILING-LIFECYCLE.md](./FILING-LIFECYCLE.md)`n     📌 SUBSCRIPTION: [docs/subscription and monitaizetion.md](./subscription and monitaizetion.md)`n     📌 UBIQUITOUS LANGUAGE: [docs/UBIQUITOUS-LANGUAGE.md](./UBIQUITOUS-LANGUAGE.md)`n     🔄 Last synced: 2026-08-27 -->
# 403 Forbidden Error Fix - ModuleGuard

## Problem Solved

**Error Seen:** 403 Forbidden on dashboard load
```
GET /api/payroll/dashboard-stats → 403
GET /api/notifications?limit=10 → 403
GET /api/notifications?companyId=...&limit=20 → 403
```

**Root Cause:** `ModuleGuard` was blocking SUPERADMIN/SPURADMIN/DEVELOPER users when companies had no modules enabled in `companyModule` table.

## Fix Applied

**File:** `apps/backend/src/auth/guards/module.guard.ts`

**Change:** Added admin bypass before module check
```typescript
// SPURADMIN / SUPERADMIN / DEVELOPER bypass all module checks
const bypassRoles = ["SPURADMIN", "SUPERADMIN", "DEVELOPER"];
if (user?.role && bypassRoles.includes(user.role)) return true;
```

## Testing

### Before Fix
```bash
curl -H "Authorization: Bearer <superadmin-token>" \
  http://localhost:5173/api/payroll/dashboard-stats
# Returns: 403 Forbidden
# Error: Required modules not enabled: payroll
```

### After Fix
```bash
curl -H "Authorization: Bearer <superadmin-token>" \
  http://localhost:5173/api/payroll/dashboard-stats
# Returns: 200 OK with payroll stats
```

## Affected Endpoints (All Now Working)

| Endpoint | Module Required | Status |
|----------|----------------|--------|
| `/api/payroll/*` | `payroll` | ✅ Fixed |
| `/api/notifications` | `notifications` | ✅ Fixed |
| `/api/ovds/treasury/*` | `treasury` | ✅ Fixed |
| `/api/ovds/tax/*` | `vat, bit, pit` | ✅ Fixed |
| `/api/projects/*` | `projects` | ✅ Fixed |
| `/api/ovds/*` | `invoice, accounting` | ✅ Fixed |
| `/api/ovds/inventory/*` | `inventory` | ✅ Fixed |
| `/api/fiscal-devices/*` | `ovds` | ✅ Fixed |
| `/api/hardware/*` | `ovds` | ✅ Fixed |

## User Roles with Bypass

- `SPURADMIN` - System super administrator
- `SUPERADMIN` - Super administrator
- `DEVELOPER` - Developer access

These roles can now access **all** endpoints regardless of whether modules are enabled for the company.

## Why This Matters

**Scenario:** Fresh company setup
1. User creates a new company
2. Dashboard loads → calls `/api/payroll/dashboard-stats`
3. **Before fix:** 403 error (payroll module not enabled yet)
4. **After fix:** 200 OK (SUPERADMIN bypasses module check)

This allows admins to:
- View dashboards for fresh companies
- Set up companies without pre-enabling every module
- Access all features during onboarding/setup
- Debug module-related issues

## Deployment

**No migration required** — backend-only fix.

**Deploy steps:**
1. Deploy updated backend
2. Restart backend service
3. Test with SUPERADMIN user

**Rollback:** Safe to rollback — only changes behavior for SPURADMIN/SUPERADMIN/DEVELOPER roles.

---

**Status:** ✅ Fixed and Ready for Production  
**Date:** 2026-08-01

