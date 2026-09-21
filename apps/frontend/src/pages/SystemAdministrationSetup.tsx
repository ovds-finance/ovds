/**
 * SystemAdministrationSetup — Ovds-style step-by-step setup wizard
 *
 * Route: /settings/setup-wizard
 * Permission: settings:read (view) | settings:write (complete/skip steps)
 *
 * Features:
 *   - Category-based step grouping (Deployment, Company, Financial, Modules, Users, System)
 *   - Step dependencies with visual indicators
 *   - Scope summary and module activity tracking
 *   - Direct links to each System Administration page
 *   - Progress bar and completion percentage
 *   - Skip/reset functionality
 */

import { Role } from '@ovds/shared';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Globe,
  LayoutGrid,
  Settings,
  Square,
  Users,
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle,
  Banknote,
  Receipt,
  PartyPopper,
  BarChart3,
  Undo2,
  Search,
  Shield,
  Scale,
} from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import {
  Btn,
  ContextPill,
  Modal,
  FormField,
  Input,
  Select,
  Textarea,
} from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac';
import { rbac } from '../rbac';
import { setupApi, type SetupStepDefinition, type CompanySetupProgress } from '../services/setupApi';

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  deployment:  { label: 'Deployment & Environment', icon: <Cloud size={14} />, color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800' },
  company:     { label: 'Core Company Data',       icon: <Settings size={14} />, color: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800' },
  financial:   { label: 'Financial Parameters',   icon: <Banknote size={14} />, color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800' },
  modules:     { label: 'Modules & Scope',        icon: <LayoutGrid size={14} />, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800' },
  users:       { label: 'Users & Access',         icon: <Users size={14} />, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800' },
  system:      { label: 'System Controls',        icon: <SlidersHorizontal size={14} />, color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700' },
  security:    { label: 'Security & Access',      icon: <Shield size={14} />, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800' },
  tax:         { label: 'Tax Configuration',      icon: <Receipt size={14} />, color: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800' },
  compliance:  { label: 'Compliance',             icon: <CheckCircle2 size={14} />, color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800' },
  localization:{ label: 'Localization',           icon: <Globe size={14} />, color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-800' },
};

const STEP_ROUTE_MAP: Record<string, string> = {
  setup_wizard: '/settings/setup-wizard',
  admin_setup_wizard: '/settings/setup-wizard',
  cloud_deployment: '/getting-started/cloud',
  on_premise_deployment: '/getting-started/on-premise',
  enterprise_client: '/getting-started/client',
  invoice_module: '/getting-started/invoice-module',
  tin_mor_credentials: '/settings/company-profile',
  business_registration: '/settings/business-registration',
  sme_profile: '/smes',
  multi_company: '/settings/multi-company',
  payment_gateways: '/ovds/payment-gateways',
  chapa_gateway: '/settings/payment-gateways/chapa',
  digital_wallets: '/settings/digital-wallets',
  universal_tax_config: '/tax/universal-config',
  currency_exchange: '/settings/currencies',
  fiscal_year: '/accounting/period-close',
  module_selection: '/settings/app-store',
  project_management: '/ovds/projects',
  iot_devices: '/control/iot',
  users: '/settings/users',
  roles_permissions: '/settings/roles',
  onboarding: '/settings/onboarding',
  settings_catalog: '/settings/catalog',
  control_node: '/control',
  api_docs: '/settings/api-docs',
  developer_guide: '/settings/developers',
  system_updates: '/settings/releases',
  notifications: '/admin/notifications-settings',
  eims_integration: '/settings/eims',
  security_assessment: '/settings/security',
};

const SystemAdministrationSetup: React.FC = () => {
  usePageTitle('System Administration Setup');
  const { user, can } = useAuth();
  const canWrite = can('settings:write');
  const [steps, setSteps] = useState<SetupStepDefinition[]>([]);
  const [progress, setProgress] = useState<CompanySetupProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [modalStep, setModalStep] = useState<SetupStepDefinition | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [legalName, _setLegalName] = useState('');
  const [tin, _setTin] = useState('—');
  const [licenseStatus, _setLicenseStatus] = useState('UNKNOWN');
  const [totalUsers, _setTotalUsers] = useState(0);
  const [roleCount, _setRoleCount] = useState(0);

  const [sodConflicts, setSodConflicts] = useState(0);
  const [highRiskRoles, setHighRiskRoles] = useState(0);
  const [complianceScore, setComplianceScore] = useState(100);
  const [seedingRbac, setSeedingRbac] = useState(false);

  const companyId = user?.companyId;

  const STEP_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'email' | 'select' | 'textarea' | 'number' | 'password'; options?: { value: string; label: string }[]; placeholder?: string; required?: boolean }[]> = {
    setup_wizard: [
      { key: 'wizard_name', label: 'Wizard Name', type: 'text', placeholder: 'e.g. My Company Setup', required: true },
    ],
    admin_setup_wizard: [
      { key: 'admin_email', label: 'Admin Email', type: 'email', placeholder: 'admin@company.com', required: true },
      { key: 'timezone', label: 'Timezone', type: 'select', options: [
        { value: 'Africa/Addis_Ababa', label: 'Africa/Addis_Ababa (EAT)' },
        { value: 'UTC', label: 'UTC' },
        { value: 'Europe/London', label: 'Europe/London (GMT)' },
      ], required: true },
      { key: 'language', label: 'Default Language', type: 'select', options: [
        { value: 'en', label: 'English' },
        { value: 'am', label: 'Amharic' },
      ], required: true },
    ],
    cloud_deployment: [
      { key: 'cloud_provider', label: 'Cloud Provider', type: 'select', options: [
        { value: 'aws', label: 'AWS' },
        { value: 'gcp', label: 'Google Cloud' },
        { value: 'azure', label: 'Azure' },
      ], required: true },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'e.g. af-south-1', required: true },
      { key: 'auto_backup', label: 'Auto Backup', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' },
      ], required: true },
    ],
    on_premise_deployment: [
      { key: 'server_url', label: 'Server URL', type: 'text', placeholder: 'https://your-server.com', required: true },
      { key: 'offline_mode', label: 'Offline Mode', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' },
      ], required: true },
      { key: 'offline_sync_interval', label: 'Sync Interval (minutes)', type: 'number', placeholder: '15', required: false },
    ],
    enterprise_client: [
      { key: 'sync_endpoint', label: 'Sync Endpoint URL', type: 'text', placeholder: 'https://sync.company.com', required: true },
      { key: 'edge_node_count', label: 'Edge Node Count', type: 'number', placeholder: '1', required: true },
      { key: 'hybrid_mode', label: 'Hybrid Mode', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' },
      ], required: false },
    ],
    invoice_module: [
      { key: 'invoice_prefix', label: 'Invoice Prefix', type: 'text', placeholder: 'INV-', required: true },
      { key: 'next_number', label: 'Next Invoice Number', type: 'number', placeholder: '1', required: true },
    ],
    tin_mor_credentials: [
      { key: 'tin', label: 'TIN (10 digits)', type: 'text', placeholder: '0123456789', required: true },
      { key: 'branch_code', label: 'Branch Code', type: 'text', placeholder: '001', required: true },
      { key: 'mor_username', label: 'MoR Portal Username', type: 'text', placeholder: 'username', required: true },
    ],
    business_registration: [
      { key: 'business_structure', label: 'Business Structure', type: 'select', options: [
        { value: 'plc', label: 'PLC' },
        { value: 'share_company', label: 'Share Company' },
        { value: 'one_person', label: 'One Person Company' },
        { value: 'llp', label: 'LLP' },
        { value: 'general_partnership', label: 'General Partnership' },
        { value: 'limited_partnership', label: 'Limited Partnership' },
        { value: 'sole_proprietor', label: 'Sole Proprietor' },
      ], required: true },
      { key: 'trade_name', label: 'Trade Name', type: 'text', placeholder: 'Company Trade Name', required: true },
    ],
    sme_profile: [
      { key: 'sme_classification', label: 'SME Classification', type: 'select', options: [
        { value: 'micro', label: 'Micro' },
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
      ], required: true },
      { key: 'sector_code', label: 'Sector Code', type: 'text', placeholder: 'e.g. MFG', required: true },
    ],
    multi_company: [
      { key: 'group_name', label: 'Group Name', type: 'text', placeholder: 'Group Name', required: true },
      { key: 'parent_company_id', label: 'Parent Company ID', type: 'text', placeholder: 'UUID or ID', required: true },
    ],
    payment_gateways: [
      { key: 'default_gateway', label: 'Default Gateway', type: 'select', options: [
        { value: 'chapa', label: 'Chapa' },
        { value: 'arifpay', label: 'ArifPay' },
        { value: 'stripe', label: 'Stripe' },
      ], required: true },
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://your-server.com/webhook', required: false },
    ],
    chapa_gateway: [
      { key: 'chapa_secret_key', label: 'Chapa Secret Key', type: 'text', placeholder: 'CHASECK-...', required: true },
      { key: 'chapa_public_key', label: 'Chapa Public Key', type: 'text', placeholder: 'CHAPUBK-...', required: true },
    ],
    digital_wallets: [
      { key: 'wallet_provider', label: 'Wallet Provider', type: 'select', options: [
        { value: 'telebirr', label: 'Telebirr' },
        { value: 'cbe_birr', label: 'CBE Birr' },
        { value: 'mobile_money', label: 'Mobile Money' },
      ], required: true },
      { key: 'phone_number', label: 'Phone Number', type: 'text', placeholder: '+251912345678', required: true },
    ],
    universal_tax_config: [
      { key: 'vat_rate', label: 'VAT Rate (%)', type: 'number', placeholder: '15', required: true },
      { key: 'tot_rate', label: 'TOT Rate (%)', type: 'number', placeholder: '2', required: true },
      { key: 'bit_rate', label: 'BIT Rate (%)', type: 'number', placeholder: '30', required: true },
    ],
    currency_exchange: [
      { key: 'default_currency', label: 'Default Currency', type: 'text', placeholder: 'ETB', required: true },
      { key: 'exchange_rate_provider', label: 'Exchange Rate Provider', type: 'select', options: [
        { value: 'nbe', label: 'NBE' },
        { value: 'open_er', label: 'Open Exchange Rates' },
        { value: 'manual', label: 'Manual' },
      ], required: false },
    ],
    fiscal_year: [
      { key: 'fiscal_year_start', label: 'Fiscal Year Start Month', type: 'number', placeholder: '7 (July for EFY)', required: true },
      { key: 'fiscal_year_type', label: 'Fiscal Year Type', type: 'select', options: [
        { value: 'efy', label: 'Ethiopian Fiscal Year (EFY)' },
        { value: 'gc', label: 'Gregorian Calendar (GC)' },
      ], required: true },
    ],
    module_selection: [
      { key: 'enabled_modules', label: 'Enabled Modules (JSON array)', type: 'textarea', placeholder: '["invoice","accounting","projects","inventory"]', required: true },
    ],
    project_management: [
      { key: 'default_project_status', label: 'Default Project Status', type: 'text', placeholder: 'active', required: true },
      { key: 'budget_alert_threshold', label: 'Budget Alert Threshold (%)', type: 'number', placeholder: '80', required: false },
    ],
    iot_devices: [
      { key: 'device_type', label: 'Device Type', type: 'text', placeholder: 'POS Terminal', required: true },
      { key: 'sync_interval', label: 'Sync Interval (minutes)', type: 'number', placeholder: '5', required: true },
    ],
    users: [
      { key: 'admin_email', label: 'Admin Email', type: 'email', placeholder: 'admin@company.com', required: true },
      { key: 'admin_first_name', label: 'Admin First Name', type: 'text', placeholder: 'John', required: true },
      { key: 'admin_last_name', label: 'Admin Last Name', type: 'text', placeholder: 'Doe', required: true },
    ],
    roles_permissions: [
      { key: 'default_role', label: 'Default Role', type: 'text', placeholder: 'ADMIN', required: true },
      { key: 'permission_policy', label: 'Permission Policy', type: 'select', options: [
        { value: 'strict', label: 'Strict' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'open', label: 'Open' },
      ], required: true },
    ],
    security_baseline: [
      { key: 'rbac_policy', label: 'RBAC Policy', type: 'select', options: [
        { value: 'least_privilege', label: 'Least Privilege (Recommended)' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'open', label: 'Open' },
      ], required: true },
      { key: 'sod_enforcement', label: 'SoD Enforcement', type: 'select', options: [
        { value: 'strict', label: 'Strict — block conflicts' },
        { value: 'warn', label: 'Warn — allow with logging' },
      ], required: true },
    ],
    onboarding: [
      { key: 'welcome_email_template', label: 'Welcome Email Template ID', type: 'text', placeholder: 'welcome-001', required: true },
    ],
    settings_catalog: [
      { key: 'catalog_version', label: 'Catalog Version', type: 'text', placeholder: '1.0.0', required: true },
    ],
    control_node: [
      { key: 'node_name', label: 'Node Name', type: 'text', placeholder: 'main-node', required: true },
      { key: 'license_key', label: 'License Key', type: 'text', placeholder: 'XXXX-XXXX-XXXX-XXXX', required: true },
      { key: 'monitoring_interval', label: 'Monitoring Interval (minutes)', type: 'number', placeholder: '5', required: false },
    ],
    api_docs: [
      { key: 'api_base_url', label: 'API Base URL', type: 'text', placeholder: 'https://api.company.com', required: false },
      { key: 'api_version', label: 'API Version', type: 'text', placeholder: '1.0.0', required: false },
    ],
    developer_guide: [
      { key: 'docs_base_url', label: 'Documentation Base URL', type: 'text', placeholder: 'https://docs.company.com', required: true },
      { key: 'sdk_version', label: 'SDK Version', type: 'text', placeholder: '1.0.0', required: false },
    ],
    system_updates: [
      { key: 'update_channel', label: 'Update Channel', type: 'select', options: [
        { value: 'stable', label: 'Stable' },
        { value: 'beta', label: 'Beta' },
        { value: 'alpha', label: 'Alpha' },
      ], required: true },
      { key: 'auto_update', label: 'Auto Update', type: 'select', options: [
        { value: 'true', label: 'Enabled' },
        { value: 'false', label: 'Disabled' },
      ], required: true },
    ],
    notifications: [
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com', required: true },
      { key: 'smtp_port', label: 'SMTP Port', type: 'number', placeholder: '587', required: true },
      { key: 'smtp_username', label: 'SMTP Username', type: 'text', placeholder: 'user@example.com', required: true },
      { key: 'smtp_password', label: 'SMTP Password', type: 'password', placeholder: '••••••••', required: true },
    ],
  };

  const openStepModal = (step: SetupStepDefinition) => {
    setModalStep(step);
    const existingData = progress?.steps?.find(s => s.stepKey === step.key)?.data;
    setFormData(existingData || {});
    setValidationErrors((prev) => ({ ...prev, [step.key]: [] }));
  };

  const closeStepModal = () => {
    setModalStep(null);
    setFormData({});
  };

  const handleModalSubmit = async () => {
    if (!companyId || !modalStep) return;
    setSaving(true);
    setValidationErrors((prev) => ({ ...prev, [modalStep.key]: [] }));
    try {
      const updated = await setupApi.completeStep(companyId, modalStep.key, formData);
      setProgress(updated);
      setActiveStep(null);
      closeStepModal();
      toast.success('Step completed');

      const route = STEP_ROUTE_MAP[modalStep.key];
      if (route) {
        setTimeout(() => {
          window.location.href = route;
        }, 800);
      }
    } catch (e: any) {
      const errors = e?.response?.data?.errors ?? e?.response?.data?.message ? [e.response.data.message] : [e?.message ?? 'Failed to complete step'];
      setValidationErrors((prev) => ({ ...prev, [modalStep!.key]: errors }));
      toast.error(errors[0] ?? 'Failed to complete step');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (stepKey: string) => {
    if (!companyId || !canWrite) return;
    const step = stepMap.get(stepKey);
    if (!step) return;
    const fields = STEP_FIELDS[stepKey];
    if (fields && fields.length > 0) {
      openStepModal(step);
    } else {
      setSaving(true);
      setValidationErrors((prev) => ({ ...prev, [stepKey]: [] }));
      try {
        const updated = await setupApi.completeStep(companyId, stepKey, {});
        setProgress(updated);
        setActiveStep(null);
        toast.success('Step completed');
        const route = STEP_ROUTE_MAP[stepKey];
        if (route) {
          setTimeout(() => {
            window.location.href = route;
          }, 800);
        }
      } catch (e: any) {
        const errors = e?.response?.data?.errors ?? [e?.message ?? 'Failed to complete step'];
        setValidationErrors((prev) => ({ ...prev, [stepKey]: errors }));
        toast.error(errors[0] ?? 'Failed to complete step');
      } finally {
        setSaving(false);
      }
    }
  };

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    Promise.all([
      setupApi.listStepsByCategory(),
      setupApi.getProgress(companyId),
    ]).then(([stepsByCategory, progressData]) => {
      const allSteps = Object.values(stepsByCategory).flat();
      setSteps(allSteps);
      setProgress(progressData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const ALL_ROLES = Object.values(Role) as string[];
    type SodRule = { id: string; perm1: string; perm2: string };
    const SOD_RULES: SodRule[] = [
      { id: 'SOD-001', perm1: 'payroll:generate', perm2: 'payroll:approve' },
      { id: 'SOD-002', perm1: 'invoices:write', perm2: 'ovds:approve' },
      { id: 'SOD-003', perm1: 'vat:file', perm2: 'audit_logs:write' },
      { id: 'SOD-004', perm1: 'users:delete', perm2: 'audit_logs:write' },
      { id: 'SOD-005', perm1: 'fund_transfers:write', perm2: 'fund_transfers:approve' },
      { id: 'SOD-006', perm1: 'banking:kyc:write', perm2: 'banking:kyc:approve' },
      { id: 'SOD-007', perm1: 'banking:loan_application:write', perm2: 'business_loans:approve' },
      { id: 'SOD-008', perm1: 'period_close:write', perm2: 'reports:financial:full' },
    ];
    function calcRoleRisk(role: string): number {
      if (role === 'SPURADMIN' || role === 'SUPERADMIN') return 100;
      const perms = new Set(rbac.permissionsFor(role as any));
      const criticalHits = ['fund_transfers:approve', 'payroll:approve', 'users:delete', 'vat:file', 'companies:delete', 'role_permissions:write', 'system:deploy', 'banking:kyc:approve', 'banking:aml:flag', 'payroll:admin', 'ovds:delete', 'audit_logs:write', 'banking:loan_application:submit', 'external_audit:certify', 'period_close:write', 'ifrs10:consolidation:approve'].filter(p => perms.has(p as any)).length;
      const adminPerms = rbac.permissionsFor(role as any).filter((p: string) => p.includes(':delete') || p.includes(':approve') || p.includes(':admin') || p.includes(':deploy') || p.includes(':certify')).length;
      const writePerms = rbac.permissionsFor(role as any).filter((p: string) => p.includes(':write') || p.includes(':generate') || p.includes(':file') || p.includes(':calculate')).length;
      const score = Math.min(100, Math.round((criticalHits * 8 + adminPerms * 3 + writePerms * 1.5) / 1.2));
      return score;
    }
    const sodConflicts = SOD_RULES.filter(rule => ALL_ROLES.some(role => rbac.can(role as any, rule.perm1 as any) && rbac.can(role as any, rule.perm2 as any))).length;
    const highRiskRoles = ALL_ROLES.filter(r => calcRoleRisk(r) >= 61).length;
    const complianceScore = Math.max(0, 100 - (sodConflicts * 8) - (highRiskRoles * 4));
    setSodConflicts(sodConflicts);
    setHighRiskRoles(highRiskRoles);
    setComplianceScore(complianceScore);
  }, [companyId]);

  // ── Derived values (defined before effects that depend on them) ──────────────

  const overallProgress = progress?.overallProgress ?? 0;

  const stepMap = useMemo(() => {
    const map = new Map<string, SetupStepDefinition>();
    for (const s of steps) map.set(s.key, s);
    return map;
  }, [steps]);

  const stepStatusMap = useMemo(() => {
    const map = new Map<string, 'pending' | 'in_progress' | 'completed' | 'skipped'>();
    if (progress) {
      for (const s of progress.steps) map.set(s.stepKey, s.status);
    }
    return map;
  }, [progress]);

  const completedCount = useMemo(() => {
    if (!progress) return 0;
    return progress.steps.filter(s => s.status === 'completed').length;
  }, [progress]);

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (overallProgress === 100 && !hasCelebrated) {
      setHasCelebrated(true);
      toast.success('Setup wizard completed!', { duration: 4000 });
    }
    if (overallProgress < 100) {
      setHasCelebrated(false);
    }
  }, [overallProgress, hasCelebrated]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const categories = useMemo(() => {
    const cats: Record<string, SetupStepDefinition[]> = {};
    for (const s of steps) {
      if (!cats[s.category]) cats[s.category] = [];
      cats[s.category].push(s);
    }
    return cats;
  }, [steps]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered: Record<string, SetupStepDefinition[]> = {};
    for (const [cat, catSteps] of Object.entries(categories)) {
      if (activeCategoryFilter && cat !== activeCategoryFilter) continue;
      const matching = catSteps.filter(s =>
        !q ||
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q)
      );
      if (matching.length > 0) filtered[cat] = matching;
    }
    return filtered;
  }, [categories, searchQuery, activeCategoryFilter]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    for (const cat of Object.keys(categories)) {
      allExpanded[cat] = true;
    }
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  const toggleStepExpand = (stepKey: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepKey)) next.delete(stepKey);
      else next.add(stepKey);
      return next;
    });
  };

  const getStepData = (stepKey: string): Record<string, string> | undefined => {
    if (!progress) return undefined;
    const stepStatus = progress.steps.find(s => s.stepKey === stepKey);
    return stepStatus?.data;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const handleSkip = async (stepKey: string) => {
    if (!companyId || !canWrite) return;
    setSaving(true);
    setValidationErrors((prev) => ({ ...prev, [stepKey]: [] }));
    try {
      const updated = await setupApi.skipStep(companyId, stepKey);
      setProgress(updated);
      setActiveStep(null);
      toast.success('Step skipped');

      const route = STEP_ROUTE_MAP[stepKey];
      if (route) {
        setTimeout(() => {
          window.location.href = route;
        }, 800);
      }
    } catch (e: any) {
      const errors = e?.response?.data?.errors ?? [e?.message ?? 'Failed to skip step'];
      setValidationErrors((prev) => ({ ...prev, [stepKey]: errors }));
      toast.error(errors[0] ?? 'Failed to skip step');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!companyId || !canWrite) return;
    setSaving(true);
    try {
      const result = await setupApi.resetProgress(companyId);
      setProgress(result.progress);
      toast.success('Wizard reset');
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to reset wizard');
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async (stepKey: string) => {
    if (!companyId || !canWrite) return;
    setSaving(true);
    setValidationErrors((prev) => ({ ...prev, [stepKey]: [] }));
    try {
      const updated = await setupApi.undoStep(companyId, stepKey);
      setProgress(updated);
      toast.success('Step reverted to pending');
    } catch (e: any) {
      const errors = e?.response?.data?.errors ?? [e?.message ?? 'Failed to undo step'];
      setValidationErrors((prev) => ({ ...prev, [stepKey]: errors }));
      toast.error(errors[0] ?? 'Failed to undo step');
    } finally {
      setSaving(false);
    }
  };

  const handleViewSummary = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const summary = await setupApi.getSummary(companyId);
      setProgress((prev) => prev ? { ...prev, scopeSummary: summary.scopeSummary, moduleActivities: summary.moduleActivities } : prev);
      setShowSummary(true);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load summary');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllComplete = async () => {
    if (!companyId || !canWrite || !progress) return;
    setSaving(true);
    try {
      const results = await Promise.all(
        progress.steps
          .filter(s => s.status !== 'completed' && !stepMap.get(s.stepKey)?.isRequired)
          .map(s => setupApi.completeStep(companyId, s.stepKey, { skipped: 'true' }))
      );
      if (results.length > 0) {
        setProgress(results[results.length - 1]);
        toast.success(`Marked ${results.length} optional steps as complete`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to mark steps complete');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedRbac = async () => {
    if (!companyId || !canWrite) return;
    setSeedingRbac(true);
    try {
      const result = await setupApi.seedRbac(companyId);
      toast.success(`RBAC seeded: ${result.roles.created} roles, ${result.permissions.created} permissions`);
      const updated = await setupApi.getProgress(companyId);
      setProgress(updated);
      const secStep = stepMap.get('security_baseline');
      if (secStep && updated.steps.some(s => s.stepKey === 'security_baseline' && s.status !== 'completed')) {
        await setupApi.completeStep(companyId, 'security_baseline', { rbac_policy: 'least_privilege', sod_enforcement: 'strict' });
        const finalProgress = await setupApi.getProgress(companyId);
        setProgress(finalProgress);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to seed RBAC');
    } finally {
      setSeedingRbac(false);
    }
  };

  const isStepAvailable = (step: SetupStepDefinition): boolean => {
    if (!step.dependsOn) return true;
    const depStatus = stepStatusMap.get(step.dependsOn);
    if (!depStatus) return false;
    if (step.dependsValue) return depStatus === step.dependsValue;
    return depStatus === 'completed';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {overallProgress === 100 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animation: `confetti-fall ${2 + Math.random() * 2}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            >
              <PartyPopper size={16 + Math.random() * 12} className="text-[var(--pro-azure)]" />
            </div>
          ))}
        </div>
      )}
      {/* -- Header -- */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Administration Setup</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure core company data, financial parameters, modules, and system controls step by step.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={handleReset} disabled={saving || !progress}>
            <RefreshCw size={14} /> Reset
          </Btn>
          <Btn variant="secondary" onClick={handleViewSummary} disabled={saving || !progress}>
            <BarChart3 size={14} /> View Summary
          </Btn>
          <Btn variant="primary" onClick={handleMarkAllComplete} disabled={saving || !progress || overallProgress === 100}>
            <CheckCircle2 size={14} /> Mark All Complete
          </Btn>
        </div>
      </div>

      {/* -- Search & Filters -- */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search steps... (press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]/20 focus:border-[var(--pro-azure)] transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">/</kbd>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategoryFilter(null)}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${
              !activeCategoryFilter
                ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)] dark:bg-green-950/30 dark:text-green-300 dark:border-green-800'
                : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setActiveCategoryFilter(activeCategoryFilter === key ? null : key)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
                activeCategoryFilter === key
                  ? `${meta.color}`
                  : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {meta.icon}
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* -- Progress overview -- */}
      <div className="ovds-widget-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Overall Progress</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">{overallProgress}%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Completed</p>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mt-0.5">{completedCount} / {steps.length} steps</p>
          </div>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${overallProgress}%`,
              background: overallProgress === 100 ? '#22c55e' : overallProgress >= 60 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>

        {/* Scope summary */}
        {progress?.scopeSummary && Object.keys(progress.scopeSummary).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Scope Summary</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(progress.scopeSummary).map(([scope, scopeSteps]) => (
                    <ContextPill key={scope} label={`${scope}: ${scopeSteps.length} step${scopeSteps.length === 1 ? '' : 's'}`} className="capitalize" />
              ))}
            </div>
          </div>
        )}

        {/* Module activities */}
        {progress?.moduleActivities && progress.moduleActivities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Recent Module Activities</p>
            <div className="space-y-1.5">
              {progress.moduleActivities.slice(-5).reverse().map((activity, i) => (
                <div key={i} className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-600 dark:text-slate-300 capitalize">{activity.moduleId}</span>
                  <span className="text-[10px] text-slate-400">{new Date(activity.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* -- Security Baseline -- */}
      <div className="ovds-widget-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-500/30">
              <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Security Baseline</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Roles, permissions and SoD guardrails</p>
            </div>
          </div>
          {canWrite && (
            <Btn variant="secondary" onClick={handleSeedRbac} disabled={seedingRbac}>
              {seedingRbac ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
              {seedingRbac ? 'Seeding...' : 'Initialize Baseline'}
            </Btn>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`rounded-xl border p-4 text-center ${complianceScore >= 80 ? 'bg-[var(--pro-azure-50)]/5 border-[var(--pro-azure)]/20' : complianceScore >= 50 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
            <div className={`text-2xl font-bold ${complianceScore >= 80 ? 'text-[var(--pro-azure-light)]' : complianceScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {complianceScore}/100
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Compliance Score</div>
            <div className="text-[9px] text-slate-400 mt-0.5">{complianceScore >= 80 ? 'COMPLIANT' : complianceScore >= 50 ? 'NEEDS REVIEW' : 'AT RISK'}</div>
          </div>
          <div className={`rounded-xl border p-4 text-center ${sodConflicts > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-[var(--pro-azure-50)]/5 border-[var(--pro-azure)]/20'}`}>
            <div className={`text-2xl font-bold ${sodConflicts > 0 ? 'text-rose-400' : 'text-[var(--pro-azure-light)]'}`}>{sodConflicts}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">SoD Conflicts</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Penalty: -{sodConflicts * 8} pts</div>
          </div>
          <div className={`rounded-xl border p-4 text-center ${highRiskRoles > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-[var(--pro-azure-50)]/5 border-[var(--pro-azure)]/20'}`}>
            <div className={`text-2xl font-bold ${highRiskRoles > 0 ? 'text-amber-400' : 'text-[var(--pro-azure-light)]'}`}>{highRiskRoles}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">High-Risk Roles</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Penalty: -{highRiskRoles * 4} pts</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Link to="/settings/roles" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">
            <Scale size={14} /> Review Roles & Permissions
          </Link>
          <Link to="/settings/security" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">
            <Shield size={14} /> Security Assessment
          </Link>
        </div>
      </div>

      {/* -- Category-based steps -- */}
      {Object.keys(filteredCategories).length === 0 ? (
        <div className="ovds-widget-card p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
            <Search size={20} className="text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No steps match your search</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredCategories).map(([category, categorySteps]) => {
          const meta = CATEGORY_META[category] || { label: category, icon: null, color: '' };
          const isExpanded = expandedCategories[category] !== false;
          const categoryCompleted = categorySteps.filter(s => stepStatusMap.get(s.key) === 'completed').length;
          const categoryProgress = categorySteps.length > 0 ? Math.round((categoryCompleted / categorySteps.length) * 100) : 0;

          return (
            <div key={category} className="ovds-widget-card overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{meta.label}</p>
                    <p className="text-[10px] text-slate-400">
                      {categoryCompleted} / {categorySteps.length} completed
                    </p>
                    <div className="mt-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden w-32">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${categoryProgress}%`,
                          background: categoryProgress === 100 ? '#22c55e' : categoryProgress >= 60 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">
                    {categorySteps.filter(s => stepStatusMap.get(s.key) === 'completed').length}/{categorySteps.length}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  {categorySteps.map((step, idx) => {
                    const status = stepStatusMap.get(step.key);
                    const isCompleted = status === 'completed';
                    const isSkipped = status === 'skipped';
                    const isAvailable = isStepAvailable(step);
                    const route = STEP_ROUTE_MAP[step.key];
                    const isLast = idx === categorySteps.length - 1;
                    const isActive = activeStep === step.key;

                    return (
                      <div
                        key={step.key}
                        className={`flex items-start gap-4 p-4 transition-colors ${
                          isLast ? '' : 'border-b border-slate-100 dark:border-slate-800'
                        } ${!isAvailable ? 'opacity-50' : ''} ${isActive ? 'bg-[var(--pro-azure-50)]/50 dark:bg-green-950/10' : ''}`}
                      >
                        {/* Status indicator */}
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-[var(--pro-azure)] text-white' :
                          isSkipped ? 'bg-slate-300 text-slate-500' :
                          isActive ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure)] ring-2 ring-[var(--pro-azure)] ring-offset-1' :
                          isAvailable ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-300'
                        }`}>
                          {isCompleted ? <CheckCircle2 size={12} /> :
                           isSkipped ? <AlertTriangle size={12} /> :
                           isActive ? <RefreshCw size={10} className="animate-spin" /> :
                           <Square size={10} />}
                        </div>

                        {/* Step content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className={`text-sm font-bold ${isCompleted ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] line-through' : 'text-slate-900 dark:text-white'}`}>
                                {step.label}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                  {step.description}
                                </p>
                                {getStepData(step.key) && Object.keys(getStepData(step.key) || {}).length > 0 && (
                                  <button
                                    onClick={() => toggleStepExpand(step.key)}
                                    className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                                    title={expandedSteps.has(step.key) ? 'Hide details' : 'Show details'}
                                  >
                                    {expandedSteps.has(step.key) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </button>
                                )}
                              </div>
                              {step.dependsOn && !isAvailable && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                  <AlertTriangle size={10} /> Requires "{stepMap.get(step.dependsOn)?.label || step.dependsOn}" to be completed first
                                </p>
                              )}
                              {step.isRequired && !isCompleted && !isSkipped && (
                                <span className="inline-block mt-1 text-[9px] font-bold text-rose-500 uppercase tracking-wider">Required</span>
                              )}
                              {validationErrors[step.key] && validationErrors[step.key].length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {validationErrors[step.key].map((err, i) => (
                                    <p key={i} className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1">
                                      <AlertTriangle size={10} /> {err}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {route && isAvailable && (
                                <Link
                                  to={route}
                                  onClick={() => setActiveStep(step.key)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline"
                                >
                                  Go <ArrowRight size={10} />
                                </Link>
                              )}
                              {canWrite && isAvailable && !isCompleted && (
                                <>
                                  {!step.isRequired && (
                                    <button
                                      onClick={() => handleSkip(step.key)}
                                      disabled={saving}
                                      className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg transition-colors"
                                    >
                                      Skip
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleComplete(step.key)}
                                    disabled={saving}
                                    className="px-3 py-1.5 text-[10px] font-bold text-white bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    Complete
                                  </button>
                                </>
                              )}
                              {(isCompleted || isSkipped) && canWrite && (
                                <button
                                  onClick={() => handleUndo(step.key)}
                                  disabled={saving}
                                  className="px-2 py-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 border border-amber-200 rounded-lg transition-colors inline-flex items-center gap-1"
                                  title="Revert to pending"
                                >
                                  <Undo2 size={10} /> Undo
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Step detail expansion */}
                          {expandedSteps.has(step.key) && (() => {
                            const stepData = getStepData(step.key);
                            if (!stepData || Object.keys(stepData).length === 0) return null;
                            return (
                              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Step Data</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(stepData).map(([key, value]) => (
                                    <div key={key} className="text-[11px]">
                                      <span className="text-slate-500 dark:text-slate-400">{key}: </span>
                                      <span className="text-slate-900 dark:text-white font-mono">{value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Step Data Collection Modal */}
      {modalStep && (() => {
        const fields = STEP_FIELDS[modalStep.key] || [];
        return (
          <Modal open={!!modalStep} onClose={closeStepModal} title={modalStep.label} width="max-w-md">
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">{modalStep.description}</p>
              {validationErrors[modalStep.key] && validationErrors[modalStep.key].length > 0 && (
                <div className="space-y-1">
                  {validationErrors[modalStep.key].map((err, i) => (
                    <p key={i} className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle size={10} /> {err}
                    </p>
                  ))}
                </div>
              )}
              <div className="space-y-3">
                {fields.map(field => (
                  <FormField key={field.key} label={field.label} required={field.required}>
                    {field.type === 'select' ? (
                      <Select
                        value={formData[field.key] || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e }))}
                        options={field.options || []}
                        placeholder={field.placeholder}
                      />
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        value={formData[field.key] || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                      />
                    )}
                  </FormField>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Btn variant="secondary" onClick={closeStepModal} disabled={saving}>Cancel</Btn>
                <Btn variant="primary" onClick={handleModalSubmit} disabled={saving}>
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {saving ? 'Saving...' : 'Complete Step'}
                </Btn>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Summary Modal */}
      {showSummary && progress && (
        <Modal open={showSummary} onClose={() => setShowSummary(false)} title="Setup Summary" width="max-w-2xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{overallProgress}%</p>
                <p className="text-xs text-slate-500">Overall Completion</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{completedCount} / {steps.length}</p>
                <p className="text-xs text-slate-500">Steps Completed</p>
              </div>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${overallProgress}%`,
                  background: overallProgress === 100 ? '#22c55e' : overallProgress >= 60 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>

            {/* Scope Summary */}
            {progress.scopeSummary && Object.keys(progress.scopeSummary).length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Scope Summary</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(progress.scopeSummary).map(([scope, scopeSteps]) => (
                    <ContextPill key={scope} label={`${scope}: ${scopeSteps.length} step${scopeSteps.length === 1 ? '' : 's'}`} className="capitalize" />
                  ))}
                </div>
              </div>
            )}

            {/* Module Activities */}
            {progress.moduleActivities && progress.moduleActivities.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Recent Module Activities</p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {progress.moduleActivities.slice().reverse().map((activity, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-300 capitalize">{activity.moduleId}</span>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">{new Date(activity.timestamp).toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400">{activity.action.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Production Readiness Checklist */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Production Readiness</p>
              <div className="space-y-2">
                {[
                  { label: 'Core company data configured', ok: !!legalName && legalName !== 'Your Company' },
                  { label: 'TIN & MoR credentials bound', ok: tin !== '—' },
                  { label: 'Business license registered', ok: licenseStatus !== 'UNKNOWN' },
                  { label: 'Financial parameters set', ok: true },
                  { label: 'Modules activated', ok: progress.steps.some(s => s.stepKey === 'module_selection' && s.status === 'completed') },
                  { label: 'Users provisioned', ok: totalUsers > 0 },
                  { label: 'Roles & permissions defined', ok: roleCount > 0 },
                  { label: 'System controls configured', ok: progress.steps.some(s => s.stepKey === 'control_node' && s.status === 'completed') },
                  { label: 'Notification channels active', ok: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-[12px]">
                    {item.ok ? (
                      <CheckCircle2 size={14} className="text-[var(--pro-azure)] shrink-0" />
                    ) : (
                      <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    )}
                    <span className={`font-medium ${item.ok ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Btn variant="secondary" onClick={() => setShowSummary(false)}>Close</Btn>
              {overallProgress === 100 && (
                <Link to="/control">
                  <Btn variant="primary" icon={<ArrowRight size={14} />}>
                    Go to Unified Control Node
                  </Btn>
                </Link>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SystemAdministrationSetup;
