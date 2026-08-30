/**
 * LicenseManager
 *
 * React component for viewing and managing subscription/license status.
 * Interfaces with the NestJS /monetization endpoints.
 *
 * Place this in the Settings area of the frontend.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Key,
  Calendar,
  Package,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getEntitlementStatus,
  startTrial,
  createSubscription,
  activateLicense,
  listProducts,
  getProduct,
  pauseSubscription,
  resumeSubscription,
  switchPlan,
  type EntitlementStatusResponse,
  type MonetizationProduct,
  type ActivateLicenseResponse,
} from '../../services/monetizationApi';

interface LicenseManagerProps {
  onNavigate?: (path: string) => void;
}

const FEATURE_LABELS: Record<string, string> = {
  'feature:gl': 'General Ledger',
  'feature:bank-recon': 'Bank Reconciliation',
  'feature:ocr': 'Bank Statement OCR',
  'feature:ifrs-reports': 'IFRS Financial Reports',
  'feature:period-close': 'Period Close',
  'feature:payroll-unlimited': 'Unlimited Payroll',
  'feature:biometrics': 'Biometric Attendance',
  'feature:shifts': 'Shift Scheduling',
  'feature:drrf': 'DRRF Levy',
  'feature:bit': 'Business Income Tax',
  'feature:erca-dashboard': 'ERCA Dashboard',
  'feature:audit-outsourcing': 'Audit Outsourcing',
  'feature:multi-company': 'Multi-Company',
  'feature:white-label': 'White Label',
  'feature:on-premise': 'On-Premise Deployment',
};

const PLAN_LABELS: Record<string, string> = {
  'plan:starter': 'Starter',
  'plan:business': 'Business',
  'plan:enterprise': 'Enterprise',
};

const LicenseManager: React.FC<LicenseManagerProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<EntitlementStatusResponse | null>(null);
  const [products, setProducts] = useState<MonetizationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [startingTrial, setStartingTrial] = useState(false);
  const [activating, setActivating] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [managingSub, setManagingSub] = useState(false);
  const [switchPlanId, setSwitchPlanId] = useState<string>('');

  const fetchData = async () => {
    try {
      const [statusData, productsData] = await Promise.all([
        getEntitlementStatus(),
        listProducts(),
      ]);
      setStatus(statusData);
      setProducts(productsData);
      if (!selectedProductId && productsData.length > 0) {
        setSelectedProductId(productsData[0].id);
      }
    } catch {
      toast.error('Failed to load license status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('License status refreshed');
  };

  const handleStartTrial = async () => {
    if (!selectedProductId) return;
    setStartingTrial(true);
    try {
      const trial = await startTrial({ productId: selectedProductId });
      toast.success(`Trial started: ${trial.status}`);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to start trial');
    } finally {
      setStartingTrial(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedProductId) return;
    try {
      const product = await getProduct(selectedProductId);
      const sub = await createSubscription({
        productId: selectedProductId,
        billingCycle: 'ANNUAL',
      });
      toast.success(`Subscribed to ${product.name}`);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create subscription');
    }
  };

  const handlePause = async () => {
    if (!activeSubscription?.id) return;
    setManagingSub(true);
    try {
      await pauseSubscription(activeSubscription.id);
      toast.success('Subscription paused');
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to pause subscription');
    } finally {
      setManagingSub(false);
    }
  };

  const handleResume = async () => {
    if (!activeSubscription?.id) return;
    setManagingSub(true);
    try {
      await resumeSubscription(activeSubscription.id);
      toast.success('Subscription resumed');
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to resume subscription');
    } finally {
      setManagingSub(false);
    }
  };

  const handleSwitchPlan = async () => {
    if (!activeSubscription?.id || !switchPlanId) return;
    setManagingSub(true);
    try {
      const result = await switchPlan(activeSubscription.id, {
        productId: switchPlanId,
        billingCycle: 'ANNUAL',
      });
      toast.success(`Switched to ${result.toProduct.name}`);
      setSwitchPlanId('');
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to switch plan');
    } finally {
      setManagingSub(false);
    }
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;
    setActivating(true);
    try {
      const result: ActivateLicenseResponse = await activateLicense(licenseKey.trim());
      if (result.success) {
        toast.success(result.message);
        setLicenseKey('');
        await fetchData();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'License activation failed');
    } finally {
      setActivating(false);
    }
  };

  const copyLicenseKey = async () => {
    if (!status?.activeSubscription?.providerRef) return;
    try {
      await navigator.clipboard.writeText(status.activeSubscription.providerRef);
      setCopied(true);
      toast.success('Subscription reference copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
        <div className="flex items-center gap-3">
          <XCircle className="text-red-500" size={24} />
          <div>
            <h3 className="font-bold text-red-800 dark:text-red-200">Unable to load license status</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">Check your connection and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeSubscription = status.activeSubscription;
  const activeTrial = status.activeTrial;
  const hasActiveSub = !!activeSubscription;
  const hasLifetime = status.lifetimePurchases.length > 0;
  const hasTrial = !!activeTrial;
  const isExpired = !hasActiveSub && !hasLifetime && !hasTrial;
  const planName =
    PLAN_LABELS[status.planSlug ?? ''] ??
    activeSubscription?.product?.name ??
    activeTrial?.product?.name ??
    'Unknown Plan';

  return (
    <div className="space-y-6">
      {/* ── Status Card ──────────────────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border p-6 transition-colors ${
          isExpired
            ? 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20'
            : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isExpired
                  ? 'bg-rose-100 dark:bg-rose-900/40'
                  : 'bg-emerald-100 dark:bg-emerald-900/40'
              }`}
            >
              {isExpired ? (
                <AlertTriangle className="text-rose-500" size={24} />
              ) : (
                <ShieldCheck className="text-emerald-600" size={24} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {isExpired ? 'Subscription Expired' : hasTrial ? 'Free Trial Active' : 'License Active'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {planName}
                {hasTrial && status.trialDaysRemaining !== null && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400 font-bold">
                    ({status.trialDaysRemaining} days left)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate('/plans')}
                className="px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={12} />
                View Plans
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50"
              title="Refresh status"
            >
              <RefreshCw
                size={16}
                className={`text-slate-500 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <MetricCard
            label="Plan"
            value={planName}
            icon={<Package size={14} />}
          />
          <MetricCard
            label="Features"
            value={`${status.entitledFeatures.length} unlocked`}
            icon={<ShieldCheck size={14} />}
          />
          <MetricCard
            label="Trial"
            value={
              hasTrial
                ? `${status.trialDaysRemaining} days`
                : hasActiveSub
                  ? 'Active'
                  : hasLifetime
                    ? 'Lifetime'
                    : '—'
            }
            icon={<Calendar size={14} />}
          />
          <MetricCard
            label="Status"
            value={isExpired ? 'Updates Locked' : 'Updates Allowed'}
            icon={isExpired ? <XCircle size={14} /> : <CheckCircle size={14} />}
            valueColor={isExpired ? 'text-rose-600' : 'text-emerald-600'}
          />
        </div>
      </div>

      {/* ── Subscription Reference ───────────────────────────────────────────── */}
      {activeSubscription?.providerRef && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Key size={16} className="text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Subscription Reference</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {activeSubscription.providerRef}
                </p>
              </div>
            </div>
            <button
              onClick={copyLicenseKey}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Copy subscription reference"
            >
              {copied ? (
                <Check size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} className="text-slate-400" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Plan Management ───────────────────────────────────────────────────── */}
      {(hasActiveSub || activeSubscription?.status === 'PAUSED') && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Manage Subscription
          </h4>

          <div className="flex flex-wrap items-center gap-3">
            {activeSubscription?.status === 'ACTIVE' && (
              <button
                onClick={handlePause}
                disabled={managingSub}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {managingSub ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                    Processing...
                  </>
                ) : (
                  <>Pause Subscription</>
                )}
              </button>
            )}
            {activeSubscription?.status === 'PAUSED' && (
              <button
                onClick={handleResume}
                disabled={managingSub}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {managingSub ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                    Processing...
                  </>
                ) : (
                  <>Resume Subscription</>
                )}
              </button>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Switch Plan</p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={switchPlanId}
                onChange={(e) => setSwitchPlanId(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Select a plan...</option>
                {products
                  .filter((p) => p.type === 'SUBSCRIPTION' && p.id !== activeSubscription?.productId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleSwitchPlan}
                disabled={managingSub || !switchPlanId}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {managingSub ? 'Switching...' : 'Switch Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upgrading / Trial Actions ─────────────────────────────────────────── */}
      {isExpired && products.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Activate or Renew License
          </h4>

          <form onSubmit={handleActivateLicense} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                License Key
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Paste your license key (e.g. AKA-2026-XXXX-XXXX)"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                disabled={activating}
              />
            </div>
            <button
              type="submit"
              disabled={activating || !licenseKey.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {activating ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                  Activating...
                </>
              ) : (
                <>Activate License</>
              )}
            </button>
          </form>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Or subscribe to a plan</p>
            <div className="flex items-center gap-3">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.type === 'LIFETIME' ? 'Lifetime' : p.type === 'SUBSCRIPTION' ? 'Subscription' : 'Addon'}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStartTrial}
                disabled={startingTrial}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {startingTrial ? 'Starting...' : 'Start Trial'}
              </button>
              <button
                onClick={handleSubscribe}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feature List ─────────────────────────────────────────────────────── */}
      {status.entitledFeatures.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-6">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">
            Unlocked Features ({status.entitledFeatures.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {status.entitledFeatures.map((key) => (
              <div
                key={key}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40"
              >
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {FEATURE_LABELS[key] ?? key}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -- Helpers --------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, valueColor }) => (
  <div className="px-4 py-3 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60">
    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-sm font-black ${valueColor ?? 'text-slate-900 dark:text-white'}`}>
      {value}
    </p>
  </div>
);

export default LicenseManager;
