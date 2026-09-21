/**
 * useMonetization — convenience hook for monetization state.
 *
 * Wraps useEntitlement with additional helpers for common UI patterns.
 *
 * Example:
 *   const { isEntitled, requirePlan, trialBanner } = useMonetization();
 *   if (!isEntitled('feature:gl')) return <UpgradeWall featureKey="feature:gl" />;
 */
import { FEATURE_KEYS } from '@ovds/ui';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useEntitlement } from '../context/entitlementContext';

export { FEATURE_KEYS };

export function useMonetization() {
  const entitlement = useEntitlement();
  const navigate = useNavigate();

  /**
   * Navigate to /plans if the company is not entitled to the given feature.
   * Returns true if entitled (caller can proceed), false if redirected.
   */
  const requireFeature = useCallback(
    (featureKey: string): boolean => {
      if (entitlement.isEntitled(featureKey)) return true;
      navigate('/plans', { state: { requiredFeature: featureKey } });
      return false;
    },
    [entitlement, navigate],
  );

  /**
   * Returns a human-readable plan name from the slug.
   */
  const planDisplayName = useCallback((): string => {
    const slug = entitlement.planSlug;
    if (!slug) return 'Free';
    if (slug.includes('enterprise')) return 'Enterprise';
    if (slug.includes('business')) return 'Business';
    if (slug.includes('starter')) return 'Starter';
    return slug;
  }, [entitlement.planSlug]);

  /**
   * Returns trial banner text if on trial, null otherwise.
   */
  const trialBannerText = useCallback((): string | null => {
    if (!entitlement.isOnTrial || entitlement.trialDaysRemaining === null) return null;
    const days = entitlement.trialDaysRemaining;
    if (days <= 0) return 'Your free trial has expired. Upgrade to continue.';
    if (days === 1) return '1 day left in your free trial.';
    return `${days} days left in your free trial.`;
  }, [entitlement.isOnTrial, entitlement.trialDaysRemaining]);

  return {
    ...entitlement,
    requireFeature,
    planDisplayName,
    trialBannerText,
    FEATURE_KEYS,
  };
}

