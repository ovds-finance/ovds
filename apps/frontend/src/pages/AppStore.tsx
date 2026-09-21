import { useAppInstallations, moduleManagerApi } from '@ovds/features/appstore';
import type { ModuleDownloadJob } from '@ovds/features/appstore';
import { GridModuleCard, Modal, ModuleInstallationOverlay, SecuritySandbox } from '@ovds/ui';
import {
  Store, Star, Download, CheckCircle, Search, X, RefreshCw,
  Shield, Globe, Package, ArrowUpRight, Clock, Users,
  BookOpen, Banknote, Fingerprint, Smartphone, MessageSquare,
  Cpu, Calculator, Truck, MapPin, Warehouse,
  Building2, Award, Rocket, Cloud, Lock, Activity,
  Calendar, Link, Eye, Printer, Database,
  Code, ChevronRight, HelpCircle,
  ExternalLink, Plus, Check, Landmark,
  Layers, BarChart3, ShieldCheck, Boxes,
  LayoutGrid, List, TrendingUp, Zap, Tag, Settings2,
  Bell, FileText, Filter, ChevronDown, ArrowRight,
  Sparkles, Star as StarFill, Package2, Puzzle,
  AlertCircle, SlidersHorizontal, Save,
  Key, ServerCrash, CheckCircle2, Loader2, XCircle,
} from 'lucide-react';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

import { Can } from '../components/can';
import { useBusiness } from '../context/businessContext';
import { VatModuleProvider } from '../context/VatModuleContext';
import { useApiQuery, invalidateQueryPrefix } from '../hooks/useApiQuery';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import { apiPost } from '../services/api';



import VatModuleStoreEmbed   from './vat/VatModuleStore';



// ── Types ─────────────────────────────────────────────────────────────────────
interface _BackendApp {
  id: string; name: string; slug: string; version: string;
  developer: string; description?: string; iconUrl?: string;
  downloadUrl: string; rating: number; downloads: number;
  isActive: boolean; avgRating?: number; reviewCount?: number;
  createdAt: string;
}

interface CatalogApp {
  id: string; name: string; description: string; category: string;
  icon: React.ReactNode; iconBg: string; price: 'Free' | 'Pro' | 'Enterprise';
  rating: number; installs: number; version: string;
  latestVersion?: string; developer: string; tags: string[];
  trending?: boolean; isNew?: boolean; features: string[];
  compatibleWith?: string[];
  releaseDate?: string;
}

type TabType = 'store' | 'my-apps' | 'updates' | 'modules' | 'vat-modules' | 'guide';
type SortType = 'trending' | 'free' | 'paid' | 'rating' | 'newest';
type ViewMode = 'grid' | 'list';

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  'Security':          { color: '#0056D2', bg: '#EEF4FF',   icon: <Shield size={14} /> },
  'Utility':           { color: '#0891B2', bg: '#ECFEFF',   icon: <Settings2 size={14} /> },
  'Productivity':      { color: '#7C3AED', bg: '#F5F3FF',   icon: <Zap size={14} /> },
  'ovds':              { color: '#059669', bg: '#F0FDF4',   icon: <Banknote size={14} /> },
  'Payments':          { color: '#059669', bg: '#F0FDF4',   icon: <Landmark size={14} /> },
  'Accounting':        { color: '#0056D2', bg: '#EEF4FF',   icon: <BarChart3 size={14} /> },
  'HR & Payroll':      { color: '#7C3AED', bg: '#F5F3FF',   icon: <Users size={14} /> },
  'Tax & Compliance':  { color: '#D97706', bg: '#FFFBEB',   icon: <ShieldCheck size={14} /> },
  'CRM':               { color: '#DB2777', bg: '#FDF2F8',   icon: <MessageSquare size={14} /> },
  'Inventory':         { color: '#D97706', bg: '#FFFBEB',   icon: <Boxes size={14} /> },
  'Reports & Analytics':{ color: '#0056D2', bg: '#EEF4FF',  icon: <BarChart3 size={14} /> },
  'Communication':     { color: '#059669', bg: '#F0FDF4',   icon: <Bell size={14} /> },
  'UI Themes':         { color: '#6D28D9', bg: '#F5F3FF',   icon: <Layers size={14} /> },
  'AI & Automation':   { color: '#9D174D', bg: '#FDF2F8',   icon: <Sparkles size={14} /> },
};

const CATEGORIES = [
  'All', 'Security', 'Utility', 'Productivity', 'ovds', 'Payments',
  'Accounting', 'HR & Payroll', 'Tax & Compliance', 'CRM', 'Inventory',
  'Reports & Analytics', 'Communication', 'UI Themes', 'AI & Automation',
];

