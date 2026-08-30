/**
 * @ovds/features/monetization — public API
 */

// ── API clients ────────────────────────────────────────────────────────────────
export {
  entitlementApi, productsApi, subscriptionApi, trialApi, purchaseApi, licenseApi, billingAdminApi
} from './services/monetizationApi';

// ── Hooks ──────────────────────────────────────────────────────────────────────
export {
  useEntitlementStatus, useProducts
} from './hooks/useEntitlement';
