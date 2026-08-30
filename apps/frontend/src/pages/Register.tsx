import React, {
  useState, useCallback, useRef, useEffect, useMemo,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Briefcase, Building2, Check, CheckCircle2,
  Eye, EyeOff, Loader2, Lock, Mail, Phone as PhoneIcon, User, Users,
  Star, AlertCircle, Landmark, Globe, Shield,
  Pencil, BadgeCheck, Link2, Hash, Info, Copy, Fingerprint,
  ChevronRight, TrendingUp, Receipt, Zap, Quote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { Auth0LoginButton } from '../rbac/auth0LoginButton';
import { useAuth } from '../rbac/AuthContext';
import { rbac, type AppRole } from '../rbac';
import type {
  NidDetails, TinDetails, BusinessLicenseDetails,
} from '@ovds/shared/compliance/business-registration.types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Types
// ─────────────────────────────────────────────────────────────────────────────
const AUTH0_ENABLED = import.meta.env.VITE_AUTH0_ENABLED === 'true';
const DRAFT_KEY     = 'ovds_reg_draft';
const API_BASE      = import.meta.env.VITE_API_URL || '/api';

type RegistrationType = 'company' | 'customer' | 'enterprise';
type StepId          = 'method' | 'details' | 'security' | 'review';
type BusinessType    =
  | 'SMALL_BUSINESS' | 'MEDIUM_ENTERPRISE' | 'LARGE_ENTERPRISE'
  | 'MANUFACTURING'  | 'FREELANCER'        | '';

interface RegForm {
  firstName: string;       lastName: string;        email: string;
  password: string;        confirmPassword: string; companyName: string;
  phone: string;           phoneCode: string;       website: string;
  tin: string;             businessType: BusinessType;
  registrationType: RegistrationType;               agreeTerms: boolean;
  referralCode: string;    faydaId: string;         ekybVerified: boolean;
  ekybStatus: string;
}
type FieldErrors = Partial<Record<keyof RegForm | 'general', string>>;

const INITIAL: RegForm = {
  firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  companyName: '', phone: '', phoneCode: '+251', website: '', tin: '',
  referralCode: '', businessType: 'SMALL_BUSINESS', registrationType: 'company',
  agreeTerms: false, faydaId: '', ekybVerified: false, ekybStatus: 'INCOMPLETE',
};

const STEPS: StepId[] = ['method', 'details', 'security', 'review'];

const STEP_META: Record<StepId, { label: string; desc: string; Icon: React.ElementType }> = {
  method:   { label: 'Account Type',  desc: 'Choose how you want to register',  Icon: User },
  details:  { label: 'Your Details',  desc: 'Tell us about yourself',            Icon: Building2 },
  security: { label: 'Security',      desc: 'Protect your account',              Icon: Lock },
  review:   { label: 'Review',        desc: 'Confirm and create your account',   Icon: CheckCircle2 },
};

const BUSINESS_TYPES: { value: BusinessType; label: string; Icon: React.ElementType }[] = [
  { value: 'SMALL_BUSINESS',    label: 'Small',     Icon: Briefcase  },
  { value: 'MEDIUM_ENTERPRISE', label: 'Medium',    Icon: Building2  },
  { value: 'LARGE_ENTERPRISE',  label: 'Large',     Icon: Users      },
  { value: 'MANUFACTURING',     label: 'Mfg.',      Icon: BarChart3  },
  { value: 'FREELANCER',        label: 'Freelance', Icon: Star       },
];

const PHONE_CODES = [
  { code: '+251', flag: '🇪🇹' },
  { code: '+1',   flag: '🇺🇸' },
  { code: '+44',  flag: '🇬🇧' },
  { code: '+971', flag: '🇦🇪' },
  { code: '+254', flag: '🇰🇪' },
];

const PLAN_PERKS: Record<RegistrationType, string[]> = {
  enterprise: ['Fayda NIN SSO', 'eKYB verification', 'MoR e-Tax', 'IFRS reports', 'Full API', 'VAT/BIT filing'],
  company:    ['ERCA e-invoice', 'Payroll automation', 'IFRS reports', 'Multi-user access'],
  customer:   ['View invoices', 'Track payments', 'Download statements', 'Secure access'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Global CSS (injected once at module level via a <style> element)
// ─────────────────────────────────────────────────────────────────────────────
const REG_CSS = `
.rg { font-family:'Plus Jakarta Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
.rg *,.rg *::before,.rg *::after { box-sizing:border-box; }

/* ── keyframes ── */
@keyframes rg-up  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes rg-in  {from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
@keyframes rg-fd  {from{opacity:0}to{opacity:1}}
@keyframes rg-shk {0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
@keyframes rg-ulk {0%{transform:rotate(-12deg) scale(1)}50%{transform:rotate(12deg) scale(1.15)}100%{transform:rotate(0) scale(1)}}
@keyframes rg-spin{to{transform:rotate(360deg)}}
@keyframes rg-pin {0%{transform:scale(1);opacity:.7}70%,100%{transform:scale(2.4);opacity:0}}
@keyframes rg-cf  {0%{opacity:1;transform:translateY(-8px) rotate(0)}100%{opacity:0;transform:translateY(104vh) rotate(720deg)}}
@keyframes rg-pulse{0%,100%{opacity:1}50%{opacity:.55}}

@media(prefers-reduced-motion:reduce){*,::before,::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}

.rg-step  { animation: rg-in .35s cubic-bezier(.22,.68,0,1.2) both }
.rg-up    { animation: rg-up .5s  cubic-bezier(.16,1,.3,1) both }
.rg-fd    { animation: rg-fd .3s ease both }
.rg-shk   { animation: rg-shk .42s ease }
.rg-ulk   { animation: rg-ulk .45s ease }
.rg-pulse { animation: rg-pulse 2s ease infinite }

/* ── inputs ── */
.rgi {
  width:100%; padding:.6875rem .875rem .6875rem 2.5rem;
  border:1.5px solid var(--bd); border-radius:.625rem;
  font-size:.9rem; color:var(--ink); background:var(--s0);
  outline:none; font-family:inherit; line-height:1.5;
  transition:border-color .18s, box-shadow .18s, background .18s;
}
.rgi::placeholder { color: var(--ink5) }
.rgi:hover:not(:focus):not(.err) { border-color: var(--bd2) }
.rgi:focus { border-color:var(--rg); box-shadow:0 0 0 3.5px oklch(0.55 0.22 278 / .11) }
.rgi.err  { border-color:var(--err); box-shadow:0 0 0 3px oklch(0.55 0.20 25 / .10); background:var(--err-lt) }
.rgi.ni   { padding-left:.875rem }
.rgi.mono { font-family:ui-monospace,'Cascadia Code',monospace; letter-spacing:.07em }
.rgi.ctr  { text-align:center }

/* ── primary button ── */
.rgb {
  width:100%; padding:.8125rem 1.375rem; border:none; border-radius:.75rem;
  font-size:.9375rem; font-weight:700; color:#fff; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:.5rem;
  background:var(--rg); font-family:inherit; position:relative; overflow:hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.10), 0 4px 16px oklch(0.55 0.22 278 / .30);
  transition: background .18s, box-shadow .18s, transform .18s;
  letter-spacing: -.01em;
}
.rgb::before { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(255,255,255,.14) 0%,transparent 50%); pointer-events:none }
.rgb:hover:not(:disabled) { background:var(--rg-h); box-shadow:0 2px 4px rgba(0,0,0,.10), 0 8px 24px oklch(0.55 0.22 278 / .38); transform:translateY(-1px) }
.rgb:active:not(:disabled) { transform:translateY(0); box-shadow:0 1px 3px rgba(0,0,0,.08), 0 2px 8px oklch(0.55 0.22 278 / .22) }
.rgb:disabled { opacity:.52; cursor:not-allowed }

/* ── secondary button ── */
.rgo {
  width:100%; padding:.75rem 1.25rem; border:1.5px solid var(--bd); border-radius:.75rem;
  font-size:.875rem; font-weight:600; color:var(--ink2); cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:.5rem;
  background:var(--s0); font-family:inherit;
  transition: border-color .15s, background .15s, color .15s;
}
.rgo:hover { border-color:var(--bd2); background:var(--s1); color:var(--ink) }

/* ── social / ghost button ── */
.rgs {
  flex:1; padding:.6875rem .875rem; border-radius:.625rem;
  border:1.5px solid var(--bd); background:var(--s0);
  font-size:.875rem; font-weight:600; color:var(--ink2); cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:.5rem;
  transition:border-color .15s, background .15s, box-shadow .15s;
  font-family:inherit; white-space:nowrap;
}
.rgs:hover { border-color:var(--bd2); background:var(--s1); box-shadow:0 2px 8px rgba(0,0,0,.06) }

/* ── account-type card ── */
.rgt {
  display:flex; flex-direction:row; align-items:center; gap:.75rem;
  padding:.875rem 1rem; border-radius:.75rem; border:1.5px solid var(--bd);
  background:var(--s0); cursor:pointer; text-align:left; font-family:inherit;
  transition: border-color .18s, background .18s, box-shadow .18s;
  position:relative; overflow:hidden;
}
.rgt:hover { border-color:var(--bd2); background:var(--s1); box-shadow:0 2px 8px rgba(0,0,0,.05) }
.rgt.on { border-color:var(--rg); background:var(--rg-lt); box-shadow:0 0 0 3px oklch(0.55 0.22 278 / .10) }
.rgt.on::after { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--rg); border-radius:0 2px 2px 0 }

/* ── review row ── */
.rgr { display:flex; align-items:center; justify-content:space-between; padding:.5625rem .875rem; transition:background .12s }
.rgr:hover { background:var(--s2) }

/* ── label ── */
.rgl { display:block; font-size:.6875rem; font-weight:700; color:var(--ink3); letter-spacing:.01em; margin-bottom:.4375rem }

/* ── feature pill ── */
.rgf {
  display:inline-flex; align-items:center; gap:.3125rem;
  font-size:.75rem; font-weight:600; color:var(--ink2);
  padding:.3125rem .625rem; border-radius:999px;
  background:var(--s0); border:1px solid var(--bd);
  white-space:nowrap;
}

/* ── trust badge ── */
.rgtb {
  display:inline-flex; align-items:center; gap:.3125rem;
  font-size:.6875rem; font-weight:600; color:var(--ink4);
}

/* ── left panel ── */
.rg-lp { display:none }
@media(min-width:1024px){ .rg-lp { display:flex } }

/* ── left panel feature row ── */
.rg-lf {
  display:flex; align-items:flex-start; gap:.875rem;
  padding:.875rem 1rem; border-radius:.875rem;
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.10);
  transition: background .2s;
}
.rg-lf:hover { background:rgba(255,255,255,.09) }

/* ── floating mockup anim ── */
@keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes lp-float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes lp-glow { 0%,100%{opacity:.6} 50%{opacity:1} }
.lp-fl1 { animation: lp-float  6s ease-in-out infinite }
.lp-fl2 { animation: lp-float2 8s 1s ease-in-out infinite }
.lp-glow { animation: lp-glow  4s ease-in-out infinite }
`;

// Inject CSS at module evaluation time — runs once per page load, HMR-safe
if (typeof document !== 'undefined') {
  const _id = 'rg-styles';
  const existing = document.getElementById(_id);
  if (existing) {
    // HMR: update in-place if content changed
    existing.textContent = REG_CSS;
  } else {
    const el = document.createElement('style');
    el.id = _id;
    el.textContent = REG_CSS;
    document.head.appendChild(el);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tiny utilities
// ─────────────────────────────────────────────────────────────────────────────
function pwStrength(pw: string) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8)           s++;
  if (pw.length >= 12)          s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  const m: [number, string, string][] = [
    [1, 'Weak',       '#ef4444'],
    [2, 'Fair',       '#f59e0b'],
    [3, 'Good',       '#3b82f6'],
    [4, 'Strong',     '#10b981'],
    [5, 'Very Strong','#059669'],
  ];
  const [, label, color] = m.find(([t]) => s <= t) ?? m[4];
  return { score: s, label, color };
}



// ic = "input class": appends .err when there's an error
function ic(err?: string) { return err ? 'rgi err' : 'rgi'; }

// ─────────────────────────────────────────────────────────────────────────────
// SVG brand logos
// ─────────────────────────────────────────────────────────────────────────────
const GoogleLogo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const MicrosoftLogo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
    <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
    <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
    <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
    <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
  </svg>
);
const LinkedInLogo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
const FaydaLogo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect width="24" height="24" rx="5" fill="#078930"/>
    <path d="M12 5L8 8v8l4 3 4-3V8L12 5z" fill="white" fillOpacity=".92"/>
    <circle cx="12" cy="12" r="2.2" fill="#078930"/>
    <path d="M12 14.2v3.8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Small shared UI pieces
// ─────────────────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="rg-fd" style={{ marginTop: '.375rem', fontSize: '.75rem', fontWeight: 600, color: 'var(--err)', display: 'flex', alignItems: 'center', gap: 4 }}>
      <AlertCircle size={11} style={{ flexShrink: 0 }}/>{msg}
    </p>
  );
}