// ── Catalog data ───────────────────────────────────────────────────────────────
const CATALOG_APPS: CatalogApp[] = [
  {
    id: '2fa', name: '2FA — Two-Factor Authentication',
    description: 'Protect financial data with TOTP authenticator support, SMS fallback, and sensitive route enforcement.',
    category: 'Security', icon: <Lock size={20} />, iconBg: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
    price: 'Free', rating: 4.9, installs: 5200, version: '2.0.0',
    developer: 'OVDS Security', tags: ['security', '2fa', 'mfa', 'authentication'],
    releaseDate: '2024-01-10',
    features: ['TOTP authenticator support', 'SMS fallback', 'Sensitive route enforcement', 'Auth0 MFA integration'],
  },
  {
    id: 'address-finder', name: 'Address Finder',
    description: 'Auto-complete Ethiopian addresses on invoices and bills with Woreda/Kebele lookup.',
    category: 'Utility', icon: <MapPin size={20} />, iconBg: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
    price: 'Free', rating: 4.7, installs: 5200, version: '1.5.0',
    developer: 'OVDS Labs', tags: ['address', 'autocomplete', 'invoices', 'utility'],
    releaseDate: '2024-02-14',
    features: ['Ethiopian address database', 'Auto-complete on invoices', 'Auto-complete on bills', 'Woreda/Kebele lookup'],
  },
  {
    id: 'calendar', name: 'Calendar',
    description: 'Unified calendar for invoices, bills, payroll, and VAT deadlines including Ethiopian holidays.',
    category: 'Productivity', icon: <Calendar size={20} />, iconBg: 'bg-violet-50 text-violet-700',
    price: 'Free', rating: 4.5, installs: 3100, version: '1.2.0',
    developer: 'OVDS Labs', tags: ['calendar', 'schedule', 'invoices', 'payroll'],
    releaseDate: '2024-03-01',
    features: ['Invoice due dates', 'Bill payment dates', 'Payroll schedule', 'VAT filing deadlines', 'Ethiopian holidays'],
  },
  {
    id: 'live-currency', name: 'Live Currency',
    description: 'Real-time NBE exchange rates for multi-currency invoices with IAS 21 compliance.',
    category: 'ovds', icon: <Globe size={20} />, iconBg: 'bg-amber-50 text-amber-700',
    price: 'Free', rating: 4.6, installs: 2800, version: '1.3.0',
    developer: 'OVDS Labs', tags: ['currency', 'exchange-rate', 'forex', 'invoices'],
    releaseDate: '2024-03-20',
    features: ['Real-time NBE rates', 'Multi-currency invoices', 'ETB equivalent display', 'IAS 21 compliant'],
  },
  {
    id: 'telebirr-pay', name: 'Telebirr Payment Gateway',
    description: 'Accept Ethio Telecom telebirr payments directly on invoices with real-time QR confirmation.',
    category: 'Payments', icon: <Smartphone size={20} />, iconBg: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
    price: 'Free', rating: 4.8, installs: 1240, version: '2.1.0',
    developer: 'Ethio Telecom', tags: ['payments', 'telebirr', 'qr'], trending: true,
    releaseDate: '2024-04-05',
    features: ['QR code on invoices', 'Real-time payment confirmation', 'Circuit breaker protection', 'Receipt download'],
  },
  {
    id: 'cbe-reconcile', name: 'CBE Bank Reconciliation',
    description: 'Auto-import and reconcile Commercial Bank of Ethiopia statements using AI transaction matching.',
    category: 'Accounting', icon: <Landmark size={20} />, iconBg: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
    price: 'Free', rating: 4.7, installs: 980, version: '1.4.2',
    developer: 'OVDS Labs', tags: ['banking', 'reconciliation', 'cbe'], trending: true,
    releaseDate: '2024-04-18',
    features: ['Auto-import CSV statements', 'AI transaction matching', 'Unmatched item flagging', 'Bulk reconcile'],
  },
  {
    id: 'erca-etax', name: 'ERCA eTax Connector',
    description: 'Direct integration with ERCA eTax portal for VAT Form 1, BIT declarations, and WHT remittances.',
    category: 'Tax & Compliance', icon: <ShieldCheck size={20} />, iconBg: 'bg-orange-50 text-orange-700',
    price: 'Pro', rating: 4.9, installs: 2100, version: '3.0.1',
    developer: 'ERCA Digital', tags: ['vat', 'bit', 'erca', 'etax'],
    releaseDate: '2024-05-01',
    features: ['VAT Form 1 auto-fill', 'BIT declaration', 'WHT remittance', 'ERCA reference tracking'],
  },
  {
    id: 'payroll-pit', name: 'Advanced PIT Calculator',
    description: 'Ethiopian PIT brackets per Proclamation 1395/2025 with MAT, pension cap (ETB 15,000), and WHT.',
    category: 'HR & Payroll', icon: <Calculator size={20} />, iconBg: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
    price: 'Free', rating: 4.6, installs: 1560, version: '2.0.0',
    developer: 'OVDS Labs', tags: ['payroll', 'pit', 'pension', 'tax'],
    releaseDate: '2024-05-12',
    features: ['Updated 2025 brackets', 'MAT 2.5% calculation', 'Pension cap ETB 15,000', 'Bulk payslip export'],
  },
  {
    id: 'ifrs-reporter', name: 'IFRS Financial Reporter',
    description: 'Generate IFRS-compliant Balance Sheet, P&L, Cash Flow, and Notes from journal entries.',
    category: 'Reports & Analytics', icon: <BarChart3 size={20} />, iconBg: 'bg-violet-50 text-violet-700',
    price: 'Pro', rating: 4.8, installs: 870, version: '1.2.0',
    developer: 'OVDS Labs', tags: ['ifrs', 'reports', 'financial-statements'],
    isNew: true, releaseDate: '2025-01-15',
    features: ['Tier 1 & 2 support', 'Prior-year comparatives', 'AABE-compliant disclosures', 'PDF export'],
  },
  {
    id: 'drrf-auto', name: 'DRRF Auto-Generator',
    description: 'Automatic DRRF levy calculation and scheduling per MoR Regulation 570/2025.',
    category: 'Tax & Compliance', icon: <Shield size={20} />, iconBg: 'bg-rose-50 text-rose-700',
    price: 'Free', rating: 4.5, installs: 1100, version: '1.1.0',
    developer: 'OVDS Labs', tags: ['drrf', 'disaster-fund', 'levy'],
    releaseDate: '2025-02-01',
    features: ['17+ levy categories', 'Quarterly scheduling', 'CBE remittance tracking', 'Compliance score'],
  },
  {
    id: 'biometric-zktech', name: 'ZKTeco Biometric Bridge',
    description: 'Connect ZKTeco fingerprint devices for real-time attendance check-in/out with offline queue.',
    category: 'HR & Payroll', icon: <Fingerprint size={20} />, iconBg: 'bg-slate-100 text-slate-700',
    price: 'Enterprise', rating: 4.4, installs: 430, version: '1.0.3',
    developer: 'ZKTeco Ethiopia', tags: ['biometric', 'attendance', 'zktech'],
    releaseDate: '2024-09-10',
    features: ['1:N fingerprint matching', 'Real-time sync', 'Geo-fence integration', 'Offline queue'],
  },
  {
    id: 'slack-alerts', name: 'Slack Alerts',
    description: 'Push OVDS notifications to Slack channels for payroll, invoices, and VAT deadlines.',
    category: 'Communication', icon: <MessageSquare size={20} />, iconBg: 'bg-yellow-50 text-yellow-700',
    price: 'Free', rating: 4.7, installs: 760, version: '1.3.0',
    developer: 'OVDS Labs', tags: ['slack', 'notifications', 'alerts'],
    releaseDate: '2024-06-22',
    features: ['Webhook integration', 'Custom channels', 'Alert filtering', 'Test message'],
  },
  {
    id: 'inventory-reorder', name: 'Smart Inventory Reorder',
    description: 'AI-powered reorder alerts and automatic purchase order generation when stock hits reorder level.',
    category: 'Inventory', icon: <Boxes size={20} />, iconBg: 'bg-amber-50 text-amber-700',
    price: 'Pro', rating: 4.3, installs: 320, version: '1.0.1',
    developer: 'OVDS Labs', tags: ['inventory', 'reorder', 'ai'],
    isNew: true, releaseDate: '2025-03-01',
    features: ['Reorder level alerts', 'Auto PO generation', 'Supplier suggestion', 'Stock forecast'],
  },
  {
    id: 'crm-whatsapp', name: 'WhatsApp CRM Bridge',
    description: 'Send invoices, payment reminders, and receipts via WhatsApp Business API.',
    category: 'CRM', icon: <Smartphone size={20} />, iconBg: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
    price: 'Pro', rating: 4.6, installs: 540, version: '2.0.0',
    developer: 'OVDS Labs', tags: ['whatsapp', 'crm', 'invoices'],
    isNew: true, releaseDate: '2025-02-15',
    features: ['Invoice delivery via WhatsApp', 'Payment reminders', 'Receipt sharing', 'Customer replies'],
  },
  {
    id: 'ocr-bank', name: 'Bank Statement OCR',
    description: 'Extract transactions from CBE, Awash, Dashen, and Abyssinia statements using GPT-4o.',
    category: 'Accounting', icon: <Eye size={20} />, iconBg: 'bg-cyan-50 text-cyan-700',
    price: 'Pro', rating: 4.5, installs: 680, version: '1.2.0',
    developer: 'OVDS Labs', tags: ['ocr', 'bank', 'ai', 'reconciliation'],
    releaseDate: '2024-08-05',
    features: ['GPT-4o extraction', 'Gemini fallback', 'Ethiopian bank support', 'Confidence scoring'],
  },
  {
    id: 'multi-currency', name: 'Multi-Currency Manager',
    description: 'Live NBE exchange rates, IAS 21 FX revaluation, and multi-currency invoice support.',
    category: 'ovds', icon: <Globe size={20} />, iconBg: 'bg-teal-50 text-teal-700',
    price: 'Pro', rating: 4.4, installs: 290, version: '1.0.0',
    developer: 'OVDS Labs', tags: ['currency', 'fx', 'ias21'],
    isNew: true, releaseDate: '2025-03-20',
    features: ['Live NBE rates', 'IAS 21 revaluation', 'FX gain/loss journal', 'Multi-currency invoices'],
  },
  {
    id: 'theme-dark-pro', name: 'Dark Pro Theme',
    description: 'High-contrast dark theme optimised for long bookkeeping sessions with deep-slate UI and indigo accents.',
    category: 'UI Themes', icon: <Layers size={20} />, iconBg: 'bg-slate-100 text-slate-800',
    price: 'Free', rating: 4.8, installs: 3400, version: '2.1.0',
    developer: 'OVDS Design', tags: ['theme', 'dark-mode', 'ui', 'accessibility'],
    releaseDate: '2024-03-10',
    features: ['Deep-slate palette', 'indigo accent system', 'Reduced eye strain', 'Persists across sessions'],
  },
  {
    id: 'theme-compact', name: 'Compact Grid Theme',
    description: 'Maximise information density with tighter grid, smaller cards, and reduced padding.',
    category: 'UI Themes', icon: <LayoutGrid size={20} />, iconBg: 'bg-sky-50 text-sky-700',
    price: 'Free', rating: 4.6, installs: 1870, version: '1.3.0',
    developer: 'OVDS Design', tags: ['theme', 'compact', 'grid', 'density'],
    releaseDate: '2024-04-01',
    features: ['Condensed card padding', 'Tighter typography scale', 'Smaller sidebar icons', 'More rows per viewport'],
  },
  {
    id: 'theme-brand-kit', name: 'Brand Kit Module',
    description: 'Upload your logo, set primary/accent colors, and override font families to white-label OVDS for your business.',
    category: 'UI Themes', icon: <Award size={20} />, iconBg: 'bg-violet-50 text-violet-700',
    price: 'Pro', rating: 4.9, installs: 760, version: '1.0.2',
    developer: 'OVDS Design', tags: ['white-label', 'branding', 'theme', 'customization'],
    releaseDate: '2024-07-15',
    features: ['Logo upload & placement', 'CSS variable overrides', 'Custom font injection', 'Favicon management'],
  },
  {
    id: 'open-source-sdk', name: 'Developer SDK & Module Starter',
    description: 'Scaffold new OVDS modules with the official React + TypeScript starter, @ovds/ui, and hot-reload dev server.',
    category: 'UI Themes', icon: <Code size={20} />, iconBg: 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]',
    price: 'Free', rating: 4.7, installs: 980, version: '3.0.0',
    developer: 'OVDS Open Source', tags: ['open-source', 'sdk', 'react', 'typescript', 'module'],
    isNew: true, releaseDate: '2025-01-20',
    features: ['@ovds/ui component library', 'Routing & auth hooks', 'Hot-reload dev server', 'NX monorepo compatible'],
  },
];

// ── Star Rating ────────────────────────────────────────────────────────────────
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 11 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={size}
        className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'} />
    ))}
  </div>
);

// ── Price badge ────────────────────────────────────────────────────────────────
const PriceBadge: React.FC<{ price: CatalogApp['price'] }> = ({ price }) => {
  const map = {
    Free:       'aki-badge solid-success pill sm',
    Pro:        'aki-badge solid-info pill sm',
    Enterprise: 'aki-badge solid-purple pill sm',
  } as const;
  return <span className={map[price]}>{price}</span>;
};

// ── Category pill ──────────────────────────────────────────────────────────────
const CategoryPill: React.FC<{ category: string; small?: boolean }> = ({ category, small }) => {
  const meta = CATEGORY_META[category];
  if (!meta) return <span className={`aki-badge solid-default pill${small ? ' sm' : ''}`}>{category}</span>;
  return (
    <span
      className={`aki-badge pill${small ? ' sm' : ''}`}
      style={{ background: meta.bg, color: meta.color, borderColor: meta.bg }}
    >
      {small ? null : <span className="opacity-70">{meta.icon}</span>}
      {category}
    </span>
  );
};

// ── Install button ─────────────────────────────────────────────────────────────
const InstallBtn: React.FC<{
  app: CatalogApp; installed: boolean; installing: boolean;
  onInstall: () => void; onUninstall: () => void; compact?: boolean;
}> = ({ app, installed, installing, onInstall, onUninstall, compact }) => {
  if (installed) {
    return (
      <button
        onClick={onUninstall}
        className={`aki-btn aki-btn-secondary${compact ? ' sm' : ''}`}
        style={{ minWidth: compact ? 80 : 100 }}
      >
        <Check size={compact ? 11 : 12} className="text-[var(--pro-azure)]" />
        Installed
      </button>
    );
  }
  return (
    <button
      onClick={onInstall}
      disabled={installing}
      className={`aki-btn aki-btn-primary${compact ? ' sm' : ''}`}
      style={{ minWidth: compact ? 80 : 100 }}
    >
      {installing ? (
        <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      ) : (
        <Download size={compact ? 11 : 12} />
      )}
      {installing ? 'Installing…' : app.price === 'Free' ? 'Install' : `Get ${app.price}`}
    </button>
  );
};

// ── Download Progress Banner ──────────────────────────────────────────────────
/**
 * Renders a sticky live-progress strip at the top of the store for every
 * active download job. Each job shows a labelled progress bar, status text,
 * and a cancel button (if still downloadable).
 */
const JOB_STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:     { label: 'Pending',      color: 'bg-slate-300',                          icon: <Clock size={11} className="text-slate-400" /> },
  DOWNLOADING: { label: 'Downloading',  color: 'bg-[var(--pro-azure)]',                icon: <Download size={11} className="text-[var(--pro-azure-light)] animate-bounce" /> },
  EXTRACTING:  { label: 'Extracting',   color: 'bg-amber-400',                          icon: <Loader2 size={11} className="text-amber-600 animate-spin" /> },
  ACTIVATING:  { label: 'Activating',   color: 'bg-violet-400',                         icon: <Zap size={11} className="text-violet-600 animate-pulse" /> },
  DONE:        { label: 'Installed',    color: 'bg-[var(--pro-azure)]',                icon: <CheckCircle2 size={11} className="text-[var(--pro-azure)]" /> },
  FAILED:      { label: 'Failed',       color: 'bg-rose-400',                           icon: <XCircle size={11} className="text-rose-500" /> },
  CANCELLED:   { label: 'Cancelled',    color: 'bg-slate-300',                          icon: <X size={11} className="text-slate-400" /> },
};