function IcoLeft({ Ico, err, foc }: { Ico: React.ElementType; err?: boolean; foc?: boolean }) {
  return (
    <Ico size={15} style={{
      position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)',
      pointerEvents: 'none', color: err ? 'var(--err)' : foc ? 'var(--rg)' : 'var(--ink5)',
      transition: 'color .15s',
    }}/>
  );
}

function IcoRight({ show }: { show: boolean }) {
  if (!show) return null;
  return <CheckCircle2 size={14} style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--green)', pointerEvents: 'none' }}/>;
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--bd)' }}/>
      <span style={{ fontSize: '.75rem', fontWeight: 500, color: 'var(--ink4)', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--bd)' }}/>
    </div>
  );
}

function Tag({ color, children }: { color?: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '.625rem', fontWeight: 700, borderRadius: 999, padding: '3px 8px',
      background: color ? `${color}15` : 'var(--rg-lt)',
      color: color ?? 'var(--rg)',
      border: `1px solid ${color ? `${color}30` : 'oklch(0.86 0.08 278)'}`,
      letterSpacing: '.01em',
    }}>{children}</span>
  );
}

function InfoBox({ Ico = Info, color = 'oklch(0.48 0.18 268)', bg = 'oklch(0.97 0.02 268)', border = 'oklch(0.88 0.05 268)', children }: { Ico?: React.ElementType; color?: string; bg?: string; border?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.625rem', padding: '.875rem 1rem', borderRadius: '.75rem', background: bg, border: `1.5px solid ${border}` }}>
      <Ico size={15} style={{ flexShrink: 0, marginTop: 1, color }}/>
      <div style={{ fontSize: '.8125rem', color, lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Left brand panel (Akaunting-style)
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    Icon: Receipt,
    color: 'oklch(0.72 0.18 200)',
    title: 'ERCA e-invoice',
    body: 'Issue tax-compliant invoices, auto-file VAT, and sync with ERCA — all in one place.',
  },
  {
    Icon: TrendingUp,
    color: 'oklch(0.74 0.16 145)',
    title: 'IFRS Financial Reports',
    body: 'Balance sheet, P&L, and cash flow — aligned with Ethiopian IFRS standards.',
  },
  {
    Icon: Zap,
    color: 'oklch(0.78 0.17 85)',
    title: 'Payroll & HR Automation',
    body: 'PAYE, pension, DRRF, and payslips — fully automated for Ethiopian regulations.',
  },
];

const LeftPanel: React.FC<{ step: StepId; stepIdx: number }> = ({ step: _step, stepIdx: _stepIdx }) => {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'oklch(0.21 0.07 268)',
      display: 'flex', flexDirection: 'column',
      userSelect: 'none',
    }}>

      {/* Background grid texture */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="lp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="rgba(255,255,255,.045)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lp-grid)"/>
        </svg>
      </div>

      {/* Radial glow — top-right */}
      <div aria-hidden style={{
        position: 'absolute', top: '-15%', right: '-10%',
        width: '50%', paddingBottom: '50%', borderRadius: '50%',
        background: 'radial-gradient(circle, oklch(0.55 0.22 278 / .22) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }}/>

      {/* Radial glow — bottom-left */}
      <div aria-hidden style={{
        position: 'absolute', bottom: '-10%', left: '-15%',
        width: '55%', paddingBottom: '55%', borderRadius: '50%',
        background: 'radial-gradient(circle, oklch(0.52 0.17 155 / .15) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }}/>

      {/* ── Main content ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '2.5rem 2.25rem', overflowY: 'auto' }}>

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.25rem', flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'var(--rg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px oklch(0.55 0.22 278 / .45)',
          }}>
            <Landmark size={16} color="#fff"/>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#fff', letterSpacing: '-.025em' }}>OVDS</span>
          <span style={{
            fontSize: '.5rem', fontWeight: 700, color: 'rgba(255,255,255,.4)',
            letterSpacing: '.1em', textTransform: 'uppercase',
            background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 4, padding: '2px 6px', marginLeft: 2,
          }}>ERP</span>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: '1.75rem', flexShrink: 0 }}>
          <h2 style={{
            fontSize: '1.5rem', fontWeight: 800, color: '#fff',
            letterSpacing: '-.03em', lineHeight: 1.25, marginBottom: '.625rem',
            textWrap: 'balance',
          } as React.CSSProperties}>
            Ethiopia's #1 Business<br/>Finance Platform
          </h2>
          <p style={{ fontSize: '.875rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.65, maxWidth: '34ch' }}>
            Tax-compliant invoice, payroll, IFRS accounting, and MoR e-Trade — purpose-built for Ethiopian businesses.
          </p>
        </div>

        {/* ── Floating product mockup ── */}
        <div style={{ position: 'relative', marginBottom: '2rem', flexShrink: 0 }}>
          {/* Main dashboard window */}
          <div className="lp-fl1" style={{
            borderRadius: '.875rem',
            background: 'rgba(255,255,255,.07)',
            border: '1px solid rgba(255,255,255,.13)',
            backdropFilter: 'blur(12px)',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,.4), 0 4px 16px rgba(0,0,0,.2)',
          }}>
            {/* Window chrome */}
            <div style={{ background: 'rgba(255,255,255,.06)', padding: '.4375rem .75rem', display: 'flex', alignItems: 'center', gap: 5, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              {['rgba(239,68,68,.7)', 'rgba(245,158,11,.7)', 'rgba(34,197,94,.7)'].map((c, i) => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: c }}/>
              ))}
              <div style={{ flex: 1, height: 14, borderRadius: 3, background: 'rgba(255,255,255,.07)', margin: '0 8px' }}/>
            </div>

            <div style={{ padding: '.75rem' }}>
              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.375rem', marginBottom: '.625rem' }}>
                {[
                  { label: 'Revenue',   val: 'ETB 2.4M', color: 'oklch(0.72 0.18 200)' },
                  { label: 'VAT Filed', val: 'ETB 84K',  color: 'oklch(0.74 0.16 145)' },
                  { label: 'Payroll',   val: 'ETB 320K', color: 'oklch(0.78 0.17 85)'  },
                ].map(k => (
                  <div key={k.label} style={{ background: 'rgba(255,255,255,.07)', borderRadius: '.4375rem', padding: '.4375rem .5625rem', border: '1px solid rgba(255,255,255,.07)' }}>
                    <p style={{ fontSize: '.4375rem', color: 'rgba(255,255,255,.4)', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{k.label}</p>
                    <p style={{ fontSize: '.6875rem', color: k.color, fontWeight: 800, lineHeight: 1 }}>{k.val}</p>
                  </div>
                ))}
              </div>

              {/* Mini bar chart */}
              <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: '.4375rem', padding: '.4375rem .5625rem', marginBottom: '.5rem', border: '1px solid rgba(255,255,255,.06)' }}>
                <p style={{ fontSize: '.4rem', color: 'rgba(255,255,255,.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.3rem' }}>Monthly Revenue</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28 }}>
                  {[45, 62, 38, 74, 55, 82, 68, 90, 52, 88, 65, 100].map((h, i) => (
                    <div key={i} style={{
                      flex: 1, borderRadius: '2px 2px 0 0',
                      background: i === 11 ? 'oklch(0.72 0.18 200)' : `rgba(255,255,255,${i > 8 ? .28 : .15})`,
                      height: `${h}%`,
                    }}/>
                  ))}
                </div>
              </div>

              {/* Recent invoices */}
              {[
                { name: 'Addis Trading PLC', amt: 'ETB 45,000', status: 'Paid',    sc: 'oklch(0.74 0.16 145)' },
                { name: 'Ethio Imports Ltd', amt: 'ETB 28,500', status: 'Pending', sc: 'oklch(0.78 0.17 85)'  },
              ].map(row => (
                <div key={row.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.3125rem .125rem', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,.12)', flexShrink: 0 }}/>
                    <span style={{ fontSize: '.5rem', color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>{row.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <span style={{ fontSize: '.5rem', fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>{row.amt}</span>
                    <span style={{ fontSize: '.375rem', fontWeight: 700, color: row.sc, background: `${row.sc.slice(0, -1)} / .15)`, padding: '1px 4px', borderRadius: 99 }}>{row.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badge: ERCA e-Tax Ready */}
          <div className="lp-fl2" style={{
            position: 'absolute', bottom: -8, right: 0,
            background: 'rgba(20, 20, 50, .8)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,.15)',
            borderRadius: '.75rem',
            padding: '.4375rem .75rem',
            display: 'flex', alignItems: 'center', gap: '.375rem',
            boxShadow: '0 8px 24px rgba(0,0,0,.35)',
          }}>
            <div style={{ width: 22, height: 22, borderRadius: '.375rem', background: 'oklch(0.74 0.16 145)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={11} color="#fff" strokeWidth={3}/>
            </div>
            <div>
              <p style={{ fontSize: '.4375rem', color: 'rgba(255,255,255,.45)', fontWeight: 700, lineHeight: 1, letterSpacing: '.05em', textTransform: 'uppercase' }}>ERCA</p>
              <p style={{ fontSize: '.625rem', color: '#fff', fontWeight: 700, lineHeight: 1.2, marginTop: 1 }}>e-Tax Ready</p>
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4375rem', marginBottom: '1.75rem', flexShrink: 0 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="rg-lf">
              <div style={{
                width: 34, height: 34, borderRadius: '.5625rem', flexShrink: 0,
                background: `color-mix(in oklch, ${f.color} 18%, transparent)`,
                border: `1px solid color-mix(in oklch, ${f.color} 28%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.Icon size={15} color={f.color}/>
              </div>
              <div>
                <p style={{ fontSize: '.875rem', fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 3 }}>{f.title}</p>
                <p style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.48)', lineHeight: 1.5 }}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Testimonial ── */}
        <div style={{
          background: 'rgba(255,255,255,.055)',
          border: '1px solid rgba(255,255,255,.09)',
          borderRadius: '.875rem',
          padding: '1rem 1.125rem',
          marginBottom: '1.75rem',
          flexShrink: 0,
        }}>
          <Quote size={16} color="rgba(255,255,255,.2)" style={{ marginBottom: '.5rem' }}/>
          <p style={{ fontSize: '.8125rem', color: 'rgba(255,255,255,.65)', lineHeight: 1.7, marginBottom: '.75rem', fontStyle: 'italic' }}>
            "OVDS cut our VAT filing time from 3 days to 20 minutes. The ERCA integration is a game changer for our team."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, oklch(0.55 0.22 278), oklch(0.65 0.18 300))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.5625rem', fontWeight: 800, color: '#fff',
            }}>TG</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '.75rem', fontWeight: 700, color: 'rgba(255,255,255,.85)', lineHeight: 1 }}>Tigist Gebre</p>
              <p style={{ fontSize: '.625rem', color: 'rgba(255,255,255,.35)', marginTop: 2 }}>CFO, Addis Trading PLC</p>
            </div>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={10} color="oklch(0.78 0.17 85)" fill="oklch(0.78 0.17 85)"/>)}
            </div>
          </div>
        </div>

        {/* ── Bottom trust badges ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
          marginTop: 'auto', paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,.07)',
          flexShrink: 0,
        }}>
          {[
            { Icon: Shield, label: 'SOC 2 Compliant' },
            { Icon: Globe,  label: 'MoR Certified'   },
            { Icon: Lock,   label: 'AES-256'          },
          ].map(b => (
            <span key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.6875rem', color: 'rgba(255,255,255,.35)', fontWeight: 600 }}>
              <b.Icon size={11} color="rgba(255,255,255,.25)"/> {b.label}
            </span>
          ))}
        </div>

      </div>{/* /content */}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Confetti
// ─────────────────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 56 }, (_, i) => ({
      id: i,
      color: ['#10b981','#34d399','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316'][i % 7],
      left:   `${(i / 56) * 100}%`,
      delay:  `${(i * 0.018).toFixed(2)}s`,
      dur:    `${0.9 + (i % 5) * 0.14}s`,
      size:   `${5 + (i % 4) * 2}px`,
      rot:    `${(i * 41) % 360}deg`,
      radius: i % 3 === 0 ? '50%' : '2px',
    })), []);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50, overflow: 'hidden' }} aria-hidden>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: 0, left: p.left,
          width: p.size, height: p.size, background: p.color,
          borderRadius: p.radius, transform: `rotate(${p.rot})`,
          animation: `rg-cf ${p.dur} ${p.delay} ease-in forwards`,
        }}/>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success screen
// ─────────────────────────────────────────────────────────────────────────────
function SuccessScreen({ name }: { name: string }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setShow(true), 80),
      setTimeout(() => setStep(1), 700),
      setTimeout(() => setStep(2), 950),
      setTimeout(() => setStep(3), 1150),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div className="rg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--s1)' }}>
      {show && <Confetti/>}
      <div style={{
        width: '100%', maxWidth: 400, textAlign: 'center',
        opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(16px)',
        transition: 'all .5s cubic-bezier(.16,1,.3,1)',
      }}>
        {/* Avatar ring */}
        <div style={{ position: 'relative', width: 84, height: 84, margin: '0 auto 1.5rem' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'oklch(0.55 0.22 278 / .18)', animation: 'rg-pin 2.2s ease-out infinite' }}/>
          <div style={{ position: 'relative', width: 84, height: 84, borderRadius: '50%', background: 'linear-gradient(135deg,var(--rg),var(--rg-h))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px oklch(0.55 0.22 278 / .35)' }}>
            <CheckCircle2 size={36} color="#fff"/>
          </div>
        </div>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '.5rem', letterSpacing: '-.025em' }}>
          Welcome{name ? `, ${name}` : ''}! 🎉
        </h2>
        <p style={{ fontSize: '.875rem', color: 'var(--ink3)', marginBottom: '1.75rem', maxWidth: '28ch', margin: '0 auto 1.75rem' }}>
          Your OVDS account is ready. Redirecting to your dashboard…
        </p>
        <div style={{ background: 'var(--s0)', border: '1.5px solid var(--bd)', borderRadius: '.75rem', padding: '1.125rem', textAlign: 'left', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '.5625rem', fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>What's next</p>
          {['Complete your company profile', 'Seed your chart of accounts', 'Explore payroll, VAT & accounting'].map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '.625rem', padding: '.4375rem 0', opacity: step > i ? 1 : 0, transform: step > i ? 'none' : 'translateX(-10px)', transition: 'all .4s cubic-bezier(.16,1,.3,1)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--rg-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={10} color="var(--rg)"/>
              </div>
              <span style={{ fontSize: '.875rem', color: 'var(--ink2)', fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 4, borderRadius: 4, background: 'var(--bd)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 4, background: 'var(--rg)', width: show ? '100%' : '0%', transition: 'width 1.8s cubic-bezier(.16,1,.3,1)' }}/>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Step components
// ─────────────────────────────────────────────────────────────────────────────
type StepProps = {
  form: RegForm;
  set: <K extends keyof RegForm>(k: K, v: RegForm[K]) => void;
  errors: FieldErrors;
  focused: string | null;
  setFocused: (v: string | null) => void;
  goTo: (t: StepId) => void;
  handleSocial: (p: 'google' | 'microsoft' | 'linkedin') => void;
  handleFaydaVerify: () => Promise<void>;
  faydaLoading: boolean;
  ekybData: { nid?: NidDetails; tin?: TinDetails; businessLicense?: BusinessLicenseDetails; completionPct: number } | null;
};

/* ── Step 1: Method ──────────────────────────────────────────────────── */
function MethodStep({ form, set, errors, focused, setFocused, goTo, handleSocial }: StepProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Account type cards ── */}
      <div>
        <label className="rgl" style={{ marginBottom: '.625rem' }}>I am registering as</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {([
            { type: 'company'    as RegistrationType, Icon: Building2,   title: 'Business',    sub: 'Company, SME, or organization' },
            { type: 'enterprise' as RegistrationType, Icon: Fingerprint, title: 'Enterprise',  sub: 'Large organization or verified entity' },
            { type: 'customer'   as RegistrationType, Icon: User,        title: 'Individual',  sub: 'Freelancer or personal account' },
          ]).map(({ type, Icon, title, sub }) => {
            const sel = form.registrationType === type;
            return (
              <button key={type} type="button"
                className={`rgt${sel ? ' on' : ''}`}
                onClick={() => set('registrationType', type)}>
                {/* Icon box */}
                <div style={{
                  width: 38, height: 38, borderRadius: '.625rem', flexShrink: 0,
                  background: sel ? 'var(--rg)' : 'var(--s2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .18s',
                }}>
                  <Icon size={17} color={sel ? '#fff' : 'var(--ink3)'}/>
                </div>
                {/* Text */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.9375rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1, marginBottom: 3 }}>{title}</p>
                  <p style={{ fontSize: '.8rem', color: 'var(--ink4)', lineHeight: 1 }}>{sub}</p>
                </div>
                {/* Radio */}
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${sel ? 'var(--rg)' : 'var(--bd2)'}`,
                  background: sel ? 'var(--rg)' : 'var(--s0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}>
                  {sel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Feature pills for selected type ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.375rem' }}>
        {PLAN_PERKS[form.registrationType].map(perk => (
          <span key={perk} className="rgf">
            <Check size={10} color="var(--green)"/>
            {perk}
          </span>
        ))}
      </div>

      {/* ── Business size (company / enterprise only) ── */}
      {(form.registrationType === 'company' || form.registrationType === 'enterprise') && (
        <div className="rg-fd">
          <label className="rgl">Business size</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '.375rem' }}>
            {BUSINESS_TYPES.map(bt => {
              const sel = form.businessType === bt.value;
              return (
                <button key={bt.value} type="button"
                  onClick={() => set('businessType', bt.value)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    padding: '.5rem .25rem', borderRadius: '.625rem',
                    border: `1.5px solid ${sel ? 'var(--rg)' : 'var(--bd)'}`,
                    background: sel ? 'var(--rg-dim)' : 'var(--s0)',
                    cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
                  }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '.4375rem',
                    background: sel ? 'var(--rg)' : 'var(--s2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background .15s',
                  }}>
                    <bt.Icon size={12} color={sel ? '#fff' : 'var(--ink3)'}/>
                  </div>
                  <p style={{ fontSize: '.5625rem', fontWeight: 700, color: sel ? 'var(--rg)' : 'var(--ink4)', lineHeight: 1.2, textAlign: 'center' }}>{bt.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}



    </div>
  );
}

/* ── Step 2: Details ─────────────────────────────────────────────────── */
function DetailsStep({ form, set, errors, focused, setFocused, handleFaydaVerify, faydaLoading, ekybData }: StepProps) {
  const emailDomain = useMemo(() => {
    const m = form.email.match(/@([\w.-]+\.[a-z]{2,})$/i);
    return m?.[1] ?? null;
  }, [form.email]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Name row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
        {([
          { id: 'r-first', key: 'firstName' as const, label: 'First Name *', ph: 'Tigist', auto: true },
          { id: 'r-last',  key: 'lastName'  as const, label: 'Last Name *',  ph: 'Alemu', auto: false },
        ] as const).map(f => (
          <div key={f.key}>
            <label htmlFor={f.id} className="rgl">{f.label}</label>
            <div style={{ position: 'relative' }}>
              <IcoLeft Ico={User} foc={focused === f.key} err={!!errors[f.key]}/>
              <input id={f.id} className={ic(errors[f.key])} value={form[f.key]} placeholder={f.ph}
                autoFocus={f.auto}
                onChange={e => set(f.key, e.target.value)}
                onFocus={() => setFocused(f.key)} onBlur={() => setFocused(null)}/>
              <IcoRight show={!!form[f.key] && !errors[f.key] && focused !== f.key}/>
            </div>
            <FieldError msg={errors[f.key]}/>
          </div>
        ))}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="r-email" className="rgl">Email Address *</label>
        <div style={{ position: 'relative' }}>
          <IcoLeft Ico={Mail} foc={focused === 'email'} err={!!errors.email}/>
          <input id="r-email" type="email" className={ic(errors.email)} value={form.email} placeholder="you@company.com"
            onChange={e => set('email', e.target.value)}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}/>
          <IcoRight show={!!form.email && !errors.email && focused !== 'email'}/>
        </div>
        {errors.email?.toLowerCase().includes('already exists') ? (
          <p className="rg-fd" style={{ marginTop: '.35rem', fontSize: '.75rem', fontWeight: 600, color: 'oklch(0.55 0.20 25)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={11}/> {errors.email}{' '}
            <Link to="/login" style={{ color: 'oklch(0.42 0.15 25)', fontWeight: 700, textDecoration: 'underline' }}>Sign in →</Link>
          </p>
        ) : <FieldError msg={errors.email}/>}
        {emailDomain && !errors.email && form.email.includes('@') && (
          <div className="rg-fd" style={{ marginTop: '.4rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '.625rem', fontWeight: 600, color: 'var(--ink3)', background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 999, padding: '2px 7px' }}>
              <Globe size={8} color="var(--rg)"/> {emailDomain}
            </span>
            {form.registrationType !== 'customer' && !form.companyName && (
              <button type="button" onClick={() => { const g = emailDomain.split('.')[0]; set('companyName', g.charAt(0).toUpperCase() + g.slice(1)); }}
                style={{ fontSize: '.625rem', fontWeight: 600, color: 'var(--rg)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                <Copy size={8}/> Use as company name
              </button>
            )}
          </div>
        )}
      </div>

      {/* Company fields */}
      {(form.registrationType === 'company' || form.registrationType === 'enterprise') && (<>
        <div>
          <label htmlFor="r-co" className="rgl">Company Name *</label>
          <div style={{ position: 'relative' }}>
            <IcoLeft Ico={Building2} foc={focused === 'companyName'} err={!!errors.companyName}/>
            <input id="r-co" className={ic(errors.companyName)} value={form.companyName} placeholder="Addis Trading PLC"
              onChange={e => set('companyName', e.target.value)}
              onFocus={() => setFocused('companyName')} onBlur={() => setFocused(null)}/>
            <IcoRight show={!!form.companyName && !errors.companyName && focused !== 'companyName'}/>
          </div>
          <FieldError msg={errors.companyName}/>
        </div>

        <div>
          <label className="rgl">Phone Number *</label>
          <div style={{ display: 'flex' }}>
            <select value={form.phoneCode} onChange={e => set('phoneCode', e.target.value)}
              style={{ padding: '.5rem .5rem', borderRadius: '.5rem 0 0 .5rem', border: '1.5px solid var(--bd)', borderRight: 'none', background: 'var(--s1)', fontSize: '.8125rem', fontWeight: 600, color: 'var(--ink2)', outline: 'none', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
              {PHONE_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <div style={{ position: 'relative', flex: 1 }}>
              <IcoLeft Ico={PhoneIcon} foc={focused === 'phone'} err={!!errors.phone}/>
              <input type="tel" className={ic(errors.phone)} style={{ borderRadius: '0 .5rem .5rem 0' }}
                value={form.phone} placeholder="91 234 5678"
                onChange={e => set('phone', e.target.value)}
                onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}/>
            </div>
          </div>
          <FieldError msg={errors.phone}/>
        </div>

        <div>
            <label htmlFor="r-web" className="rgl">Website <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--ink4)' }}>optional</span></label>
            <div style={{ position: 'relative' }}>
              <IcoLeft Ico={Link2} foc={focused === 'website'}/>
              <input id="r-web" className="rgi" value={form.website} placeholder="yoursite.et"
                onChange={e => set('website', e.target.value)}
                onFocus={() => setFocused('website')} onBlur={() => setFocused(null)}/>
            </div>
          </div>
      </>)}

      {/* Referral */}
      <div>
        <label htmlFor="r-ref" className="rgl">Referral Code <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--ink4)' }}>optional</span></label>
        <div style={{ position: 'relative' }}>
          <IcoLeft Ico={Star} foc={focused === 'referralCode'}/>
          <input id="r-ref" className="rgi mono" value={form.referralCode} placeholder="OVDS-XXXX"
            onChange={e => set('referralCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
            onFocus={() => setFocused('referralCode')} onBlur={() => setFocused(null)}/>
          {form.referralCode && (
            <span style={{ position: 'absolute', right: '.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.5rem', fontWeight: 700, color: 'var(--rg)', background: 'var(--rg-lt)', border: '1px solid oklch(0.86 0.08 278)', borderRadius: 999, padding: '2px 6px' }}>✓ Applied</span>
          )}
        </div>
        <p style={{ fontSize: '.5625rem', color: 'var(--ink4)', marginTop: '.25rem' }}>Have a referral code? Enter it for a bonus month free.</p>
      </div>
    </div>
  );
}

/* ── Step 3: Security ────────────────────────────────────────────────── */
function SecurityStep({ form, set, errors, focused, setFocused }: StepProps) {
  const [showPw, setShowPw]   = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const str = pwStrength(form.password);
  const reqs = [
    { label: 'At least 8 characters',  ok: form.password.length >= 8 },
    { label: 'One uppercase letter',    ok: /[A-Z]/.test(form.password) },
    { label: 'One number',             ok: /[0-9]/.test(form.password) },
    { label: 'One special character',  ok: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const allOk = reqs.every(r => r.ok);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Password */}
      <div>
        <label htmlFor="r-pw" className="rgl">Password *</label>
        <div style={{ position: 'relative' }}>
          <IcoLeft Ico={Lock} foc={focused === 'password'} err={!!errors.password}/>
          <input id="r-pw" type={showPw ? 'text' : 'password'} className={ic(errors.password)}
            style={{ paddingRight: '2.1rem' }}
            value={form.password} placeholder="Min. 8 characters" autoFocus
            onChange={e => set('password', e.target.value)}
            onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}/>
          <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: '.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', padding: '.125rem', display: 'flex' }}
            aria-label={showPw ? 'Hide password' : 'Show password'}>
            {showPw ? <EyeOff size={13}/> : <Eye size={13}/>}
          </button>
        </div>
        {form.password && (
          <div className="rg-fd" style={{ marginTop: '.5rem' }}>
            <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ height: 3, flex: 1, borderRadius: 99, background: i <= Math.ceil((str.score / 5) * 4) ? str.color : 'var(--bd)', transition: 'background .28s' }}/>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '.625rem', fontWeight: 700, color: str.color }}>{str.label} password</span>
              <span style={{ fontSize: '.5rem', fontWeight: 700, color: str.color, background: `${str.color}18`, border: `1px solid ${str.color}38`, borderRadius: 999, padding: '2px 6px' }}>{str.score}/5</span>
            </div>
          </div>
        )}
        <FieldError msg={errors.password}/>
      </div>

      {/* Confirm */}
      <div>
        <label htmlFor="r-cpw" className="rgl">Confirm Password *</label>
        <div style={{ position: 'relative' }}>
          <IcoLeft Ico={Lock} foc={focused === 'confirmPassword'} err={!!errors.confirmPassword}/>
          <input id="r-cpw" type={showCPw ? 'text' : 'password'} className={ic(errors.confirmPassword)}
            style={{ paddingRight: '2.1rem' }}
            value={form.confirmPassword} placeholder="Repeat your password"
            onChange={e => set('confirmPassword', e.target.value)}
            onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)}/>
          <button type="button" tabIndex={-1} onClick={() => setShowCPw(v => !v)}
            style={{ position: 'absolute', right: '.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', padding: '.125rem', display: 'flex' }}
            aria-label={showCPw ? 'Hide' : 'Show'}>
            {showCPw ? <EyeOff size={13}/> : <Eye size={13}/>}
          </button>
        </div>
        {form.confirmPassword && form.password === form.confirmPassword && (
          <p className="rg-fd" style={{ marginTop: '.3rem', fontSize: '.625rem', fontWeight: 600, color: 'var(--rg)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <CheckCircle2 size={10}/> Passwords match
          </p>
        )}
        {form.confirmPassword && form.password !== form.confirmPassword && !errors.confirmPassword && (
          <p className="rg-fd" style={{ marginTop: '.3rem', fontSize: '.625rem', fontWeight: 600, color: 'oklch(0.55 0.20 25)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <AlertCircle size={10}/> Passwords don't match
          </p>
        )}
        <FieldError msg={errors.confirmPassword}/>
      </div>

      {/* Requirements */}
      <div style={{ padding: '.75rem .875rem', borderRadius: '.5rem', border: `1.5px solid ${allOk ? 'oklch(0.86 0.08 278)' : 'var(--bd)'}`, background: allOk ? 'oklch(0.96 0.04 278)' : 'var(--s1)', transition: 'all .22s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
          <p style={{ fontSize: '.5rem', fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Requirements</p>
          <span style={{ fontSize: '.625rem', fontWeight: 700, color: allOk ? 'var(--rg)' : 'var(--ink4)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Lock size={9} className={allOk ? 'rg-ulk' : ''}/>
            {allOk ? 'Secure ✓' : `${reqs.filter(r => r.ok).length}/${reqs.length}`}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
          {reqs.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.25rem .375rem', borderRadius: '.3rem', background: r.ok ? 'oklch(0.96 0.04 155)' : 'transparent', transition: 'background .18s' }}>
              <div style={{ width: 13, height: 13, borderRadius: '50%', flexShrink: 0, background: r.ok ? 'var(--rg)' : 'var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .18s' }}>
                {r.ok && <Check size={7} color="#fff"/>}
              </div>
              <span style={{ fontSize: '.6875rem', fontWeight: 500, color: r.ok ? 'var(--rg)' : 'var(--ink3)', flex: 1, transition: 'color .18s' }}>{r.label}</span>
              {r.ok && <BadgeCheck size={10} color="oklch(0.65 0.16 278)"/>}
            </div>
          ))}
        </div>
        {allOk && (
          <div className="rg-fd" style={{ display: 'flex', alignItems: 'center', gap: '.3rem', marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid oklch(0.86 0.08 278)' }}>
            <CheckCircle2 size={11} color="var(--rg)"/>
            <span style={{ fontSize: '.6875rem', fontWeight: 600, color: 'var(--rg)' }}>Password meets all requirements</span>
          </div>
        )}
      </div>

    </div>
  );
}

/* ── Step 4: Review ──────────────────────────────────────────────────── */
function ReviewStep({ form, set, errors, goTo, ekybData }: StepProps & { termsShake: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>

      {/* Summary */}
      <div style={{ border: '1.5px solid var(--bd)', borderRadius: '.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.4375rem .75rem', background: 'var(--s1)', borderBottom: '1px solid var(--bd)' }}>
          <p style={{ fontSize: '.5rem', fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Your details</p>
          <button type="button" onClick={() => goTo('details')}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '.625rem', fontWeight: 600, color: 'var(--rg)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Pencil size={8}/> Edit
          </button>
        </div>
        {[
          { label: 'Name',    value: [form.firstName, form.lastName].filter(Boolean).join(' ') || '—' },
          { label: 'Email',   value: form.email || '—' },
          ...(form.registrationType !== 'customer' ? [
            { label: 'Company',  value: form.companyName || '—' },
            { label: 'Phone',    value: form.phone ? `${form.phoneCode} ${form.phone}` : '—' },
            { label: 'Business', value: BUSINESS_TYPES.find(b => b.value === form.businessType)?.label ?? '—' },
            ...(form.website ? [{ label: 'Website', value: form.website }] : []),
          ] : []),
          { label: 'Account', value: form.registrationType === 'enterprise' ? 'Enterprise' : form.registrationType === 'company' ? 'Business' : 'Individual' },
          ...(form.referralCode ? [{ label: 'Referral', value: form.referralCode }] : []),
        ].map((row, i, arr) => (
          <div key={row.label} className="rgr" style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--bd)' : 'none' }}>
            <span style={{ fontSize: '.5rem', fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{row.label}</span>
            <span style={{ fontSize: '.8125rem', fontWeight: 500, color: 'var(--ink)', maxWidth: '58%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: (row.label === 'TIN' || row.label === 'Fayda NIN') ? 'ui-monospace,monospace' : 'inherit' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Password indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.25rem .25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', fontSize: '.8125rem', color: 'var(--ink3)' }}>
          <Lock size={11} color="var(--rg)"/> Password set <CheckCircle2 size={11} color="var(--rg)"/>
        </div>
        <button type="button" onClick={() => goTo('security')}
          style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '.625rem', fontWeight: 600, color: 'var(--rg)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Pencil size={8}/> Change
        </button>
      </div>

      {/* Referral */}
      {form.referralCode && (
        <div className="rg-fd" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .75rem', borderRadius: '.5rem', background: 'oklch(0.98 0.03 85)', border: '1.5px solid oklch(0.88 0.09 85)' }}>
          <Star size={12} color="oklch(0.62 0.16 85)" fill="oklch(0.62 0.16 85)"/>
          <p style={{ fontSize: '.75rem', fontWeight: 600, color: 'oklch(0.40 0.12 85)' }}>
            Referral <span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 800 }}>{form.referralCode}</span> applied — 1 month free!
          </p>
        </div>
      )}

      {/* SSO hint removed */}

      {/* Terms — rendered by parent so shake state is accessible */}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Register component
// ─────────────────────────────────────────────────────────────────────────────
const Register: React.FC = () => {
  usePageTitle('Register — OVDS');
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<RegForm>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        return { ...INITIAL, ...d, password: '', confirmPassword: '', agreeTerms: false };
      }
    } catch { /* ignore */ }
    return INITIAL;
  });

  const [step,         setStep]         = useState<StepId>('method');
  const [stepKey,      setStepKey]      = useState(0);
  const [errors,       setErrors]       = useState<FieldErrors>({});
  const [loading,      setLoading]      = useState(false);
  const [done,         setDone]         = useState(false);
  const [animating,    setAnimating]    = useState(false);
  const [mounted,      setMounted]      = useState(false);
  const [focused,      setFocused]      = useState<string | null>(null);
  const [termsShake,   setTermsShake]   = useState(false);
  const [faydaLoading, setFaydaLoading] = useState(false);
  const [ekybData,     setEkybData]     = useState<{
    nid?: NidDetails; tin?: TinDetails;
    businessLicense?: BusinessLicenseDetails; completionPct: number;
  } | null>(null);

  const bodyRef  = useRef<HTMLDivElement>(null);
  const stepIdx  = STEPS.indexOf(step);
  const progress = Math.round((stepIdx / (STEPS.length - 1)) * 100);

  // ── draft save ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const { password: _p, confirmPassword: _c, agreeTerms: _a, ...safe } = form;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(safe));
      } catch { /* storage full */ }
    }, 600);
    return () => clearTimeout(t);
  }, [form]);

  // ── mount / draft restore toast ────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.firstName || d.email || d.companyName)
          toast('Draft restored', { icon: '📋', duration: 2500 });
      }
    } catch { /* ignore */ }
    const t1 = setTimeout(() => setMounted(true), 60);
    return () => { clearTimeout(t1); };
  }, []);

  // ── scroll to top on step change ───────────────────────────────────────
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  // ── keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.key === 'Enter' && !loading) {
        if (step === 'review') void submit();
        else void next();
      }
      if (e.key === 'Escape' && stepIdx > 0) back();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, stepIdx, loading]);

  // ── helpers ────────────────────────────────────────────────────────────
  const set = useCallback(<K extends keyof RegForm>(k: K, v: RegForm[K]) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: undefined }));
  }, []);

  const handleSocial = (provider: 'google' | 'microsoft' | 'linkedin') => {
    const base = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api';
    if (provider === 'google') {
      fetch(`${base}/auth/google/status`)
        .then(r => r.json())
        .then((d: { enabled?: boolean }) => {
          if (d?.enabled) window.location.href = `${base}/auth/google`;
          else toast.error('Google sign-in is not configured on this server.');
        })
        .catch(() => { window.location.href = `${base}/auth/google`; });
    } else {
      window.location.href = `${base}/auth/${provider}`;
    }
  };

  const handleFaydaVerify = async () => {
    if (form.faydaId.replace(/\D/g, '').length !== 12) {
      setErrors({ faydaId: 'Enter a valid 12-digit Fayda ID' });
      return;
    }
    setFaydaLoading(true);
    setEkybData(null);
    try {
      const res  = await api.post(`${API_BASE}/auth/ekyb/verify`, {
        faydaId: form.faydaId.replace(/\D/g, ''),
        tin: form.tin || undefined,
      });
      const data = res.data?.data ?? res.data;
      if (data?.harmonization) {
        const h = data.harmonization;
        setEkybData({ nid: h.nid, tin: h.tin, businessLicense: h.businessLicense, completionPct: h.completionPct });
        set('ekybStatus',   h.overallStatus);
        set('ekybVerified', h.overallStatus === 'HARMONIZED');
        if (h.tin?.businessName && !form.companyName) set('companyName', h.tin.businessName);
        if (h.tin?.tin && !form.tin)                  set('tin', h.tin.tin);
        toast.success('eKYB verified — NID, TIN and Business License linked');
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? 'Verification failed';
      setErrors({ faydaId: msg });
      toast.error(msg);
    } finally {
      setFaydaLoading(false);
    }
  };

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (step === 'details') {
      if (!form.firstName.trim()) e.firstName = 'First name is required';
      if (!form.lastName.trim())  e.lastName  = 'Last name is required';
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = 'Enter a valid email address';
      if (form.registrationType !== 'customer') {
        if (!form.companyName.trim()) e.companyName = 'Company name is required';
        if (!form.phone.trim()) e.phone = 'Phone number is required';
      }
    }
    if (step === 'security') {
      if (form.password.length < 8)                e.password        = 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword)  e.confirmPassword = 'Passwords do not match';
    }
    if (step === 'review') {
      if (!form.agreeTerms) {
        e.agreeTerms = 'You must agree to the terms';
        setTermsShake(true);
        setTimeout(() => setTermsShake(false), 480);
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goTo = useCallback((target: StepId) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setStep(target); setStepKey(k => k + 1); setAnimating(false); }, 155);
  }, [animating]);

  const next = async () => {
    if (!validate()) return;
    if (step === 'details' && form.email) {
      setLoading(true);
      try {
        await api.get(`/auth/check-email?email=${encodeURIComponent(form.email)}`, { _background: true } as any);
      } catch (err: any) {
        setLoading(false);
        if (err.response?.status === 409) {
          setErrors({ email: 'An account with this email already exists.' });
          return;
        }
      }
      setLoading(false);
    }
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) goTo(STEPS[idx + 1]);
  };

  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) goTo(STEPS[idx - 1]);
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const isEnt = form.registrationType === 'enterprise';
      const res = await api.post(isEnt ? '/auth/enterprise/signup' : '/auth/signup', {
        firstName:          form.firstName,
        lastName:           form.lastName,
        email:              form.email,
        password:           form.password,
        companyName:        form.registrationType !== 'customer' ? form.companyName   : undefined,
        phone:              form.phone ? `${form.phoneCode} ${form.phone}`             : undefined,
        role:               form.registrationType === 'customer' ? 'CLIENT'            : undefined,
        businessType:       form.registrationType !== 'customer' ? form.businessType || 'SMALL_BUSINESS' : undefined,
        website:            form.registrationType !== 'customer' && form.website       ? form.website : undefined,
        referralCode:       form.referralCode || undefined,
        registrationMethod: 'email',
      }, { _background: true } as any);

      localStorage.removeItem(DRAFT_KEY);
      const data = res.data?.data ?? res.data;

      if (data?.access_token) {
        login(data.access_token, data.user);
        setDone(true);
        toast.success('Account created! Welcome to OVDS.');
        const role = (data.user?.role ?? 'EMPLOYEE') as AppRole;
        setTimeout(() => navigate(rbac.defaultRoute(role)), 1800);
      } else {
        setDone(true);
        toast.success('Account created!');
      }
    } catch (err: any) {
      const raw = err.response?.data?.message;
      const msg = Array.isArray(raw) ? raw[0] : (raw ?? (err.response == null ? 'No connection to server.' : 'Registration failed. Please try again.'));
      if (err.response?.status === 409) { setErrors({ email: msg }); goTo('details'); }
      else setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  if (done) return <SuccessScreen name={form.firstName}/>;

  // ── shared step props ──────────────────────────────────────────────────
  const stepProps: StepProps = {
    form, set, errors, focused, setFocused, goTo,
    handleSocial, handleFaydaVerify, faydaLoading, ekybData,
  };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="rg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', position: 'relative', overflowX: 'hidden' }}>

      {/* ── Top navbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem', height: 56,
        background: 'rgba(255,255,255,.9)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--bd)',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }} className="lg:hidden">
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--rg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px oklch(0.55 0.22 278 / .28)' }}>
            <Landmark size={13} color="#fff"/>
          </div>
          <span style={{ fontWeight: 800, fontSize: '.9375rem', color: 'var(--ink)', letterSpacing: '-.025em' }}>OVDS</span>
        </Link>
        <div style={{ flex: 1, maxWidth: 240, margin: '0 1rem', display: 'flex', gap: 3 }} className="lg:hidden">
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: 'var(--bd)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--rg)', width: i <= stepIdx ? '100%' : '0%', transition: 'width .5s cubic-bezier(.16,1,.3,1)' }}/>
            </div>
          ))}
        </div>
        <div className="hidden lg:block" style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ fontSize: '.8125rem', color: 'var(--ink3)' }} className="hidden sm:inline">Already have an account?</span>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '.8125rem', fontWeight: 700, color: 'var(--rg)', textDecoration: 'none', padding: '.375rem .875rem', borderRadius: '9rem', border: '1.5px solid oklch(0.82 0.10 278)', background: 'var(--rg-lt)' }}>
            Sign in <ArrowRight size={12}/>
          </Link>
        </div>
      </header>

      {/* ── Body: left panel + right form ── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* Left panel — lg+ only */}
        <div className="rg-lp" style={{ width: 420, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ height: '100%', position: 'sticky', top: 56, overflow: 'hidden' }}>
            <LeftPanel step={step} stepIdx={stepIdx}/>
          </div>
        </div>

        {/* Right: scrollable form */}
        <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.25rem 4rem', position: 'relative', background: '#fff' }}>

          {/* Subtle bg */}
          <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-18%', right: '-12%', width: '45vw', height: '45vw', borderRadius: '50%', background: 'radial-gradient(circle, oklch(0.55 0.22 278 / .05) 0%, transparent 68%)' }}/>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0, opacity: .5 }}>
              <defs><pattern id="rg-dot-bg" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="1" fill="oklch(0.55 0.22 278 / .06)"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#rg-dot-bg)"/>
            </svg>
          </div>

          {/* Content column */}
          <div style={{ width: '100%', maxWidth: 510, position: 'relative', zIndex: 1, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(16px)', transition: 'opacity .45s ease, transform .45s ease' }}>

          {/* ── Visual step stepper ── */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.75rem' }}>
            {STEPS.map((s, i) => {
              const done    = i < stepIdx;
              const active  = i === stepIdx;
              const SIcon   = STEP_META[s].Icon;
              return (
                <React.Fragment key={s}>
                  {/* Step circle */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: done ? 'var(--rg)' : active ? 'var(--s0)' : 'var(--s2)',
                      border: `2px solid ${done ? 'var(--rg)' : active ? 'var(--rg)' : 'var(--bd)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .3s cubic-bezier(.16,1,.3,1)',
                      boxShadow: active ? '0 0 0 4px oklch(0.55 0.22 278 / .12)' : 'none',
                    }}>
                      {done
                        ? <Check size={14} color="#fff" strokeWidth={2.5}/>
                        : <SIcon size={15} color={active ? 'var(--rg)' : 'var(--ink5)'}/>
                      }
                    </div>
                    <span style={{
                      fontSize: '.625rem', fontWeight: 700, lineHeight: 1,
                      color: active ? 'var(--rg)' : done ? 'var(--ink3)' : 'var(--ink5)',
                      transition: 'color .2s',
                    }}>{STEP_META[s].label}</span>
                  </div>
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, margin: '0 6px', marginBottom: 16, borderRadius: 99, background: 'var(--bd)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: 'var(--rg)', width: i < stepIdx ? '100%' : '0%', transition: 'width .5s cubic-bezier(.16,1,.3,1)' }}/>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ── Page heading ── */}
          <div style={{ textAlign: 'center', marginBottom: '1.375rem' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.035em', lineHeight: 1.2, marginBottom: '.375rem', textWrap: 'balance' } as React.CSSProperties}>
              {step === 'method'   && 'Create your account'}
              {step === 'details'  && (form.registrationType === 'company' ? 'Your business details' : 'Your details')}
              {step === 'security' && 'Secure your account'}
              {step === 'review'   && 'Review & confirm'}
            </h1>
            <p style={{ fontSize: '.9rem', color: 'var(--ink3)', lineHeight: 1.55 }}>{STEP_META[step].desc}</p>
          </div>

          {/* ── Card ── */}
          <div style={{
            background: 'var(--s0)',
            border: '1px solid var(--bd)',
            borderRadius: '1.125rem',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 8px 32px -6px rgba(99,102,241,.12)',
          }}>

            <div style={{ padding: '1.75rem 2rem 2rem' }}>

              {/* Live avatar chip — shown when name is available */}
              {(step === 'details' || step === 'review') && (form.firstName || form.lastName) && (
                <div className="rg-fd" style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '1.25rem', padding: '.625rem .875rem', background: 'var(--s1)', borderRadius: '.75rem', border: '1px solid var(--bd)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--rg),var(--rg-h))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 2px 6px oklch(0.55 0.22 278 / .25)' }}>
                    {((form.firstName?.[0] ?? '') + (form.lastName?.[0] ?? '')).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p style={{ fontSize: '.8125rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{[form.firstName, form.lastName].filter(Boolean).join(' ')}</p>
                    {form.email && <p style={{ fontSize: '.6875rem', color: 'var(--ink4)', marginTop: 2 }}>{form.email}</p>}
                  </div>
                </div>
              )}

              {/* General error */}
              {errors.general && (
                <div className="rg-fd" style={{ display: 'flex', alignItems: 'flex-start', gap: '.625rem', padding: '.875rem 1rem', marginBottom: '1.25rem', background: 'var(--err-lt)', border: '1.5px solid var(--err-bd)', borderRadius: '.75rem' }}>
                  <AlertCircle size={15} color="var(--err)" style={{ flexShrink: 0, marginTop: 1 }}/>
                  <p style={{ fontSize: '.875rem', color: 'var(--err)', fontWeight: 500, lineHeight: 1.5 }}>{errors.general}</p>
                </div>
              )}

              {/* ── Animated step body ── */}
              <div key={stepKey} className="rg-step">
                {step === 'method'   && <MethodStep   {...stepProps}/>}
                {step === 'details'  && <DetailsStep  {...stepProps}/>}
                {step === 'security' && <SecurityStep {...stepProps}/>}
                {step === 'review'   && (
                  <>
                    <ReviewStep {...stepProps} termsShake={termsShake}/>

                    {/* Terms checkbox */}
                    <div className={termsShake ? 'rg-shk' : ''} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '.75rem',
                      padding: '.875rem 1rem', borderRadius: '.75rem', marginTop: '1rem',
                      border: `1.5px solid ${errors.agreeTerms ? 'var(--err-bd)' : form.agreeTerms ? 'oklch(0.86 0.08 278)' : 'var(--bd)'}`,
                      background: errors.agreeTerms ? 'var(--err-lt)' : form.agreeTerms ? 'var(--rg-lt)' : 'var(--s0)',
                      transition: 'all .2s',
                    }}>
                      <button type="button" role="checkbox" aria-checked={form.agreeTerms}
                        onClick={() => set('agreeTerms', !form.agreeTerms)}
                        style={{
                          width: 19, height: 19, borderRadius: '.375rem', flexShrink: 0, marginTop: 1,
                          border: `2px solid ${form.agreeTerms ? 'var(--rg)' : 'var(--bd2)'}`,
                          background: form.agreeTerms ? 'var(--rg)' : 'var(--s0)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all .15s',
                        }}>
                        {form.agreeTerms && <Check size={11} color="#fff" strokeWidth={3}/>}
                      </button>
                      <div>
                        <p style={{ fontSize: '.875rem', color: 'var(--ink2)', lineHeight: 1.55 }}>
                          I agree to OVDS{' '}
                          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rg)', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a>
                          {' '}and{' '}
                          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rg)', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>
                        </p>
                        <FieldError msg={errors.agreeTerms}/>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ── Navigation buttons ── */}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
                <button type="button" className="rgb" disabled={loading || animating}
                  onClick={step === 'review' ? () => void submit() : () => void next()}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: 'rg-spin 1s linear infinite' }}/>{step === 'review' ? 'Creating account…' : 'Checking…'}</>
                    : step === 'review'
                      ? <><CheckCircle2 size={16}/> Create Account</>
                      : <>Continue <ChevronRight size={15}/></>
                  }
                </button>

                {stepIdx > 0 && (
                  <button type="button" onClick={back}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '.875rem', fontWeight: 600, color: 'var(--ink4)', padding: '.5rem', borderRadius: '.5rem', transition: 'color .14s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink4)'; }}>
                    ← Back to {STEP_META[STEPS[stepIdx - 1]].label}
                  </button>
                )}
              </div>

            </div>{/* /card padding */}

            {/* ── Trust strip at bottom of card ── */}
            <div style={{ borderTop: '1px solid var(--bd)', background: 'var(--s1)', padding: '.875rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span className="rgtb"><Shield size={12} color="var(--green)"/> SSL encrypted</span>
              <span className="rgtb"><Lock size={12} color="var(--ink5)"/> No credit card required</span>
              <span className="rgtb"><CheckCircle2 size={12} color="var(--ink5)"/> Free forever plan</span>
            </div>

          </div>{/* /card */}

          {/* ── Below-card sign-in note ── */}
          <p style={{ textAlign: 'center', fontSize: '.875rem', color: 'var(--ink4)', marginTop: '1.375rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--rg)', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
          </p>

          {/* ── Social proof ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', marginTop: '1.25rem' }}>
            <div style={{ display: 'flex' }}>
              {['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444'].map((c, i) => (
                <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '2px solid var(--s1)', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.5rem', fontWeight: 800, color: '#fff' }}>{String.fromCharCode(65 + i)}</div>
              ))}
            </div>
            <span style={{ fontSize: '.8125rem', color: 'var(--ink4)', fontWeight: 500 }}>
              Join <strong style={{ color: 'var(--ink2)', fontWeight: 700 }}>4,200+</strong> Ethiopian businesses already on OVDS
            </span>
          </div>

          </div>{/* /content column */}
        </div>{/* /right panel */}
      </div>{/* /body */}
    </div>
  );
};

export default Register;