const DownloadProgressBanner: React.FC<{
  jobs: Map<string, ModuleDownloadJob>;
  onCancel: (jobId: string) => void;
  onDismiss: (alias: string) => void;
}> = ({ jobs, onCancel, onDismiss }) => {
  if (jobs.size === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {Array.from(jobs.entries()).map(([alias, job]) => {
        const meta = JOB_STATUS_META[job.status] ?? JOB_STATUS_META['PENDING'];
        const isTerminal = ['DONE', 'FAILED', 'CANCELLED'].includes(job.status);
        const isCancellable = ['PENDING', 'DOWNLOADING'].includes(job.status);

        return (
          <div
            key={alias}
            className={`aki-card flush ${job.status === 'FAILED' ? 'border-rose-200 dark:border-rose-800/40' : job.status === 'DONE' ? 'border-[var(--pro-azure-100)] dark:border-green-800/40' : 'border-slate-200 dark:border-slate-700'}`}
            style={{ padding: '10px 14px' }}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                job.status === 'DONE'   ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30' :
                job.status === 'FAILED' ? 'bg-rose-50 dark:bg-rose-950/20' :
                'bg-slate-50 dark:bg-slate-800'
              }`}>
                {meta.icon}
              </div>

              {/* Info + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {alias}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`aki-badge pill sm ${
                      job.status === 'DONE'   ? 'solid-success' :
                      job.status === 'FAILED' ? 'solid-danger'  :
                      job.deploymentType === 'ON_PREMISE' ? 'solid-info' : 'solid-purple'
                    }`}>
                      {job.deploymentType === 'ON_PREMISE' ? 'On-Premise' : 'Cloud'}
                    </span>
                    <span className="text-[11px] text-slate-400">{meta.label}</span>
                    {!isTerminal && (
                      <span className="text-[11px] font-bold text-slate-500 font-mono tabular-nums w-7 text-right">
                        {job.progress}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar (hidden for terminal states) */}
                {!isTerminal && (
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${meta.color}`}
                      style={{ width: `${Math.max(3, job.progress)}%` }}
                    />
                  </div>
                )}

                {/* Status message */}
                {job.message && (
                  <p className={`text-[10px] mt-1 truncate ${
                    job.status === 'FAILED' ? 'text-rose-500' :
                    job.status === 'DONE'   ? 'text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]' :
                    'text-slate-400'
                  }`}>
                    {job.message}
                    {job.targetPath && job.status === 'DONE' && (
                      <span className="ml-1 font-mono opacity-70">→ {job.targetPath}</span>
                    )}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isCancellable && (
                  <button
                    onClick={() => onCancel(job.jobId)}
                    className="aki-btn aki-btn-secondary icon-only sm"
                    aria-label="Cancel download"
                    title="Cancel download"
                  >
                    <X size={11} />
                  </button>
                )}
                {isTerminal && (
                  <button
                    onClick={() => onDismiss(alias)}
                    className="aki-btn aki-btn-secondary icon-only sm"
                    aria-label="Dismiss"
                    title="Dismiss"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── API Key Modal (on-premises installs) ──────────────────────────────────────
/**
 * On-premises installs require the user to supply their OVDS Marketplace
 * API key. This modal collects it before the download begins.
 */
const ApiKeyModal: React.FC<{
  app: CatalogApp;
  onConfirm: (apiKey: string) => void;
  onClose: () => void;
}> = ({ app, onConfirm, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) { setError('API key is required'); return; }
    onConfirm(apiKey.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4"
        style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${app.iconBg}`}>
            {app.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
              On-Premises Installation
            </h2>
            <p className="text-[12px] text-slate-400 mt-0.5">{app.name}</p>
          </div>
          <button onClick={onClose} className="aki-btn aki-btn-secondary icon-only sm shrink-0" aria-label="Close">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Info callout */}
          <div className="flex gap-3 p-3.5 rounded-xl bg-[var(--pro-azure-50)] dark:bg-blue-950/20 border border-[var(--pro-azure-100)] dark:border-blue-800/40">
            <ServerCrash size={15} className="text-[var(--pro-azure)] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[var(--pro-azure-dark)] dark:text-blue-200 leading-relaxed">
              The OVDS backend will stream the module ZIP directly to your server and extract it to{' '}
              <code className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1 rounded">
                OVDS_MODULES_PATH/{app.id}/
              </code>
              . No browser download required.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Key size={10} /> OVDS Marketplace API Key
            </label>
            <input
              ref={inputRef}
              type="password"
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setError(''); }}
              placeholder="ovds_live_xxxxxxxxxxxxxxxxxxxxxxxx"
              className="aki-input w-full font-mono text-[13px]"
              autoComplete="off"
            />
            {error && <p className="text-[11px] text-rose-500">{error}</p>}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Get your key from{' '}
              <a
                href="https://marketplace.ovds.com.et/settings/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--pro-azure)] hover:underline inline-flex items-center gap-0.5"
              >
                marketplace.ovds.com.et <ExternalLink size={9} />
              </a>
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={onClose} className="aki-btn aki-btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="aki-btn aki-btn-primary flex-1">
              <Download size={13} /> Start Download
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── App List Row ───────────────────────────────────────────────────────────────
const AppListRow: React.FC<{
  app: CatalogApp; installed: boolean; installing: boolean;
  onSelect: () => void; onInstall: () => void; onUninstall: () => void;
}> = ({ app, installed, installing, onSelect, onInstall, onUninstall }) => (
  <div className="aki-card flush group hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
    onClick={onSelect}
    style={{ padding: '12px 16px' }}
  >
    <div className="flex items-center gap-4">
      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${app.iconBg}`}>
        {app.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="ovds-card-title truncate">{app.name}</span>
          {app.isNew && <span className="aki-badge solid-success pill sm">New</span>}
          {app.trending && <span className="aki-badge solid-amber pill sm">Trending</span>}
        </div>
        <p className="ovds-body text-[12px] line-clamp-1 mt-0.5">{app.description}</p>
      </div>

      {/* Meta */}
      <div className="hidden md:flex items-center gap-5 shrink-0">
        <div className="text-right">
          <CategoryPill category={app.category} small />
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 w-24 justify-end">
          <StarRating rating={app.rating} />
          <span className="font-semibold text-slate-500 dark:text-slate-400 ml-1">{app.rating.toFixed(1)}</span>
        </div>
        <div className="text-[11px] text-slate-400 w-20 text-right">
          {app.installs >= 1000
            ? `${(app.installs / 1000).toFixed(1)}k`
            : app.installs.toLocaleString()}{' '}
          installs
        </div>
        <div className="w-28 flex justify-end" onClick={e => e.stopPropagation()}>
          <InstallBtn
            app={app} installed={installed} installing={installing}
            onInstall={onInstall} onUninstall={onUninstall} compact
          />
        </div>
      </div>

      {/* Mobile: price + install */}
      <div className="flex md:hidden items-center gap-2" onClick={e => e.stopPropagation()}>
        <PriceBadge price={app.price} />
        <InstallBtn
          app={app} installed={installed} installing={installing}
          onInstall={onInstall} onUninstall={onUninstall} compact
        />
      </div>
    </div>
  </div>
);

// ── App Grid Card ──────────────────────────────────────────────────────────────
const AppGridCard: React.FC<{
  app: CatalogApp; installed: boolean; installing: boolean;
  onSelect: () => void; onInstall: () => void; onUninstall: () => void;
}> = ({ app, installed, installing, onSelect, onInstall, onUninstall }) => (
  <div
    className="aki-card group hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-sm cursor-pointer"
    style={{ gap: 0 }}
    onClick={onSelect}
  >
    {/* Header */}
    <div className="flex items-start justify-between mb-3" style={{ padding: '16px 16px 0' }}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${app.iconBg}`}>
        {app.icon}
      </div>
      <div className="flex items-center gap-1.5">
        {app.isNew && <span className="aki-badge solid-success pill sm">New</span>}
        {app.trending && <span className="aki-badge solid-amber pill sm">Trending</span>}
        <PriceBadge price={app.price} />
      </div>
    </div>

    {/* Body */}
    <div className="flex-1" style={{ padding: '10px 16px 0' }}>
      <h3 className="ovds-card-title mb-1 line-clamp-1">{app.name}</h3>
      <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
        {app.description}
      </p>
      <div className="flex items-center gap-2 mb-4">
        <CategoryPill category={app.category} small />
        <span className="text-[10px] text-slate-400">{app.developer}</span>
      </div>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800"
      style={{ padding: '10px 16px' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5">
        <StarRating rating={app.rating} />
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{app.rating.toFixed(1)}</span>
        <span className="text-[10px] text-slate-400">
          · {app.installs >= 1000 ? `${(app.installs / 1000).toFixed(1)}k` : app.installs}
        </span>
      </div>
      <InstallBtn
        app={app} installed={installed} installing={installing}
        onInstall={onInstall} onUninstall={onUninstall} compact
      />
    </div>
  </div>
);

// ── App Detail Drawer ──────────────────────────────────────────────────────────
const AppDetailDrawer: React.FC<{
  app: CatalogApp; installed: boolean; installing: boolean;
  onClose: () => void; onInstall: () => void; onUninstall: () => void;
}> = ({ app, installed, installing, onClose, onInstall, onUninstall }) => {
  const [detailTab, setDetailTab] = useState<'overview' | 'reviews'>('overview');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => { drawerRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost('/apps/review', { appId: app.id, userId: user?.id, rating: reviewRating, comment: reviewComment });
      toast.success('Review submitted');
      setReviewComment('');
      invalidateQueryPrefix('/apps');
    } catch { toast.error('Failed to submit review'); }
    finally { setSubmitting(false); }
  };

  const DETAIL_TABS = [{ id: 'overview', label: 'Overview' }, { id: 'reviews', label: 'Reviews' }] as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 w-full sm:max-w-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col outline-none"
        style={{
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${app.iconBg}`}>
            {app.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {app.name}
                </h2>
                <p className="text-[12px] text-slate-400 mt-0.5">by {app.developer} · v{app.version}</p>
              </div>
              <button
                onClick={onClose}
                className="aki-btn aki-btn-secondary icon-only sm shrink-0"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="flex items-center gap-1">
                <StarRating rating={app.rating} size={12} />
                <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 ml-0.5">
                  {app.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {app.installs.toLocaleString()} installs
              </span>
              <PriceBadge price={app.price} />
              <CategoryPill category={app.category} small />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ovds-tab-nav px-6" style={{ borderBottom: '1px solid var(--border-alt)' }}>
          {DETAIL_TABS.map(t => (
            <button key={t.id} onClick={() => setDetailTab(t.id)}
              className={`ovds-tab ${detailTab === t.id ? 'active' : ''}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {detailTab === 'overview' && (
            <div className="space-y-5">
              <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {app.description}
              </p>
              <div>
                <p className="text-label mb-3">Features</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {app.features.map(f => (
                    <div key={f} className="flex items-start gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                      <Check size={13} className="text-[var(--pro-azure)] mt-0.5 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
              {app.tags.length > 0 && (
                <div>
                  <p className="text-label mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.tags.map(t => (
                      <span key={t} className="aki-badge solid-default pill sm">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {app.releaseDate && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock size={11} />
                  Released {new Date(app.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>
          )}

          {detailTab === 'reviews' && (
            <form onSubmit={handleReview} className="space-y-4">
              <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Write a Review</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} type="button" onClick={() => setReviewRating(i)}>
                    <Star size={22}
                      className={i <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience…"
                rows={4}
                className="aki-textarea"
              />
              <button type="submit" disabled={submitting} className="aki-btn aki-btn-primary sm">
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          {installed ? (
            <>
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]">
                <Check size={15} /> Installed
              </div>
              <button onClick={onUninstall}
                className="ml-auto aki-btn aki-btn-danger sm">
                Uninstall
              </button>
            </>
          ) : (
            <button
              onClick={() => { onInstall(); onClose(); }}
              disabled={installing}
              className="flex-1 aki-btn aki-btn-primary"
            >
              {installing
                ? <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Download size={14} />
              }
              {installing ? 'Installing…' : app.price === 'Free' ? 'Install Free' : `Get ${app.price}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Featured strip ─────────────────────────────────────────────────────────────
const FeaturedStrip: React.FC<{
  apps: CatalogApp[]; installedIds: Set<string>; installing: string | null;
  onSelect: (a: CatalogApp) => void; onInstall: (id: string) => void;
}> = ({ apps, installedIds, installing, onSelect, onInstall }) => {
  const featured = apps.filter(a => a.trending).slice(0, 3);
  if (!featured.length) return null;
  return (
    <div>
      <div className="ovds-section-title-row">
        <p className="text-label">Featured this week</p>
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <TrendingUp size={11} /> Hand-picked
        </span>
      </div>
      <div className="ovds-grid-layout cols-3 gap-sm">
        {featured.map(app => {
          const isInstalled = installedIds.has(app.id);
          return (
            <div
              key={app.id}
              className="aki-card group cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%)', borderColor: 'var(--border)', gap: 0 }}
              onClick={() => onSelect(app)}
            >
              <div className="flex items-start gap-3" style={{ padding: '14px 14px 12px' }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${app.iconBg}`}>
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="ovds-card-title text-[13px] line-clamp-1 group-hover:text-[var(--pro-azure)] transition-colors">
                    {app.name}
                  </h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <StarRating rating={app.rating} size={10} />
                    <span className="text-[10px] font-semibold text-slate-400">{app.rating.toFixed(1)}</span>
                  </div>
                </div>
                <PriceBadge price={app.price} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2"
                style={{ padding: '0 14px 10px' }}>
                {app.description}
              </p>
              <div className="border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
                style={{ padding: '10px 14px' }}
                onClick={e => e.stopPropagation()}
              >
                <span className="text-[10px] text-slate-400">
                  {app.installs.toLocaleString()} installs
                </span>
                <InstallBtn
                  app={app} installed={isInstalled} installing={installing === app.id}
                  onInstall={() => onInstall(app.id)} onUninstall={() => {}} compact
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Stats row ──────────────────────────────────────────────────────────────────
const StoreStats: React.FC<{ total: number; installed: number; free: number }> = ({ total, installed, free }) => (
  <div className="aki-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
    {[
      { label: 'Total Apps', value: total, icon: <Package2 size={14} className="text-[var(--pro-azure)]" /> },
      { label: 'Free', value: free, icon: <Tag size={14} className="text-[var(--pro-azure)]" /> },
      { label: 'Installed', value: installed, icon: <Check size={14} className="text-[var(--pro-azure)]" /> },
      { label: 'Categories', value: CATEGORIES.length - 1, icon: <Puzzle size={14} className="text-violet-500" /> },
    ].map(s => (
      <div key={s.label} className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
          {s.icon}
        </div>
        <div>
          <div className="text-[18px] font-bold text-slate-800 dark:text-slate-100 leading-none font-mono tabular-nums">
            {s.value}
          </div>
          <div className="text-label mt-0.5">{s.label}</div>
        </div>
      </div>
    ))}
  </div>
);

// ── Category sidebar ───────────────────────────────────────────────────────────
const CategorySidebar: React.FC<{
  apps: CatalogApp[]; active: string; onChange: (c: string) => void;
}> = ({ apps, active, onChange }) => {
  const counts = useMemo(() => {
    const m: Record<string, number> = { All: apps.length };
    apps.forEach(a => { m[a.category] = (m[a.category] || 0) + 1; });
    return m;
  }, [apps]);

  return (
    <div className="aki-card" style={{ padding: '12px 8px', gap: 4 }}>
      <p className="text-label px-3 pb-2">Categories</p>
      {CATEGORIES.map(cat => {
        const isActive = active === cat;
        const meta = CATEGORY_META[cat];
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={[
              'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all text-left',
              isActive
                ? 'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)]'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50',
            ].join(' ')}
          >
            <span className="flex items-center gap-2 truncate">
              {meta ? (
                <span style={{ color: isActive ? meta.color : undefined }} className={isActive ? '' : 'text-slate-400'}>
                  {meta.icon}
                </span>
              ) : null}
              {cat}
            </span>
            <span className={[
              'text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0',
              isActive ? 'bg-[var(--pro-azure-50)] dark:bg-blue-900 text-[var(--pro-azure-dark)]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500',
            ].join(' ')}>
              {counts[cat] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ── Developer Guide ────────────────────────────────────────────────────────────
const DeveloperGuide: React.FC<{
  allApps: CatalogApp[]; setCategory: (c: string) => void; setTab: (t: TabType) => void;
}> = ({ allApps, setCategory, setTab }) => {
  const steps = [
    { icon: <Search size={16} />, title: 'Browse the Store', desc: 'Explore 20+ integrations across payments, tax, HR, and accounting.' },
    { icon: <Download size={16} />, title: 'Install an App', desc: 'Click Install on any free app. Pro/Enterprise apps require an active subscription.' },
    { icon: <Settings2 size={16} />, title: 'Configure', desc: 'Each app has its own settings panel. Find it in Settings → Integrations after install.' },
    { icon: <Activity size={16} />, title: 'Monitor', desc: 'Track app health and usage from the My Apps tab.' },
  ];
  const faqs = [
    { q: 'Are free apps really free?', a: 'Yes — free apps have no hidden costs. Pro and Enterprise apps require an active OVDS subscription tier.' },
    { q: 'Can I uninstall an app?', a: 'Yes. Go to My Apps → click Uninstall. Your data is preserved; only the integration is removed.' },
    { q: 'How do I build a custom integration?', a: 'Use the OVDS REST API documented at /api/docs. All endpoints support Bearer JWT authentication.' },
    { q: 'What is the OVDS API rate limit?', a: 'Global: 600 requests/minute per IP. Auth endpoints: 10/min (login), 5/min (signup).' },
    { q: 'How do I report a bug in an app?', a: 'Open the app detail and use "Report Issue", or email support@ovds.com.et.' },
  ];
  const categories = Array.from(new Set(allApps.map(a => a.category)));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="aki-card" style={{ background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', borderColor: '#BBF7D0' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--pro-azure-100)] flex items-center justify-center shrink-0 shadow-sm">
            <BookOpen size={20} className="text-[var(--pro-azure)]" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-slate-800 dark:text-slate-100">Developer & Integration Guide</h2>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
              Everything you need to install, configure, and build on top of OVDS integrations.
            </p>
            <div className="flex gap-2 mt-3">
              <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="aki-btn aki-btn-primary sm">
                <ExternalLink size={11} /> API Docs
              </a>
              <button onClick={() => setTab('store')} className="aki-btn aki-btn-secondary sm">
                <Store size={11} /> Browse Apps
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Getting started */}
      <div>
        <p className="text-label mb-4">Getting started</p>
        <div className="ovds-grid-layout cols-4 gap-sm">
          {steps.map((s, i) => (
            <div key={i} className="aki-card" style={{ gap: 8 }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--pro-azure-50)] flex items-center justify-center text-[var(--pro-azure)] shrink-0">
                  {s.icon}
                </div>
                <span className="text-label">Step {i + 1}</span>
              </div>
              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{s.title}</p>
              <p className="ovds-body text-[12px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Browse by category */}
      <div>
        <p className="text-label mb-4">Browse by category</p>
        <div className="ovds-grid-layout cols-4 gap-sm">
          {categories.map(cat => {
            const count = allApps.filter(a => a.category === cat).length;
            const meta = CATEGORY_META[cat];
            return (
              <button key={cat}
                onClick={() => { setCategory(cat); setTab('store'); }}
                className="aki-card text-left group hover:border-[var(--pro-azure-100)] dark:hover:border-blue-900 transition-all"
                style={{ gap: 6, cursor: 'pointer' }}
              >
                {meta && (
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ background: meta.bg, color: meta.color }}>
                    {meta.icon}
                  </span>
                )}
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[var(--pro-azure)] transition-colors">
                  {cat}
                </p>
                <p className="text-[11px] text-slate-400">{count} app{count !== 1 ? 's' : ''}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* API Quick Reference */}
      <div>
        <p className="text-label mb-4">API quick reference</p>
        <div className="aki-card flush overflow-hidden">
          {[
            { method: 'POST', path: '/api/auth/login', desc: 'Obtain JWT token' },
            { method: 'GET',  path: '/api/invoices',   desc: 'List invoices (requires companyId)' },
            { method: 'POST', path: '/api/invoices',   desc: 'Create invoice' },
            { method: 'GET',  path: '/api/employees',  desc: 'List employees' },
            { method: 'GET',  path: '/api/ovds/accounts', desc: 'Chart of accounts' },
            { method: 'POST', path: '/api/onboarding', desc: 'Submit onboarding (public)' },
          ].map((row, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}>
              <span className={`aki-badge pill sm ${row.method === 'GET' ? 'solid-success' : 'solid-info'}`}>
                {row.method}
              </span>
              <code className="text-[12px] font-mono text-slate-700 dark:text-slate-300 flex-1">{row.path}</code>
              <span className="text-[11px] text-slate-400 hidden sm:block">{row.desc}</span>
            </div>
          ))}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <a href="/api/docs" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--pro-azure)] hover:underline">
              <ExternalLink size={11} /> View full API documentation
            </a>
          </div>
        </div>
      </div>

      {/* Open Source section */}
      <div>
        <p className="text-label mb-4">Open source & customization</p>
        <div className="aki-card" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--pro-azure-100)] border border-[var(--pro-azure-100)] flex items-center justify-center shrink-0">
              <Code size={18} className="text-[var(--pro-azure-dark)]" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-800">React / TypeScript Module System</p>
              <p className="text-[12px] text-slate-600 mt-1 leading-relaxed max-w-lg">
                OVDS is open-source. Every component, CSS variable, and page template lives in the public{' '}
                <code className="px-1 py-0.5 bg-white rounded text-[11px] font-mono border border-[var(--pro-azure-100)]">@ovds/ui</code>
                {' '}and{' '}
                <code className="px-1 py-0.5 bg-white rounded text-[11px] font-mono border border-[var(--pro-azure-100)]">@ovds/shared</code>
                {' '}packages — ready to fork, extend, or replace.
              </p>
            </div>
          </div>
          <div className="ovds-grid-layout cols-3 gap-sm mt-1">
            {[
              { icon: <Layers size={14} />, title: 'CSS Variable Tokens', desc: 'Override colors, spacing, and radius in globals.css without touching component code.' },
              { icon: <Package size={14} />, title: 'Component Overrides', desc: 'Swap any @ovds/ui component by publishing a local package with the same export name.' },
              { icon: <Rocket size={14} />, title: 'Module Starter Kit', desc: 'Use the Developer SDK app to scaffold a new module with routing, auth hooks, and hot-reload.' },
            ].map((item, i) => (
              <div key={i} className="aki-card" style={{ background: 'white', borderColor: '#BBF7D0', gap: 6 }}>
                <span className="text-[var(--pro-azure)]">{item.icon}</span>
                <p className="text-[12px] font-semibold text-slate-700">{item.title}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setCategory('UI Themes'); setTab('store'); }}
              className="aki-btn aki-btn-success sm">
              <Layers size={11} /> Browse UI Themes
            </button>
            <a href="https://github.com/ovds-ovds" target="_blank" rel="noopener noreferrer"
              className="aki-btn aki-btn-secondary sm">
              <ExternalLink size={11} /> GitHub
            </a>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <p className="text-label mb-4">Frequently asked questions</p>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <details key={i} className="aki-card group" style={{ gap: 0, padding: 0 }}>
              <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none select-none">
                <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">{faq.q}</span>
                <ChevronRight size={14} className="text-slate-400 group-open:rotate-90 transition-transform shrink-0" />
              </summary>
              <div className="px-4 pb-4 pt-2 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main AppStore Page ─────────────────────────────────────────────────────────
const AppStore: React.FC = () => {
  usePageTitle('App Store');
  const { can, user } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const canWrite = can('apps:write');

  // State
  const [tab, setTab] = useState<TabType>('store');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortType>('trending');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedApp, setSelectedApp] = useState<CatalogApp | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [_installError, setInstallError] = useState<string | undefined>(undefined);
  // State for the on-premises API key modal
  const [apiKeyTargetApp, setApiKeyTargetApp] = useState<CatalogApp | null>(null);
  // Dismissed terminal job aliases (so the banner clears after user acknowledges)
  const [dismissedJobs, setDismissedJobs] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Real persisted installation state from backend ─────────────────────────
  const {
    installedIds,
    updatesAvailable: serverUpdates,
    refetch: refetchInstalled,
    install: doInstall,
    uninstall: doUninstall,
    activeJobs: allActiveJobs,
    installing: installingIds,
  } = useAppInstallations({
    companyId: selectedCompanyId,
    enabled: !!selectedCompanyId,
  });
  // Fetch backend apps
  const { data: backendData, refetch } = useApiQuery<{ apps: { id: string; slug: string; name: string; version: string; avgRating?: number; rating: number; downloads: number }[]; total: number }>(
    '/apps?take=50',
    { staleTime: 60_000, suppressToast: true }
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const backendApps = backendData?.apps ?? [];

  // Use refetchInstalled in the banner dismiss to force a data sync
  const handleForceRefresh = useCallback(() => { refetchInstalled(); refetch(); }, [refetchInstalled, refetch]);

  // Filter out dismissed jobs from the banner
  const activeJobs = useMemo(() => {
    const m = new Map<string, ModuleDownloadJob>();
    for (const [alias, job] of allActiveJobs.entries()) {
      if (!dismissedJobs.has(alias)) m.set(alias, job);
    }
    return m;
  }, [allActiveJobs, dismissedJobs]);

  const handleDismissJob = useCallback((alias: string) => {
    setDismissedJobs(prev => new Set([...prev, alias]));
  }, []);

  const handleCancelJob = useCallback(async (jobId: string) => {
    try {
      const { moduleDownloadApi } = await import('@ovds/features/appstore');
      await moduleDownloadApi.cancelJob(jobId);
      toast.success('Download cancelled');
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not cancel download');
    }
  }, []);

  // ── System modules state ────────────────────────────────────────────────────
  const [modules, setModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [_togglingModule, setTogglingModule] = useState<string | null>(null);
  const [configuringModule, setConfiguringModule] = useState<any | null>(null);
  const [moduleSettings, setModuleSettings] = useState<Record<string, string>>({});
  const [moduleSettingsDefs, setModuleSettingsDefs] = useState<any[]>([]);
  const [savingModuleSettings, setSavingModuleSettings] = useState(false);
  const [installingModule, setInstallingModule] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoadingModules(true);
    try {
      const data = await moduleManagerApi.list(selectedCompanyId);
      setModules(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore — modules tab may not be available for all roles
    } finally {
      setLoadingModules(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const handleToggleModule = useCallback(async (moduleName: string, enabled: boolean) => {
    if (!canWrite) {
      toast.error('You need apps:write permission to manage modules');
      return;
    }
    setTogglingModule(moduleName);
    try {
      await moduleManagerApi.toggle(moduleName, enabled);
      toast.success(`Module ${enabled ? 'enabled' : 'disabled'}`);
      fetchModules();
    } catch {
      toast.error('Failed to toggle module');
    } finally {
      setTogglingModule(null);
    }
  }, [canWrite, fetchModules]);

  const handleOpenConfigureModule = async (mod: any) => {
    if (!mod.isEnabled) return;
    setConfiguringModule(mod);
    setModuleSettings({});
    setModuleSettingsDefs([]);
    try {
      const data = await moduleManagerApi.get(mod.name);
      if (data?.currentSettings) {
        setModuleSettings(data.currentSettings);
      }
      if (data?.settings) {
        setModuleSettingsDefs(data.settings);
        const defaults: Record<string, string> = {};
        for (const s of data.settings) {
          if (typeof s.defaultValue === 'string') defaults[s.key] = s.defaultValue;
          else if (s.defaultValue !== undefined && s.defaultValue !== null) defaults[s.key] = String(s.defaultValue);
        }
        setModuleSettings(prev => ({ ...defaults, ...prev }));
      }
    } catch {
      toast.error('Failed to load module settings');
    }
  };

  const handleSaveModuleSettings = async () => {
    if (!configuringModule || !selectedCompanyId) return;
    setSavingModuleSettings(true);
    try {
      await moduleManagerApi.configure(configuringModule.name, selectedCompanyId, moduleSettings);
      toast.success('Module settings saved');
      setConfiguringModule(null);
      fetchModules();
    } catch {
      toast.error('Failed to save module settings');
    } finally {
      setSavingModuleSettings(false);
    }
  };

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as Element).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Merge catalog with backend data
  const allApps = useMemo(() => {
    const merged = [...CATALOG_APPS];
    backendApps.forEach(ba => {
      const idx = merged.findIndex(a => a.id === ba.slug || a.name === ba.name);
      if (idx >= 0) {
        merged[idx] = {
          ...merged[idx],
          rating: ba.avgRating ?? ba.rating ?? merged[idx].rating,
          installs: ba.downloads ?? merged[idx].installs,
          version: ba.version ?? merged[idx].version,
        };
      }
    });
    return merged;
  }, [backendApps]);

  // ── Install / Uninstall ───────────────────────────────────────────────────

  /** Determine the module alias from a catalog app ID */
  const getModuleAlias = useCallback((catalogId: string): string => {
    // catalog id IS the slug (e.g. "erca-etax", "telebirr-pay")
    return catalogId;
  }, []);

  const isSaaS = import.meta.env.VITE_IS_SAAS === 'true';

  /**
   * Main install entry-point.
   * SaaS  → calls useAppInstallations.install() which hits /modules/activate-saas
   * On-premise → opens API key modal first, then calls .install() → /modules/download-local
   */
  const handleInstall = useCallback(async (catalogId: string, apiKey?: string) => {
    if (!selectedCompanyId) {
      toast.error('Select a company first');
      return;
    }
    if (!canWrite) {
      toast.error('You need apps:write permission to install apps');
      return;
    }

    const app = allApps.find(a => a.id === catalogId);

    // On-premise without an API key → show the modal
    if (!isSaaS && !apiKey) {
      setApiKeyTargetApp(app ?? null);
      return;
    }

    setInstalling(catalogId);
    // Clear any previous dismissal for this alias so the banner reappears
    setDismissedJobs(prev => {
      const next = new Set(prev);
      next.delete(catalogId);
      return next;
    });

    try {
      await doInstall(catalogId, getModuleAlias(catalogId), apiKey);
      if (isSaaS) {
        toast.success('Module activated successfully');
      } else {
        toast.success('Download started — watch the progress banner above', { duration: 4000 });
      }
      invalidateQueryPrefix('/apps');
    } catch (e: any) {
      toast.error(e?.message ?? 'Installation failed');
    } finally {
      setInstalling(null);
    }
  }, [selectedCompanyId, canWrite, isSaaS, allApps, doInstall, getModuleAlias]);

  const handleUninstall = useCallback(async (catalogId: string) => {
    if (!selectedCompanyId) return;
    try {
      await doUninstall(catalogId);
      toast.success('App uninstalled');
      invalidateQueryPrefix('/apps');
    } catch (e: any) {
      toast.error(e?.message ?? 'Uninstall failed');
    }
  }, [doUninstall, selectedCompanyId]);

  const handleUpdate = useCallback(async (catalogId: string) => {
    // For now, re-running install is the update path
    return handleInstall(catalogId);
  }, [handleInstall]);

  const handleUpdateAll = useCallback(async () => {
    const updates = allApps.filter(a => {
      const ba = backendApps.find(b => b.slug === a.id || b.name === a.name);
      if (!ba) return false;
      return serverUpdates.some(u => u.appId === ba.id);
    });
    for (const app of updates) {
      await handleInstall(app.id);
    }
  }, [allApps, backendApps, serverUpdates, handleInstall]);

  const filtered = useMemo(() => {
    let apps = allApps;
    if (category !== 'All') apps = apps.filter(a => a.category === category);
    if (search) apps = apps.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );
    switch (sort) {
      case 'trending': return [...apps].sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.installs - a.installs);
      case 'free':     return apps.filter(a => a.price === 'Free');
      case 'paid':     return apps.filter(a => a.price !== 'Free');
      case 'rating':   return [...apps].sort((a, b) => b.rating - a.rating);
      case 'newest':   return [...apps].filter(a => a.isNew).concat(apps.filter(a => !a.isNew));
      default:         return apps;
    }
  }, [allApps, category, search, sort]);

  const myApps = allApps.filter(a => installedIds.has(a.id));
  // Cross-reference server updates with catalog apps
  const updatesAvailable = myApps.filter(a => {
    const ba = backendApps.find(b => b.slug === a.id || b.name === a.name);
    if (!ba) return false;
    const serverInst = serverUpdates.find(u => u.appId === ba.id);
    return !!serverInst;
  });
  const freeCount = allApps.filter(a => a.price === 'Free').length;

  const SORT_OPTIONS: { id: SortType; label: string }[] = [
    { id: 'trending', label: 'Trending' },
    { id: 'newest',   label: 'New' },
    { id: 'rating',   label: 'Top Rated' },
    { id: 'free',     label: 'Free' },
    { id: 'paid',     label: 'Paid' },
  ];

  const TABS: { id: TabType; label: string; badge?: number }[] = [
    { id: 'store',       label: 'Marketplace' },
    { id: 'my-apps',     label: 'My Apps',     badge: myApps.length || undefined },
    { id: 'updates',     label: 'Updates',     badge: updatesAvailable.length || undefined },
    { id: 'modules',     label: 'Modules' },
    { id: 'vat-modules', label: 'VAT Modules' },
    { id: 'guide',       label: 'Guide' },
  ];

  const showSidebar = tab === 'store' && !search;

  return (
    <div className="space-y-0 pb-10">

      {/* ── Download progress banner (visible whenever jobs are active) ── */}
      <DownloadProgressBanner
        jobs={activeJobs}
        onCancel={handleCancelJob}
        onDismiss={(alias) => { handleDismissJob(alias); handleForceRefresh(); }}
      />

      {/* ── Page header ── */}
      <div className="ovds-panel mb-5">
        <div className="ovds-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--pro-azure-50)] border border-[var(--pro-azure-50)]/50 flex items-center justify-center shrink-0">
              <Store size={16} className="text-[var(--pro-azure)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-none">
                  OVDS Marketplace
                </h1>
                <span className="aki-badge solid-success pill sm">Verified</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                <span className="flex items-center gap-1"><Package2 size={10} /> {allApps.length} apps</span>
                <span className="flex items-center gap-1"><Check size={10} className="text-[var(--pro-azure)]" /> All verified</span>
                <span className="flex items-center gap-1"><Shield size={10} className="text-[var(--pro-azure)]" /> ERCA compliant</span>
              </div>
            </div>
          </div>
          {canWrite && (
            <Can permission="apps:write">
              <button className="aki-btn aki-btn-secondary sm">
                <Plus size={12} /> Submit App
              </button>
            </Can>
          )}
        </div>

        {/* Stats row */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <StoreStats total={allApps.length} installed={installedIds.size} free={freeCount} />
        </div>

        {/* Tabs */}
        <div className="ovds-tab-nav px-5" style={{ borderBottom: 'none' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`ovds-tab ${tab === t.id ? 'active' : ''}`}>
              {t.label}
              {t.badge ? (
                <span className="ml-1 w-4 h-4 rounded-full bg-[var(--pro-azure)] text-white text-[9px] font-bold inline-flex items-center justify-center">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── STORE TAB ── */}
      {tab === 'store' && (
        <div className={`flex gap-5 items-start ${showSidebar ? '' : ''}`}>

          {/* Sidebar — category nav (hidden when searching) */}
          {showSidebar && (
            <div className="w-48 shrink-0 hidden lg:block sticky top-4">
              <CategorySidebar apps={allApps} active={category} onChange={c => { setCategory(c); setSort('trending'); }} />
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Search + toolbar */}
            <div className="flex items-center gap-2">
              <div className="aki-input-group flex-1">
                <Search size={14} className="aki-input-icon" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCategory('All'); }}
                  placeholder="Search apps, integrations… (press / to focus)"
                  className="aki-input"
                  style={{ paddingLeft: 36 }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="aki-input-icon-right hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Sort select */}
              <div className="relative shrink-0">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortType)}
                  className="aki-input aki-select text-[12px] font-semibold pr-8"
                  style={{ height: 40, width: 130 }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* View toggle */}
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center justify-center w-9 h-9 transition-colors ${viewMode === 'grid' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center justify-center w-9 h-9 transition-colors ${viewMode === 'list' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  aria-label="List view"
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Mobile category pills (visible < lg when sidebar hidden) */}
            {showSidebar && (
              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden" style={{ scrollbarWidth: 'none' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                      category === c
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                        : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Active filter banner (when searching) */}
            {search && (
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-slate-500">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''} for
                </span>
                <span className="aki-badge solid-info pill sm">"{search}"</span>
                <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 ml-1">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Featured strip — only on default trending/all view */}
            {!search && category === 'All' && sort === 'trending' && (
              <FeaturedStrip
                apps={allApps}
                installedIds={installedIds}
                installing={installing ?? (installingIds.size > 0 ? [...installingIds][0] : null)}
                onSelect={setSelectedApp}
                onInstall={handleInstall}
              />
            )}

            {/* Section heading */}
            {(!search || filtered.length > 0) && (
              <div className="flex items-center justify-between">
                <p className="text-label">
                  {search ? `Results` : category === 'All' ? 'All Apps' : category}
                  <span className="ml-2 text-slate-400 normal-case font-normal">({filtered.length})</span>
                </p>
              </div>
            )}

            {/* App grid / list */}
            {filtered.length === 0 ? (
              <div className="ovds-empty">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Search size={20} className="text-slate-400" />
                </div>
                <p className="ovds-card-title mb-1">No apps match your search</p>
                <p className="ovds-body text-[12px] mb-4">Try a different keyword or clear the filters.</p>
                <button
                  onClick={() => { setSearch(''); setCategory('All'); }}
                  className="aki-btn aki-btn-secondary sm"
                >
                  Clear filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="ovds-grid-layout cols-auto gap-sm" style={{ '--grid-col-min': '260px' } as React.CSSProperties}>
                {filtered.map(app => (
                  <AppGridCard
                    key={app.id}
                    app={app}
                    installed={installedIds.has(app.id)}
                    installing={installing === app.id || installingIds.has(app.id)}
                    onSelect={() => setSelectedApp(app)}
                    onInstall={() => handleInstall(app.id)}
                    onUninstall={() => handleUninstall(app.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* List header */}
                <div className="hidden md:flex items-center gap-4 px-4 py-2 text-label">
                  <span className="w-11 shrink-0" />
                  <span className="flex-1">App</span>
                  <span className="w-36">Category</span>
                  <span className="w-24 text-right">Rating</span>
                  <span className="w-20 text-right">Installs</span>
                  <span className="w-28 text-right">Action</span>
                </div>
                {filtered.map(app => (
                  <AppListRow
                    key={app.id}
                    app={app}
                    installed={installedIds.has(app.id)}
                    installing={installing === app.id || installingIds.has(app.id)}
                    onSelect={() => setSelectedApp(app)}
                    onInstall={() => handleInstall(app.id)}
                    onUninstall={() => handleUninstall(app.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MY APPS TAB ── */}
      {tab === 'my-apps' && (
        <div className="space-y-4">
          {myApps.length === 0 ? (
            <div className="ovds-empty">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Package size={20} className="text-slate-400" />
              </div>
              <p className="ovds-card-title mb-1">No apps installed yet</p>
              <p className="ovds-body text-[12px] mb-4">
                Head to the Marketplace to find integrations for your workflow.
              </p>
              <button onClick={() => setTab('store')} className="aki-btn aki-btn-primary sm">
                <Store size={12} /> Browse Marketplace
              </button>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="aki-card" style={{ padding: '12px 16px', gap: 0 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--pro-azure-50)] flex items-center justify-center">
                      <Check size={14} className="text-[var(--pro-azure)]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                        {myApps.length} app{myApps.length !== 1 ? 's' : ''} installed
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {myApps.filter(a => a.price === 'Free').length} free ·{' '}
                        {myApps.filter(a => a.price !== 'Free').length} paid
                      </p>
                    </div>
                  </div>
                  {updatesAvailable.length > 0 && (
                    <button
                      onClick={() => setTab('updates')}
                      className="aki-btn aki-btn-warning sm"
                    >
                      <RefreshCw size={11} />
                      {updatesAvailable.length} update{updatesAvailable.length !== 1 ? 's' : ''} available
                    </button>
                  )}
                </div>
              </div>

              {/* Installed grid */}
              <div className="ovds-grid-layout cols-auto gap-sm" style={{ '--grid-col-min': '260px' } as React.CSSProperties}>
                {myApps.map(app => (
                  <AppGridCard
                    key={app.id}
                    app={app}
                    installed
                    installing={false}
                    onSelect={() => setSelectedApp(app)}
                    onInstall={() => {}}
                    onUninstall={() => handleUninstall(app.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── UPDATES TAB ── */}
      {tab === 'updates' && (
        <div className="space-y-4">
          {updatesAvailable.length === 0 ? (
            <div className="ovds-empty">
              <div className="w-12 h-12 rounded-2xl bg-[var(--pro-azure-50)] dark:bg-green-950/30 flex items-center justify-center mb-3">
                <CheckCircle size={20} className="text-[var(--pro-azure)]" />
              </div>
              <p className="ovds-card-title mb-1">All apps are up to date</p>
              <p className="ovds-body text-[12px]">
                {myApps.length} app{myApps.length !== 1 ? 's' : ''} installed — nothing to update.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-label">
                  {updatesAvailable.length} update{updatesAvailable.length !== 1 ? 's' : ''} available
                </p>
                <button
                  onClick={handleUpdateAll}
                  className="aki-btn aki-btn-primary sm"
                >
                  <RefreshCw size={11} /> Update All
                </button>
              </div>
              {updatesAvailable.map(app => {
                const ba = backendApps.find(b => b.slug === app.id || b.name === app.name);
                const serverInst = ba ? serverUpdates.find(u => u.appId === ba.id) : null;
                return (
                  <div key={app.id}
                    className="aki-card"
                    style={{ padding: '12px 16px', borderLeftWidth: 3, borderLeftColor: '#F59E0B', gap: 0 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${app.iconBg}`}>
                        {app.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="ovds-card-title truncate">{app.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="aki-badge solid-default pill sm">
                            v{serverInst?.installedVersion ?? app.version}
                          </span>
                          <ArrowRight size={10} className="text-slate-400" />
                          <span className="aki-badge solid-success pill sm">
                            v{serverInst?.latestVersion ?? app.version}
                          </span>
                          {serverInst?.status === 'PENDING_UPDATE' && (
                            <span className="aki-badge solid-warning pill sm">On-premise: manual apply required</span>
                          )}
                        </div>
                        {serverInst?.downloadUrl && serverInst.status === 'PENDING_UPDATE' && (
                          <a
                            href={serverInst.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[var(--pro-azure)] underline mt-1 inline-block"
                          >
                            Download package ↗
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleUpdate(app.id)}
                        disabled={serverInst?.status === 'PENDING_UPDATE'}
                        className="aki-btn aki-btn-primary sm shrink-0 disabled:opacity-50"
                      >
                        <RefreshCw size={11} />
                        {serverInst?.status === 'PENDING_UPDATE' ? 'Pending' : 'Update'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODULES TAB ── */}
      {tab === 'modules' && (
        <div className="space-y-4">
          {loadingModules ? (
            <div className="ovds-empty">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <RefreshCw size={20} className="text-slate-400 animate-spin" />
              </div>
              <p className="ovds-card-title mb-1">Loading modules…</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="ovds-empty">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Puzzle size={20} className="text-slate-400" />
              </div>
              <p className="ovds-card-title mb-1">No modules found</p>
              <p className="ovds-body text-[12px]">System modules will appear here once registered.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {modules.map((m: any) => (
                <GridModuleCard
                  key={m.name}
                  title={m.displayName || m.name}
                  description={m.description}
                  category={m.category}
                  icon={<Puzzle size={20} />}
                  iconBg="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  active={m.isEnabled}
                  licenseTerm={m.isEnabled ? `v${m.version}` : undefined}
                  licenseTermLabel={m.isEnabled ? 'Version' : undefined}
                  actionLabel={m.isEnabled ? 'Configure' : 'Get Module'}
                  onAction={() => m.isEnabled ? handleOpenConfigureModule(m) : handleToggleModule(m.name, true)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VAT MODULES TAB ── */}
      {tab === 'vat-modules' && (
        /*
         * VatModuleProvider may already be mounted higher in the tree (it is,
         * via AppModuleRegistry → VatModuleProvider in app.tsx).  Wrapping here
         * is a safety net so the tab works correctly even if AppStore is ever
         * rendered outside that provider tree (e.g. in Storybook or tests).
         */
        <VatModuleProvider>
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Inlined header strip so it fits inside the existing AppStore card */}
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="text-lg" aria-hidden>🌍</span>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">
                  VAT Country Modules
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Activate the jurisdictions your organisation files VAT returns in
                </p>
              </div>
              <a
                href="/tax/vat/store"
                target="_self"
                className="ml-auto text-xs font-semibold text-[var(--pro-azure)] hover:underline"
              >
                Open full store →
              </a>
            </div>

            {/* The VatModuleStore component renders its own cards, filter bar, etc. */}
            <VatModuleStoreEmbed />
          </div>
        </VatModuleProvider>
      )}

      {/* ── GUIDE TAB ── */}
      {tab === 'guide' && (
        <DeveloperGuide allApps={allApps} setCategory={setCategory} setTab={setTab} />
      )}

      {/* ── App detail drawer ── */}
      {selectedApp && (
        <AppDetailDrawer
          app={selectedApp}
          installed={installedIds.has(selectedApp.id)}
          installing={installing === selectedApp.id || installingIds.has(selectedApp.id)}
          onClose={() => setSelectedApp(null)}
          onInstall={() => handleInstall(selectedApp.id)}
          onUninstall={() => handleUninstall(selectedApp.id)}
        />
      )}

      {/* ── On-premises API key modal ── */}
      {apiKeyTargetApp && (
        <ApiKeyModal
          app={apiKeyTargetApp}
          onConfirm={(apiKey) => {
            const id = apiKeyTargetApp.id;
            setApiKeyTargetApp(null);
            handleInstall(id, apiKey);
          }}
          onClose={() => setApiKeyTargetApp(null)}
        />
      )}

      {/* Module configuration modal */}
      {configuringModule && (
        <Modal
          open
          onClose={() => setConfiguringModule(null)}
          title={`Configure ${configuringModule.displayName || configuringModule.name}`}
          subtitle={configuringModule.description || `Module settings`}
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfiguringModule(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModuleSettings}
                disabled={savingModuleSettings}
                className="aki-btn aki-btn-primary sm flex items-center gap-2 disabled:opacity-50"
              >
                {savingModuleSettings ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                {savingModuleSettings ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          }
          width="max-w-xl"
        >
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {!moduleSettingsDefs.length ? (
              <p className="text-xs text-slate-400 text-center py-6">
                This module has no configurable settings.
              </p>
            ) : (
              moduleSettingsDefs.map((s: any) => (
                <div key={s.key} className="space-y-1.5">
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {s.label}
                  </label>
                  {s.type === 'boolean' ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={moduleSettings[s.key] === 'true'}
                      onClick={() => setModuleSettings(prev => ({ ...prev, [s.key]: prev[s.key] === 'true' ? 'false' : 'true' }))}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${moduleSettings[s.key] === 'true' ? 'bg-[var(--pro-azure)]' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${moduleSettings[s.key] === 'true' ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  ) : s.type === 'select' && s.options ? (
                    <select
                      value={moduleSettings[s.key] ?? String(s.defaultValue ?? '')}
                      onChange={e => setModuleSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                    >
                      {s.options.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : s.type === 'number' ? (
                    <input
                      type="number"
                      value={moduleSettings[s.key] ?? String(s.defaultValue ?? '')}
                      onChange={e => setModuleSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                    />
                  ) : (
                    <input
                      type="text"
                      value={moduleSettings[s.key] ?? String(s.defaultValue ?? '')}
                      onChange={e => setModuleSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 transition-all"
                    />
                  )}
                </div>
              ))
            )}

            {/* v5.0 Security Sandbox Section */}
            {configuringModule?.permissions && (
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                <SecuritySandbox
                  title={`Security Sandbox: ${configuringModule.displayName || configuringModule.name}`}
                  description="Granular permission controls for this module."
                  permissions={configuringModule.permissions}
                  onCommit={handleSaveModuleSettings}
                  onCancel={() => setConfiguringModule(null)}
                  committing={savingModuleSettings}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* v5.0 Module Installation Overlay */}
      {installingModule && (
        <ModuleInstallationOverlay
          moduleName={installingModule}
          dismissable
          onDismiss={() => {
            setInstallingModule(null);
            setInstallError(undefined);
          }}
        />
      )}
    </div>
  );
};

export default AppStore;
