import type {
  NidDetails, TinDetails, BusinessLicenseDetails,
} from '@ovds/shared/compliance/business-registration.types';
import {
  ArrowRight, BarChart3, Briefcase, Building2, Check, CheckCircle2,
  Eye, EyeOff, Loader2, Lock, Mail, Phone as PhoneIcon, User, Users,
  Star, AlertCircle, Landmark, Globe, Shield,
  Pencil, BadgeCheck, Link2, Hash, Info, Copy, Fingerprint,
  ChevronRight, TrendingUp, Receipt, Zap, Quote,
} from 'lucide-react';
import React, {
  useState, useCallback, useRef, useEffect, useMemo,
} from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

import { usePageTitle } from '../hooks/usePageTitle';
import { rbac, type AppRole } from '../rbac';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';


// ─────────────────────────────────────────────────────────────────────────────
// Constants & Types
// ─────────────────────────────────────────────────────────────────────────────
const _AUTH0_ENABLED = import.meta.env.VITE_AUTH0_ENABLED === 'true';
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
/* ── base ── */
.rg { font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
.rg *,.rg *::before,.rg *::after { box-sizing:border-box; }

/* ── keyframes ── */
@keyframes rg-up   {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes rg-in   {from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes rg-fd   {from{opacity:0}to{opacity:1}}
@keyframes rg-shk  {0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
@keyframes rg-ulk  {0%{transform:rotate(-12deg) scale(1)}50%{transform:rotate(12deg) scale(1.15)}100%{transform:rotate(0) scale(1)}}
@keyframes rg-spin {to{transform:rotate(360deg)}}
@keyframes rg-pin  {0%{transform:scale(1);opacity:.7}70%,100%{transform:scale(2.4);opacity:0}}
@keyframes rg-cf   {0%{opacity:1;transform:translateY(-8px) rotate(0)}100%{opacity:0;transform:translateY(104vh) rotate(720deg)}}
@keyframes rg-pulse{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes rg-pdot {0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.65)}}
@keyframes rg-sb   {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes lp-blob { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.06) translate(1.5%,1.5%)} }
@keyframes lp-bar  { 0%{transform:translateX(-100%)} 50%{transform:translateX(60%)} 100%{transform:translateX(200%)} }
@keyframes lp-shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }

@media(prefers-reduced-motion:reduce){*,::before,::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}

/* ── animation helpers ── */
.rg-step   { animation: rg-in  .38s cubic-bezier(.22,.68,0,1.2) both }
.rg-up     { animation: rg-up  .5s  cubic-bezier(.16,1,.3,1) both }
.rg-fd     { animation: rg-fd  .3s  ease both }
.rg-shk    { animation: rg-shk .42s ease }
.rg-ulk    { animation: rg-ulk .45s ease }
.rg-pulse  { animation: rg-pulse 2s ease infinite }
.rg-pdot   { animation: rg-pdot 2s ease-in-out infinite }
.rg-su1    { animation: rg-up .5s .00s cubic-bezier(.16,1,.3,1) both }
.rg-su2    { animation: rg-up .5s .07s cubic-bezier(.16,1,.3,1) both }
.rg-su3    { animation: rg-up .5s .14s cubic-bezier(.16,1,.3,1) both }
.rg-su4    { animation: rg-up .5s .21s cubic-bezier(.16,1,.3,1) both }
.rg-su5    { animation: rg-up .5s .28s cubic-bezier(.16,1,.3,1) both }

/* ══════════════════════════════════════════════════════════
   INPUTS
   ══════════════════════════════════════════════════════════ */
.rgi {
  width:100%; padding:.6875rem .875rem .6875rem 2.5rem;
  border:1.5px solid #E2E8F0; border-radius:.75rem;
  font-size:.9rem; color:#0f172a; background:#fff;
  outline:none; font-family:inherit; line-height:1.5;
  transition:border-color .18s, box-shadow .18s, background .18s;
}
.rgi::placeholder { color:#94a3b8 }
.rgi:hover:not(:focus):not(.err) { border-color:#CBD5E1 }
.rgi:focus { border-color:var(--rg); box-shadow:0 0 0 3.5px oklch(0.59 0.19 145 / .12) }
.rgi.err  { border-color:var(--err); box-shadow:0 0 0 3px oklch(0.55 0.20 25 / .10); background:var(--err-lt) }
.rgi.ni   { padding-left:.875rem }
.rgi.mono { font-family:ui-monospace,'Cascadia Code',monospace; letter-spacing:.07em }
.rgi.ctr  { text-align:center }

/* ══════════════════════════════════════════════════════════
   PRIMARY CTA BUTTON
   ══════════════════════════════════════════════════════════ */
.rgb {
  width:100%; padding:.875rem 1.5rem; border:none; border-radius:.875rem;
  font-size:.9375rem; font-weight:700; color:#fff; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:.5rem;
  background:linear-gradient(135deg, #4FBA6F 0%, #2ED47A 100%);
  font-family:inherit; position:relative; overflow:hidden;
  box-shadow:0 1px 2px rgba(0,0,0,.08), 0 4px 20px oklch(0.59 0.19 145 / .32);
  transition:box-shadow .2s, transform .18s, background .2s;
  letter-spacing:-.015em;
}
.rgb::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(180deg,rgba(255,255,255,.16) 0%,transparent 55%);
  pointer-events:none;
}
.rgb:hover:not(:disabled) {
  background:linear-gradient(135deg, #3B9957 0%, #4FBA6F 100%);
  box-shadow:0 2px 4px rgba(0,0,0,.10), 0 10px 28px oklch(0.59 0.19 145 / .40);
  transform:translateY(-1.5px);
}
.rgb:active:not(:disabled) { transform:translateY(0); box-shadow:0 1px 3px rgba(0,0,0,.08), 0 2px 10px oklch(0.55 0.22 278 / .22) }
.rgb:disabled { opacity:.50; cursor:not-allowed }

/* ══════════════════════════════════════════════════════════
   OUTLINE / SECONDARY
   ══════════════════════════════════════════════════════════ */
.rgo {
  width:100%; padding:.75rem 1.25rem; border:1.5px solid #E2E8F0; border-radius:.75rem;
  font-size:.875rem; font-weight:600; color:#334155; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:.5rem;
  background:#fff; font-family:inherit;
  transition: border-color .15s, background .15s, color .15s;
}
.rgo:hover { border-color:#CBD5E1; background:#f8fafc; color:#0f172a }

/* ══════════════════════════════════════════════════════════
   SOCIAL SIGN-UP BUTTONS  ← redesigned: more tactile, padded
   ══════════════════════════════════════════════════════════ */
.rgs {
  flex:1; padding:.8125rem .5rem; border-radius:.875rem;
  border:1.5px solid #E2E8F0; background:#fff;
  font-size:.8125rem; font-weight:600; color:#334155; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:.375rem;
  transition:border-color .18s, background .18s, box-shadow .18s, transform .15s, color .15s;
  font-family:inherit; white-space:nowrap;
  animation: rg-sb .4s cubic-bezier(.16,1,.3,1) both;
}
.rgs:hover {
  border-color:oklch(0.78 0.10 278);
  background:oklch(0.975 0.018 145);
  box-shadow:0 2px 10px oklch(0.59 0.19 145 / .10);
  color:var(--rg);
  transform:translateY(-1px);
}
.rgs:active { transform:translateY(0) }

/* ══════════════════════════════════════════════════════════
   ACCOUNT-TYPE CARDS  ← redesigned: bolder selected state
   ══════════════════════════════════════════════════════════ */
.rgt {
  display:flex; flex-direction:row; align-items:center; gap:1rem;
  padding:1.0625rem 1.25rem; border-radius:1rem; border:1.5px solid #E2E8F0;
  background:#fff; cursor:pointer; text-align:left; font-family:inherit;
  transition:border-color .2s, background .2s, box-shadow .2s, transform .18s;
  position:relative; overflow:hidden; width:100%;
}
.rgt:hover:not(.on) {
  border-color:#CBD5E1;
  background:#f8fafc;
  box-shadow:0 2px 14px rgba(0,0,0,.06);
  transform:translateY(-2px);
}
.rgt:active { transform:translateY(0) }
.rgt.on {
  border-color:#4FBA6F;
  background:oklch(0.975 0.018 145);
  box-shadow:0 0 0 3px oklch(0.59 0.19 145 / .12), 0 4px 16px oklch(0.59 0.19 145 / .10);
}
.rgt.on::after {
  content:''; position:absolute; left:0; top:0; bottom:0;
  width:3.5px; background:linear-gradient(180deg,#2ED47A,#4FBA6F);
  border-radius:0 3px 3px 0;
}

/* ══════════════════════════════════════════════════════════
   REVIEW ROW
   ══════════════════════════════════════════════════════════ */
.rgr { display:flex; align-items:center; justify-content:space-between; padding:.5625rem .875rem; transition:background .12s }
.rgr:hover { background:#f8fafc }

/* ══════════════════════════════════════════════════════════
   TYPOGRAPHY HELPERS
   ══════════════════════════════════════════════════════════ */
.rgl {
  display:block; font-size:.6875rem; font-weight:700; color:#64748b;
  letter-spacing:.04em; text-transform:uppercase; margin-bottom:.4375rem;
}
.rgh { display:flex; align-items:center; gap:.25rem; font-size:.6875rem; color:#94a3b8; margin-top:.3125rem; line-height:1.45 }

/* ══════════════════════════════════════════════════════════
   FEATURE PILLS
   ══════════════════════════════════════════════════════════ */
.rgf {
  display:inline-flex; align-items:center; gap:.3125rem;
  font-size:.75rem; font-weight:600; color:#334155;
  padding:.3125rem .625rem; border-radius:999px;
  background:#f8fafc; border:1px solid #E2E8F0;
  white-space:nowrap; transition:border-color .15s, background .15s;
}
.rgf:hover { border-color:#CBD5E1; background:#f1f5f9 }

.rgfv {
  display:inline-flex; align-items:center; gap:.3125rem;
  font-size:.6875rem; font-weight:700;
  padding:.28125rem .5625rem; border-radius:999px; white-space:nowrap;
}

/* ── trust badge ── */
.rgtb {
  display:inline-flex; align-items:center; gap:.375rem;
  font-size:.6875rem; font-weight:600; color:#64748b;
  padding:.3125rem .75rem; border-radius:999px;
  background:#f8fafc; border:1px solid #E2E8F0;
}

/* ══════════════════════════════════════════════════════════
   LEFT PANEL  ← dark indigo redesign
   ══════════════════════════════════════════════════════════ */
.rg-lp { display:none }
@media(min-width:1024px){ .rg-lp { display:flex } }

/* ── left panel feature row ── minimalist list, no light cards ── */
.rg-lf {
  display:flex; align-items:flex-start; gap:1rem;
  padding:.9375rem 0; border-bottom:1px solid rgba(255,255,255,.07);
  transition:transform .2s;
}
.rg-lf:last-child { border-bottom:none }
.rg-lf:hover { transform:translateX(3px) }

/* ── left panel stat chip ── */
.rg-ls {
  display:flex; flex-direction:column; align-items:center; gap:.1875rem;
  padding:.75rem .625rem; border-radius:.75rem;
  background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.10);
  flex:1; text-align:center;
  transition: background .2s;
}
.rg-ls:hover { background:rgba(255,255,255,.10) }

/* ══════════════════════════════════════════════════════════
   STEPPER HEADER  ← new compact dot indicator style
   ══════════════════════════════════════════════════════════ */
.rg-stepper-header {
  display:flex; align-items:center; justify-content:space-between;
  border-bottom:1px solid #f1f5f9; padding-bottom:1.25rem; margin-bottom:1.75rem;
}
.rg-step-label {
  font-size:.6875rem; font-weight:700; color:#4FBA6F;
  letter-spacing:.06em; text-transform:uppercase; margin-bottom:.25rem;
}
.rg-step-title {
  font-size:1.5rem; font-weight:800; color:#0f172a;
  letter-spacing:-.035em; line-height:1.2;
}
.rg-step-dots { display:flex; align-items:center; gap:.4375rem }
.rg-dot-active { width:20px; height:8px; border-radius:999px; background:#4FBA6F; transition:all .3s cubic-bezier(.16,1,.3,1) }
.rg-dot-done   { width:8px;  height:8px; border-radius:50%;   background:#BBF7D0; cursor:pointer; transition:all .2s }
.rg-dot-done:hover { background:#6EE8A4; transform:scale(1.2) }
.rg-dot-idle   { width:8px;  height:8px; border-radius:50%;   background:#e2e8f0; transition:all .2s }

/* ══════════════════════════════════════════════════════════
   OVERALL PAGE WRAPPER
   ══════════════════════════════════════════════════════════ */
.rg-page-bg {
  min-height:100vh; background:#f8fafc;
  display:flex; align-items:stretch; justify-content:center;
  position:relative;
}

/* ── the two-column card shell ── */
.rg-shell {
  width:100%; display:flex; flex-direction:column;
}
@media(min-width:1024px){
  .rg-shell { flex-direction:row }
}
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

function _Tag({ color, children }: { color?: string; children: React.ReactNode }) {
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

function _InfoBox({ Ico = Info, color = 'oklch(0.48 0.18 268)', bg = 'oklch(0.97 0.02 268)', border = 'oklch(0.88 0.05 268)', children }: { Ico?: React.ElementType; color?: string; bg?: string; border?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.625rem', padding: '.875rem 1rem', borderRadius: '.75rem', background: bg, border: `1.5px solid ${border}` }}>
      <Ico size={15} style={{ flexShrink: 0, marginTop: 1, color }}/>
      <div style={{ fontSize: '.8125rem', color, lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Left brand panel (Ovds SaaS style)
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

const LP_STATS = [
  { val: '4,200+', label: 'Businesses on OVDS' },
  { val: '99.9%',  label: 'Platform uptime'    },
  { val: '< 20min',label: 'VAT filing time'    },
];

const LP_STEP_CONTENT: Record<StepId, { headline: string; sub: string }> = {
  method:   { headline: 'Start your free account',      sub: 'Choose the plan that fits your business in seconds.' },
  details:  { headline: 'Tell us about your business',  sub: 'Your info stays private and is never shared.' },
  security: { headline: 'Your data is safe with us',    sub: '256-bit TLS, SOC 2 ready, AES-256 at rest.' },
  review:   { headline: 'Almost there — review & go!',  sub: 'Double-check your details, then launch your workspace.' },
};

const LeftPanel: React.FC<{ step: StepId; stepIdx: number }> = ({ stepIdx }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', background: '#ffffff',
    borderRight: '1px solid #f1f5f9',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '2rem', color: '#0f172a', letterSpacing: '-.04em', lineHeight: 1 }}>OVDS FINCLOUD</div>
      </div>
      {/* Step indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 14px', borderRadius: 999,
        background: '#eff6ff', border: '1px solid #bfdbfe',
        fontSize: '.6875rem', fontWeight: 700, color: '#3B9957',
      }}>
        <span className="rg-pdot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4FBA6F', display: 'inline-block' }}/>
        Step {stepIdx + 1} of {STEPS.length}
      </div>
    </div>
  </div>
);

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
function SuccessScreen({ name, role, navigate }: { name: string; role: AppRole; navigate: ReturnType<typeof useNavigate> }) {
  const [show, setShow]   = useState(false);
  const [step, setStep]   = useState(0);
  const [secs, setSecs]   = useState(3);

  useEffect(() => {
    const ts = [
      setTimeout(() => setShow(true),  80),
      setTimeout(() => setStep(1),    700),
      setTimeout(() => setStep(2),    950),
      setTimeout(() => setStep(3),   1150),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  // Countdown + auto-redirect
  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(interval);
          navigate(rbac.defaultRoute(role));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [show, role, navigate]);

  // Derive initials from name
  const initials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="rg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--s1)' }}>
      {show && <Confetti/>}
      <div style={{
        width: '100%', maxWidth: 420, textAlign: 'center',
        opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(16px)',
        transition: 'all .5s cubic-bezier(.16,1,.3,1)',
      }}>

        {/* Avatar ring with initials */}
        <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 1.5rem' }}>
          {/* Pulse ring */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'oklch(0.55 0.22 278 / .18)', animation: 'rg-pin 2.2s ease-out infinite' }}/>
          {/* Avatar circle */}
          <div style={{
            position: 'relative', width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--rg), var(--rg-h))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 28px oklch(0.55 0.22 278 / .35)',
            fontSize: '1.375rem', fontWeight: 800, color: '#fff', letterSpacing: '-.03em',
          }}>
            {initials}
          </div>
          {/* Check badge */}
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 26, height: 26, borderRadius: '50%',
            background: 'oklch(0.59 0.19 155)',
            border: '2.5px solid var(--s1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px oklch(0.59 0.19 155 / .4)',
          }}>
            <Check size={12} color="#fff" strokeWidth={3}/>
          </div>
        </div>

        {/* Heading */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '.5rem', letterSpacing: '-.03em' }}>
          Welcome{name ? `, ${name.split(' ')[0]}` : ''}! 🎉
        </h2>
        <p style={{ fontSize: '.9rem', color: 'var(--ink3)', lineHeight: 1.6, maxWidth: '30ch', margin: '0 auto .75rem' }}>
          Your OVDS account is ready.
        </p>

        {/* Countdown pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 14px', borderRadius: 999, marginBottom: '1.5rem',
          background: 'var(--rg-lt)', border: '1px solid oklch(0.82 0.10 278)',
          fontSize: '.8125rem', fontWeight: 700, color: 'var(--rg)',
        }}>
          <Loader2 size={12} style={{ animation: 'rg-spin 1s linear infinite' }}/>
          Redirecting in {secs}s…
        </div>

        {/* What's next checklist */}
        <div style={{ background: 'var(--s0)', border: '1.5px solid var(--bd)', borderRadius: '.875rem', padding: '1.25rem 1.375rem', textAlign: 'left', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '.5625rem', fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.875rem' }}>What's next</p>
          {[
            'Complete your company profile',
            'Seed your chart of accounts',
            'Explore payroll, VAT & accounting',
          ].map((t, i) => (
            <div key={t} style={{
              display: 'flex', alignItems: 'center', gap: '.625rem', padding: '.375rem 0',
              opacity: step > i ? 1 : 0,
              transform: step > i ? 'none' : 'translateX(-10px)',
              transition: 'all .4s cubic-bezier(.16,1,.3,1)',
              borderBottom: i < 2 ? '1px solid var(--bd)' : 'none',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: step > i ? 'var(--rg)' : 'var(--s2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: step > i ? '0 2px 8px oklch(0.55 0.22 278 / .22)' : 'none',
                transition: 'all .35s',
              }}>
                <Check size={10} color={step > i ? '#fff' : 'var(--ink5)'} strokeWidth={2.5}/>
              </div>
              <span style={{ fontSize: '.875rem', color: step > i ? 'var(--ink)' : 'var(--ink4)', fontWeight: step > i ? 600 : 400, transition: 'all .3s' }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Manual redirect fallback */}
        <button
          type="button"
          onClick={() => navigate(rbac.defaultRoute(role))}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '.875rem', fontWeight: 700, color: 'var(--rg)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', padding: '.375rem .75rem',
            borderRadius: '.5rem', transition: 'background .14s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--rg-lt)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
        >
          Go to dashboard now →
        </button>

        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 4, background: 'var(--bd)', overflow: 'hidden', marginTop: '1.25rem' }}>
          <div style={{ height: '100%', borderRadius: 4, background: 'var(--rg)', width: show ? '100%' : '0%', transition: 'width 3s linear' }}/>
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

// Per-perk metadata: icon + color for colored pill rendering
const PERK_META: Record<string, { Icon: React.ElementType; color: string }> = {
  'ERCA e-invoice':       { Icon: Receipt,      color: 'oklch(0.48 0.18 200)' },
  'Payroll automation':   { Icon: Zap,           color: 'oklch(0.52 0.17 85)'  },
  'IFRS reports':         { Icon: TrendingUp,    color: 'oklch(0.48 0.16 145)' },
  'Multi-user access':    { Icon: Users,         color: 'oklch(0.48 0.14 278)' },
  'Fayda NIN SSO':        { Icon: Fingerprint,   color: 'oklch(0.45 0.17 268)' },
  'eKYB verification':    { Icon: BadgeCheck,    color: 'oklch(0.46 0.18 145)' },
  'MoR e-Tax':            { Icon: Shield,        color: 'oklch(0.46 0.20 25)'  },
  'Full API':             { Icon: Hash,          color: 'oklch(0.48 0.14 278)' },
  'VAT/BIT filing':       { Icon: Globe,         color: 'oklch(0.48 0.16 200)' },
  'View invoices':        { Icon: Receipt,       color: 'oklch(0.48 0.18 200)' },
  'Track payments':       { Icon: CheckCircle2,  color: 'oklch(0.48 0.16 145)' },
  'Download statements':  { Icon: ArrowRight,    color: 'oklch(0.48 0.14 278)' },
  'Secure access':        { Icon: Lock,          color: 'oklch(0.46 0.14 258)' },
};

// Account-type card configs with feature counts
const ACCOUNT_TYPES: {
  type: RegistrationType; Icon: React.ElementType; title: string;
  sub: string; tag: string; tagColor: string;
}[] = [
  {
    type: 'company', Icon: Building2, title: 'Business',
    sub: 'Company, SME, or organization',
    tag: `${PLAN_PERKS.company.length} features`, tagColor: 'oklch(0.48 0.18 145)',
  },
  {
    type: 'enterprise', Icon: Fingerprint, title: 'Enterprise',
    sub: 'Large organization or verified entity',
    tag: `${PLAN_PERKS.enterprise.length} features · eKYB`, tagColor: 'oklch(0.46 0.20 25)',
  },
  {
    type: 'customer', Icon: User, title: 'Individual',
    sub: 'Freelancer or personal account',
    tag: `${PLAN_PERKS.customer.length} features · Free`, tagColor: 'oklch(0.48 0.16 145)',
  },
];

/* ── Step 1: Method ──────────────────────────────────────────────────── */
function MethodStep({ form, set, handleSocial }: StepProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Account type cards ── */}
      <div className="rg-su2">
        <label className="rgl" style={{ marginBottom: '.75rem' }}>I am registering as</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
          {ACCOUNT_TYPES.map(({ type, Icon, title, sub, tag, tagColor }) => {
            const sel = form.registrationType === type;
            return (
              <button
                key={type}
                type="button"
                className={`rgt${sel ? ' on' : ''}`}
                onClick={() => set('registrationType', type)}
              >
                {/* Icon box */}
                <div style={{
                  width: 44, height: 44, borderRadius: '.875rem', flexShrink: 0,
                  background: sel ? '#4FBA6F' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: sel ? '0 4px 14px rgba(79,70,229,.35)' : 'none',
                  transition: 'background .2s, box-shadow .2s',
                }}>
                  <Icon size={20} color={sel ? '#fff' : '#94a3b8'}/>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: 5 }}>
                    <p style={{ fontSize: '.9375rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{title}</p>
                    <span style={{
                      fontSize: '.5rem', fontWeight: 700, padding: '2.5px 7px', borderRadius: 999,
                      background: sel ? `color-mix(in srgb, ${tagColor === 'oklch(0.48 0.18 145)' ? '#4FBA6F' : tagColor === 'oklch(0.46 0.20 25)' ? '#ef4444' : '#10b981'} 12%, white)` : '#f1f5f9',
                      color: sel ? (tagColor === 'oklch(0.48 0.18 145)' ? '#4FBA6F' : tagColor === 'oklch(0.46 0.20 25)' ? '#dc2626' : '#059669') : '#94a3b8',
                      border: `1px solid ${sel ? (tagColor === 'oklch(0.48 0.18 145)' ? '#BBF7D0' : tagColor === 'oklch(0.46 0.20 25)' ? '#fecaca' : '#bbf7d0') : '#e2e8f0'}`,
                      transition: 'all .18s', whiteSpace: 'nowrap',
                    }}>{tag}</span>
                  </div>
                  <p style={{ fontSize: '.8rem', color: '#64748b', lineHeight: 1.3 }}>{sub}</p>
                </div>

                {/* Radio dot */}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${sel ? '#4FBA6F' : '#cbd5e1'}`,
                  background: sel ? '#4FBA6F' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .18s',
                  boxShadow: sel ? '0 2px 8px rgba(79,70,229,.30)' : 'none',
                }}>
                  {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }}/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Colored feature pills for selected type ── */}
      <div className="rg-su3" style={{ display: 'flex', flexWrap: 'wrap', gap: '.375rem', marginBottom: '.625rem' }}>
        {PLAN_PERKS[form.registrationType].map(perk => {
          const meta = PERK_META[perk];
          return (
            <span key={perk} className="rgfv" style={{
              background: `color-mix(in oklch, ${meta?.color ?? 'var(--rg)'} 10%, white)`,
              color: meta?.color ?? 'var(--rg)',
              border: `1px solid color-mix(in oklch, ${meta?.color ?? 'var(--rg)'} 22%, white)`,
            }}>
              {meta?.Icon
                ? <meta.Icon size={10} color={meta.color}/>
                : <Check size={10} color={meta?.color ?? 'var(--green)'}/>
              }
              {perk}
            </span>
          );
        })}
      </div>

      {/* ── Business size (company / enterprise only) ── */}
      {(form.registrationType === 'company' || form.registrationType === 'enterprise') && (
        <div className="rg-fd rg-su4">
          <label className="rgl">Business size</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '.375rem' }}>
            {BUSINESS_TYPES.map(bt => {
              const sel = form.businessType === bt.value;
              return (
                <button key={bt.value} type="button"
                  onClick={() => set('businessType', bt.value)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    padding: '.625rem .25rem', borderRadius: '.75rem',
                    border: `1.5px solid ${sel ? 'var(--rg)' : 'var(--bd)'}`,
                    background: sel ? 'var(--rg-lt)' : 'var(--s0)',
                    cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
                    boxShadow: sel ? '0 0 0 3px oklch(0.55 0.22 278 / .08)' : 'none',
                  }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '.5rem',
                    background: sel ? 'var(--rg)' : 'var(--s2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: sel ? '0 3px 10px oklch(0.55 0.22 278 / .28)' : 'none',
                    transition: 'all .15s',
                  }}>
                    <bt.Icon size={13} color={sel ? '#fff' : 'var(--ink3)'}/>
                  </div>
                  <p style={{ fontSize: '.5625rem', fontWeight: 700, color: sel ? 'var(--rg)' : 'var(--ink4)', lineHeight: 1.2, textAlign: 'center' }}>{bt.label}</p>
                </button>
              );
            })}
          </div>
          <p className="rgh" style={{ marginTop: '.4375rem' }}>
            <Info size={10} color="var(--ink5)"/> Determines your available payroll and tax modules.
          </p>
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
      <div className="rg-su1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
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
      <div className="rg-su2">
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
        {/* Domain badge + auto-fill */}
        {emailDomain && !errors.email && form.email.includes('@') ? (
          <div className="rg-fd" style={{ marginTop: '.375rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
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
        ) : (
          <p className="rgh">
            <Info size={10} color="var(--ink5)"/> We'll send your verification link here.
          </p>
        )}
      </div>

      {/* Company fields */}
      {(form.registrationType === 'company' || form.registrationType === 'enterprise') && (<>
        <div className="rg-su3">
          <label htmlFor="r-co" className="rgl">Company Name *</label>
          <div style={{ position: 'relative' }}>
            <IcoLeft Ico={Building2} foc={focused === 'companyName'} err={!!errors.companyName}/>
            <input id="r-co" className={ic(errors.companyName)} value={form.companyName} placeholder="Addis Trading PLC"
              onChange={e => set('companyName', e.target.value)}
              onFocus={() => setFocused('companyName')} onBlur={() => setFocused(null)}/>
            <IcoRight show={!!form.companyName && !errors.companyName && focused !== 'companyName'}/>
          </div>
          <FieldError msg={errors.companyName}/>
          <p className="rgh"><Info size={10} color="var(--ink5)"/> Appears on your ERCA invoices and payroll slips.</p>
        </div>

        <div className="rg-su4">
          <label className="rgl">Phone Number *</label>
          <div style={{ display: 'flex', borderRadius: '.75rem', overflow: 'hidden', border: '1.5px solid var(--bd)', transition: 'border-color .18s, box-shadow .18s' }}
            onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--rg)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3.5px oklch(0.55 0.22 278 / .11)'; }}
            onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bd)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
            <select value={form.phoneCode} onChange={e => set('phoneCode', e.target.value)}
              style={{ padding: '.6875rem .625rem', border: 'none', borderRight: '1.5px solid var(--bd)', background: 'var(--s1)', fontSize: '.8125rem', fontWeight: 700, color: 'var(--ink2)', outline: 'none', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
              {PHONE_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <div style={{ position: 'relative', flex: 1 }}>
              <IcoLeft Ico={PhoneIcon} foc={focused === 'phone'} err={!!errors.phone}/>
              <input type="tel"
                className={`${ic(errors.phone)} ni`}
                style={{ borderRadius: 0, border: 'none', paddingLeft: '2.25rem', boxShadow: 'none', background: 'transparent' }}
                value={form.phone} placeholder="91 234 5678"
                onChange={e => set('phone', e.target.value)}
                onFocus={() => setFocused('phone')} onBlur={() => setFocused(null)}/>
            </div>
          </div>
          <FieldError msg={errors.phone}/>
          <p className="rgh"><Info size={10} color="var(--ink5)"/> Used for 2FA and account security alerts.</p>
        </div>

        <div className="rg-su5">
          <label htmlFor="r-web" className="rgl">
            Website{' '}
            <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--ink4)', fontSize: '.625rem' }}>optional</span>
          </label>
          <div style={{ position: 'relative' }}>
            <IcoLeft Ico={Link2} foc={focused === 'website'}/>
            <input id="r-web" className="rgi" value={form.website} placeholder="yoursite.et"
              onChange={e => set('website', e.target.value)}
              onFocus={() => setFocused('website')} onBlur={() => setFocused(null)}/>
          </div>
          <p className="rgh"><Info size={10} color="var(--ink5)"/> Shown on your public business profile.</p>
        </div>
      </>)}

      {/* Referral */}
      <div>
        <label htmlFor="r-ref" className="rgl">
          Referral Code{' '}
          <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--ink4)', fontSize: '.625rem' }}>optional</span>
        </label>
        <div style={{ position: 'relative' }}>
          <IcoLeft Ico={Star} foc={focused === 'referralCode'}/>
          <input id="r-ref" className="rgi mono" value={form.referralCode} placeholder="OVDS-XXXX"
            onChange={e => set('referralCode', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12))}
            onFocus={() => setFocused('referralCode')} onBlur={() => setFocused(null)}/>
          {form.referralCode && (
            <span style={{
              position: 'absolute', right: '.5rem', top: '50%', transform: 'translateY(-50%)',
              fontSize: '.5rem', fontWeight: 700, color: 'oklch(0.42 0.16 145)',
              background: 'oklch(0.94 0.04 145)', border: '1px solid oklch(0.82 0.08 145)',
              borderRadius: 999, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Check size={8} color="oklch(0.42 0.16 145)" strokeWidth={3}/> Applied
            </span>
          )}
        </div>
        {form.referralCode ? (
          <p className="rg-fd rgh" style={{ color: 'oklch(0.42 0.16 145)' }}>
            <CheckCircle2 size={10} color="oklch(0.48 0.16 145)"/> 1 bonus month unlocked — nice!
          </p>
        ) : (
          <p className="rgh"><Info size={10} color="var(--ink5)"/> Have a referral? Enter it to unlock a free bonus month.</p>
        )}
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

  // Approximate crack-time hint based on score
  const crackHint = useMemo(() => {
    if (!form.password) return null;
    const hints = ['< 1 second', '< 1 minute', 'a few hours', 'several years', 'centuries'];
    return hints[Math.min(str.score - 1, 4)] ?? null;
  }, [form.password, str.score]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Password ── */}
      <div className="rg-su1">
        <label htmlFor="r-pw" className="rgl">Password *</label>
        <div style={{ position: 'relative' }}>
          <IcoLeft Ico={Lock} foc={focused === 'password'} err={!!errors.password}/>
          <input id="r-pw" type={showPw ? 'text' : 'password'} className={ic(errors.password)}
            style={{ paddingRight: '2.25rem' }}
            value={form.password} placeholder="Min. 8 characters" autoFocus
            onChange={e => set('password', e.target.value)}
            onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}/>
          <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: '.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', padding: '.125rem', display: 'flex', borderRadius: '.375rem', transition: 'color .14s' }}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink4)'; }}>
            {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>
        </div>

        {/* Strength bar + crack hint */}
        {form.password && (
          <div className="rg-fd" style={{ marginTop: '.5rem' }}>
            <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{
                  height: 4, flex: 1, borderRadius: 99,
                  background: i <= Math.ceil((str.score / 5) * 4) ? str.color : 'var(--bd)',
                  transition: 'background .28s',
                }}/>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
              <span style={{ fontSize: '.625rem', fontWeight: 700, color: str.color }}>{str.label} password</span>
              {crackHint && (
                <span style={{ fontSize: '.5625rem', fontWeight: 600, color: 'var(--ink4)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Shield size={9} color="var(--ink5)"/>
                  Would take <strong style={{ color: str.color }}>&nbsp;{crackHint}</strong>&nbsp;to crack
                </span>
              )}
            </div>
          </div>
        )}
        <FieldError msg={errors.password}/>
      </div>

      {/* ── Confirm ── */}
      <div className="rg-su2">
        <label htmlFor="r-cpw" className="rgl">Confirm Password *</label>
        <div style={{ position: 'relative' }}>
          <IcoLeft Ico={Lock} foc={focused === 'confirmPassword'} err={!!errors.confirmPassword}/>
          <input id="r-cpw" type={showCPw ? 'text' : 'password'} className={ic(errors.confirmPassword)}
            style={{ paddingRight: '2.25rem' }}
            value={form.confirmPassword} placeholder="Repeat your password"
            onChange={e => set('confirmPassword', e.target.value)}
            onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)}/>
          <button type="button" tabIndex={-1} onClick={() => setShowCPw(v => !v)}
            style={{ position: 'absolute', right: '.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', padding: '.125rem', display: 'flex', borderRadius: '.375rem', transition: 'color .14s' }}
            aria-label={showCPw ? 'Hide' : 'Show'}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink4)'; }}>
            {showCPw ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button>
        </div>
        {form.confirmPassword && form.password === form.confirmPassword && (
          <p className="rg-fd" style={{ marginTop: '.3rem', fontSize: '.625rem', fontWeight: 600, color: 'oklch(0.42 0.16 145)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <CheckCircle2 size={10} color="oklch(0.48 0.16 145)"/> Passwords match
          </p>
        )}
        {form.confirmPassword && form.password !== form.confirmPassword && !errors.confirmPassword && (
          <p className="rg-fd" style={{ marginTop: '.3rem', fontSize: '.625rem', fontWeight: 600, color: 'oklch(0.55 0.20 25)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <AlertCircle size={10}/> Passwords don't match yet
          </p>
        )}
        <FieldError msg={errors.confirmPassword}/>
      </div>

      {/* ── Requirements box ── */}
      <div className="rg-su3" style={{
        padding: '.875rem 1rem', borderRadius: '.875rem',
        border: `1.5px solid ${allOk ? 'oklch(0.82 0.10 278)' : 'var(--bd)'}`,
        background: allOk ? 'oklch(0.97 0.03 278)' : 'var(--s1)',
        transition: 'all .25s',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.625rem' }}>
          <p style={{ fontSize: '.5625rem', fontWeight: 700, color: allOk ? 'var(--rg)' : 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Password requirements
          </p>
          <span style={{
            fontSize: '.625rem', fontWeight: 700, color: allOk ? 'var(--rg)' : 'var(--ink4)',
            display: 'flex', alignItems: 'center', gap: 4,
            background: allOk ? 'oklch(0.92 0.06 278)' : 'var(--s2)',
            border: `1px solid ${allOk ? 'oklch(0.82 0.10 278)' : 'var(--bd)'}`,
            padding: '2px 8px', borderRadius: 999, transition: 'all .22s',
          }}>
            <Lock size={9} className={allOk ? 'rg-ulk' : ''}/>
            {allOk ? 'Secured ✓' : `${reqs.filter(r => r.ok).length} / ${reqs.length}`}
          </span>
        </div>

        {/* Requirement rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
          {reqs.map(r => (
            <div key={r.label} style={{
              display: 'flex', alignItems: 'center', gap: '.5rem',
              padding: '.3125rem .5rem', borderRadius: '.5rem',
              background: r.ok ? 'oklch(0.96 0.04 155 / .6)' : 'transparent',
              transition: 'background .18s',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: r.ok ? 'var(--rg)' : 'var(--bd)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: r.ok ? '0 2px 6px oklch(0.55 0.22 278 / .22)' : 'none',
                transition: 'all .18s',
              }}>
                {r.ok
                  ? <Check size={8} color="#fff" strokeWidth={3}/>
                  : <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--ink5)' }}/>
                }
              </div>
              <span style={{ fontSize: '.75rem', fontWeight: 500, color: r.ok ? 'var(--ink)' : 'var(--ink3)', flex: 1, transition: 'color .18s' }}>{r.label}</span>
              {r.ok && <BadgeCheck size={12} color="oklch(0.59 0.19 145)" style={{ flexShrink: 0 }}/>}
            </div>
          ))}
        </div>

        {/* All-ok footer */}
        {allOk && (
          <div className="rg-fd" style={{
            display: 'flex', alignItems: 'center', gap: '.375rem',
            marginTop: '.625rem', paddingTop: '.625rem',
            borderTop: '1px solid oklch(0.86 0.08 278)',
          }}>
            <CheckCircle2 size={12} color="var(--rg)"/>
            <span style={{ fontSize: '.6875rem', fontWeight: 700, color: 'var(--rg)' }}>Password meets all security requirements</span>
          </div>
        )}
      </div>

    </div>
  );
}

/* ── Step 4: Review ──────────────────────────────────────────────────── */
function ReviewStep({ form, goTo }: StepProps & { termsShake: boolean }) {
  const rows = [
    { label: 'Name',    value: [form.firstName, form.lastName].filter(Boolean).join(' ') || '—' },
    { label: 'Email',   value: form.email || '—' },
    ...(form.registrationType !== 'customer' ? [
      { label: 'Company',  value: form.companyName || '—' },
      { label: 'Phone',    value: form.phone ? `${form.phoneCode} ${form.phone}` : '—' },
      { label: 'Size',     value: BUSINESS_TYPES.find(b => b.value === form.businessType)?.label ?? '—' },
      ...(form.website ? [{ label: 'Website', value: form.website }] : []),
    ] : []),
    { label: 'Account', value: form.registrationType === 'enterprise' ? 'Enterprise' : form.registrationType === 'company' ? 'Business' : 'Individual' },
    ...(form.referralCode ? [{ label: 'Referral', value: form.referralCode }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>

      {/* ── Summary table ── */}
      <div style={{ border: '1.5px solid var(--bd)', borderRadius: '.875rem', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '.5625rem 1rem', background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
        }}>
          <p style={{ fontSize: '.5625rem', fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Your details</p>
          <button type="button" onClick={() => goTo('details')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.625rem', fontWeight: 700, color: 'var(--rg)', background: 'var(--rg-lt)', border: '1px solid oklch(0.86 0.08 278)', borderRadius: 999, padding: '2px 9px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .14s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.88 0.07 278)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--rg-lt)'; }}>
            <Pencil size={9}/> Edit
          </button>
        </div>
        {rows.map((row, i) => (
          <div key={row.label} className="rgr" style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--bd)' : 'none' }}>
            <span style={{ fontSize: '.5625rem', fontWeight: 700, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{row.label}</span>
            <span style={{
              fontSize: '.8125rem', fontWeight: 500, color: 'var(--ink)',
              maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: row.label === 'Referral' ? 'ui-monospace,monospace' : 'inherit',
            }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* ── Password indicator ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '.5625rem 1rem', borderRadius: '.75rem',
        background: 'oklch(0.97 0.03 278)', border: '1.5px solid oklch(0.86 0.08 278)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8125rem', fontWeight: 600, color: 'var(--ink)' }}>
          <div style={{ width: 24, height: 24, borderRadius: '.375rem', background: 'var(--rg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px oklch(0.55 0.22 278 / .25)' }}>
            <Lock size={11} color="#fff"/>
          </div>
          Password secured
          <CheckCircle2 size={13} color="var(--rg)"/>
        </div>
        <button type="button" onClick={() => goTo('security')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.625rem', fontWeight: 700, color: 'var(--rg)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Pencil size={9}/> Change
        </button>
      </div>

      {/* ── Referral confirmation ── */}
      {form.referralCode && (
        <div className="rg-fd" style={{
          display: 'flex', alignItems: 'center', gap: '.625rem', padding: '.625rem 1rem',
          borderRadius: '.75rem', background: 'oklch(0.97 0.04 85)', border: '1.5px solid oklch(0.86 0.09 85)',
        }}>
          <div style={{ width: 28, height: 28, borderRadius: '.5rem', background: 'oklch(0.72 0.16 85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Star size={13} color="#fff" fill="#fff"/>
          </div>
          <div>
            <p style={{ fontSize: '.8125rem', fontWeight: 700, color: 'oklch(0.38 0.12 85)', lineHeight: 1 }}>Referral applied!</p>
            <p style={{ fontSize: '.6875rem', color: 'oklch(0.50 0.12 85)', marginTop: 2 }}>
              Code <span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 800 }}>{form.referralCode}</span> — 1 free month unlocked
            </p>
          </div>
        </div>
      )}

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
  const [doneRole,     setDoneRole]     = useState<AppRole>('EMPLOYEE');
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
  const _progress = Math.round((stepIdx / (STEPS.length - 1)) * 100);

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
    // On the details step, verify the email isn't already taken before advancing
    if (step === 'details' && form.email) {
      setLoading(true);
      try {
        await api.get(`/auth/check-email?email=${encodeURIComponent(form.email.trim())}`, { _background: true } as any);
      } catch (err: any) {
        setLoading(false);
        // 409 = email taken → stay on details and show the error
        if (err.response?.status === 409) {
          setErrors({ email: 'An account with this email already exists.' });
          return;
        }
        // Any other error (404, 5xx, network) → let the user continue;
        // the duplicate guard on /auth/register will catch it at submit time.
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
      const res = await api.post('/auth/register', {
        firstName:          form.firstName,
        lastName:           form.lastName,
        email:              form.email,
        password:           form.password,
        username:           [form.firstName, form.lastName].filter(Boolean).join(' ') || form.email.split('@')[0],
        companyName:        form.registrationType !== 'customer' ? form.companyName   : undefined,
        phone:              form.phone ? `${form.phoneCode} ${form.phone}`             : undefined,
        registrationType:   form.registrationType,
        role:               form.registrationType === 'customer' ? 'CLIENT'            : undefined,
        businessType:       form.registrationType !== 'customer' ? form.businessType || 'SMALL_BUSINESS' : undefined,
        website:            form.registrationType !== 'customer' && form.website       ? form.website : undefined,
        referralCode:       form.referralCode || undefined,
        registrationMethod: 'email',
      });

      localStorage.removeItem(DRAFT_KEY);
      const data = res.data?.data ?? res.data;
      const resolvedRole = (data?.user?.role ?? 'EMPLOYEE') as AppRole;

      if (data?.access_token || data?.user) {
        // Login the user immediately (bearer or cookie delivery)
        login(
          data.access_token ?? null,
          data.user,
          data.csrf_token,
        );
        toast.success('Account created! Welcome to OVDS.');
        setDoneRole(resolvedRole);
        setDone(true);
      } else {
        // Fallback: no token returned — show success, let user sign in manually
        setDoneRole(resolvedRole);
        setDone(true);
        toast.success('Account created! Please sign in to continue.');
      }
    } catch (err: any) {
      const raw = err.response?.data?.message;
      const msg = Array.isArray(raw)
        ? raw[0]
        : (raw ?? (err.response == null ? 'No connection to server.' : 'Registration failed. Please try again.'));

      if (err.response?.status === 409) {
        // Email already registered — go back to details step and highlight the field
        setErrors({ email: msg });
        goTo('details');
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <SuccessScreen
      name={[form.firstName, form.lastName].filter(Boolean).join(' ')}
      role={doneRole}
      navigate={navigate}
    />
  );

  // ── shared step props ──────────────────────────────────────────────────
  const stepProps: StepProps = {
    form, set, errors, focused, setFocused, goTo,
    handleSocial, handleFaydaVerify, faydaLoading, ekybData,
  };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    // ── Outer page: slate-50 background fills the viewport ──
    <div className="rg rg-page-bg">

      {/* ── Two-column shell: lg:col-span-5 left + lg:col-span-7 right ── */}
      <div className="rg-shell" style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>

        {/* ════════════════════════════════════════
            LEFT COLUMN — dark indigo value prop
            lg:col-span-5 | hidden on mobile
            ════════════════════════════════════════ */}
        <div
          className="rg-lp"
          style={{
            // ~41.6% = 5/12 columns
            width: '41.6%', flexShrink: 0,
            position: 'sticky', top: 0,
            height: '100vh', overflow: 'hidden',
          }}
        >
          <LeftPanel step={step} stepIdx={stepIdx}/>
        </div>

        {/* ════════════════════════════════════════
            RIGHT COLUMN — registration form
            lg:col-span-7 | full width on mobile
            ════════════════════════════════════════ */}
        <div
          ref={bodyRef}
          style={{
            flex: 1, minWidth: 0,
            overflowY: 'auto', overflowX: 'hidden',
            display: 'flex', flexDirection: 'column',
            background: '#f8fafc',
            // Constrain and center the form content within this column
          }}
        >
          {/* ── Sticky mobile header (hidden on desktop where left panel shows) ── */}
          <header style={{
            position: 'sticky', top: 0, zIndex: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 1.25rem', height: 54,
            background: 'rgba(248,250,252,.92)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderBottom: '1px solid #e2e8f0',
          }}>

            {/* Mobile progress bar */}
            <div
              style={{ flex: 1, maxWidth: 220, margin: '0 1rem', display: 'flex', gap: 3 }}
              className="lg:hidden"
            >
              {STEPS.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: '#4FBA6F',
                    width: i <= stepIdx ? '100%' : '0%',
                    transition: 'width .5s cubic-bezier(.16,1,.3,1)',
                  }}/>
                </div>
              ))}
            </div>

            {/* Spacer on desktop */}
            <div className="hidden lg:block" style={{ flex: 1 }}/>

            {/* Sign-in CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem' }}>
              <span style={{ fontSize: '.8rem', color: '#64748b' }} className="hidden sm:inline">
                Already have an account?
              </span>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: '.8125rem', fontWeight: 700, color: '#4FBA6F',
                  textDecoration: 'none', padding: '.375rem .875rem', borderRadius: 999,
                  border: '1.5px solid #BBF7D0',
                  background: 'oklch(0.975 0.018 145)',
                  transition: 'background .15s, border-color .15s',
                }}
              >
                Sign in <ArrowRight size={12}/>
              </Link>
            </div>
          </header>

          {/* Top loading bar */}
          {loading && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, background: '#e0e7ff', zIndex: 50 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40%', background: '#4FBA6F', borderRadius: 3, animation: 'lp-bar 1.4s ease-in-out infinite' }}/>
            </div>
          )}

          {/* ── Form content ── centered, max-width constrained ── */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center',
            padding: '2.5rem 1.5rem 5rem',
          }}>
            <div style={{
              width: '100%', maxWidth: 520,
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'none' : 'translateY(18px)',
              transition: 'opacity .45s ease, transform .45s ease',
            }}>

              {/* ════════════════════════════════════════
                  MODERN STEPPER HEADER
                  Step X of 4 label + compact dot dots
                  ════════════════════════════════════════ */}
              <div className="rg-stepper-header">
                {/* Left: label + title */}
                <div>
                  <div className="rg-step-label" key={`lbl-${step}`}>
                    Step {stepIdx + 1} of {STEPS.length}
                  </div>
                  <div className="rg-step-title" key={`ttl-${step}`}>
                    {step === 'method'   && 'Create your account'}
                    {step === 'details'  && (form.registrationType === 'company' ? 'Business details' : 'Your details')}
                    {step === 'security' && 'Secure your account'}
                    {step === 'review'   && 'Review & confirm'}
                  </div>
                </div>

                {/* Right: dot indicators (hidden on very small screens) */}
                <div className="rg-step-dots" style={{ display: 'flex' }}>
                  {STEPS.map((s, i) => {
                    const isDone   = i < stepIdx;
                    const isActive = i === stepIdx;
                    const clickable = isDone;
                    return (
                      <div
                        key={s}
                        className={isActive ? 'rg-dot-active' : isDone ? 'rg-dot-done' : 'rg-dot-idle'}
                        onClick={() => clickable && goTo(s)}
                        role={clickable ? 'button' : undefined}
                        aria-label={clickable ? `Back to ${STEP_META[s].label}` : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onKeyDown={e => { if (clickable && (e.key === 'Enter' || e.key === ' ')) goTo(s); }}
                        title={STEP_META[s].label}
                      />
                    );
                  })}
                </div>
              </div>

              {/* ── Card ── */}
              <div style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '1.25rem',
                height: 'auto',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,.05), 0 10px 40px -8px rgba(79,70,229,.13)',
              }}>

                <div style={{ padding: '1.875rem 2.125rem 2.125rem' }}>

                  {/* Live avatar chip */}
                  {(step === 'details' || step === 'review') && (form.firstName || form.lastName) && (
                    <div className="rg-fd" style={{
                      display: 'flex', alignItems: 'center', gap: '.625rem',
                      marginBottom: '1.375rem', padding: '.625rem .875rem',
                      background: '#f8fafc', borderRadius: '.875rem', border: '1px solid #e2e8f0',
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#6EE8A4,#4FBA6F)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.75rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(79,70,229,.28)',
                      }}>
                        {((form.firstName?.[0] ?? '') + (form.lastName?.[0] ?? '')).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p style={{ fontSize: '.8125rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                          {[form.firstName, form.lastName].filter(Boolean).join(' ')}
                        </p>
                        {form.email && (
                          <p style={{ fontSize: '.6875rem', color: '#64748b', marginTop: 2 }}>{form.email}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* General error */}
                  {errors.general && (
                    <div className="rg-fd" style={{
                      display: 'flex', alignItems: 'flex-start', gap: '.625rem',
                      padding: '.875rem 1rem', marginBottom: '1.25rem',
                      background: 'var(--err-lt)', border: '1.5px solid var(--err-bd)', borderRadius: '.875rem',
                    }}>
                      <AlertCircle size={15} color="var(--err)" style={{ flexShrink: 0, marginTop: 1 }}/>
                      <p style={{ fontSize: '.875rem', color: 'var(--err)', fontWeight: 500, lineHeight: 1.5 }}>
                        {errors.general}
                      </p>
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
                        <div
                          className={termsShake ? 'rg-shk' : ''}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '.75rem',
                            padding: '.9375rem 1rem', borderRadius: '.875rem', marginTop: '1rem',
                            border: `1.5px solid ${errors.agreeTerms ? 'var(--err-bd)' : form.agreeTerms ? '#a5b4fc' : '#e2e8f0'}`,
                            background: errors.agreeTerms ? 'var(--err-lt)' : form.agreeTerms ? 'oklch(0.975 0.018 145)' : '#fff',
                            transition: 'all .2s',
                          }}
                        >
                          <button
                            type="button" role="checkbox" aria-checked={form.agreeTerms}
                            onClick={() => set('agreeTerms', !form.agreeTerms)}
                            style={{
                              width: 20, height: 20, borderRadius: '.375rem', flexShrink: 0, marginTop: 1,
                              border: `2px solid ${form.agreeTerms ? '#4FBA6F' : '#cbd5e1'}`,
                              background: form.agreeTerms ? '#4FBA6F' : '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', transition: 'all .15s',
                              boxShadow: form.agreeTerms ? '0 2px 8px rgba(79,70,229,.28)' : 'none',
                            }}
                          >
                            {form.agreeTerms && <Check size={11} color="#fff" strokeWidth={3}/>}
                          </button>
                          <div>
                            <p style={{ fontSize: '.875rem', color: '#334155', lineHeight: 1.6 }}>
                              I agree to OVDS{' '}
                              <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#4FBA6F', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a>
                              {' '}and{' '}
                              <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#4FBA6F', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>
                            </p>
                            <FieldError msg={errors.agreeTerms}/>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── Navigation buttons ── */}
                  <div style={{ marginTop: '1.625rem', display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
                    <button
                      type="button"
                      className="rgb"
                      disabled={loading || animating}
                      onClick={step === 'review' ? () => void submit() : () => void next()}
                      aria-label={step === 'review' ? 'Create Account' : `Continue to ${STEP_META[STEPS[stepIdx + 1] ?? step].label}`}
                    >
                      {loading
                        ? <><Loader2 size={16} style={{ animation: 'rg-spin 1s linear infinite' }}/>{step === 'review' ? 'Creating account…' : 'Checking…'}</>
                        : step === 'review'
                          ? <><CheckCircle2 size={16}/> Create Account</>
                          : <>Continue <ChevronRight size={15}/></>
                      }
                    </button>

                    {stepIdx > 0 && (
                      <button
                        type="button"
                        onClick={back}
                        disabled={animating}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          fontSize: '.875rem', fontWeight: 600, color: '#94a3b8',
                          padding: '.5rem', borderRadius: '.625rem',
                          transition: 'color .14s, background .14s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.color = '#0f172a';
                          el.style.background = '#f1f5f9';
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLButtonElement;
                          el.style.color = '#94a3b8';
                          el.style.background = 'none';
                        }}
                      >
                        ← Back to {STEP_META[STEPS[stepIdx - 1]].label}
                      </button>
                    )}
                  </div>

                </div>{/* /card padding */}

                {/* ── Trust strip ── */}
                <div style={{
                  borderTop: '1px solid #f1f5f9', background: '#fafafa',
                  padding: '.75rem 2rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '.875rem', flexWrap: 'wrap',
                }}>
                  <span className="rgtb"><Shield size={11} color="#10b981"/> SSL encrypted</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1', display: 'inline-block' }}/>
                  <span className="rgtb"><Lock size={11} color="#10b981"/> No credit card</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1', display: 'inline-block' }}/>
                  <span className="rgtb"><CheckCircle2 size={11} color="#10b981"/> Free forever plan</span>
                </div>

              </div>{/* /card */}

              {/* ── Below-card sign-in note ── */}
              <p style={{ textAlign: 'center', fontSize: '.875rem', color: '#94a3b8', marginTop: '1.5rem' }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{ color: '#4FBA6F', fontWeight: 700, textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
                >
                  Sign in →
                </Link>
              </p>

              {/* ── Social proof strip ── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '.625rem', marginTop: '1.125rem',
              }}>
                <div style={{ display: 'flex' }}>
                  {[
                    { bg: '#4FBA6F', initials: 'TG' },
                    { bg: '#10b981', initials: 'AM' },
                    { bg: '#f59e0b', initials: 'BK' },
                    { bg: '#ef4444', initials: 'YD' },
                    { bg: '#0ea5e9', initials: 'FH' },
                  ].map((av, i) => (
                    <div key={i} style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: av.bg, border: '2.5px solid #f8fafc',
                      marginLeft: i > 0 ? -9 : 0, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.4375rem', fontWeight: 800, color: '#fff',
                    }}>{av.initials}</div>
                  ))}
                </div>
                <span style={{ fontSize: '.8125rem', color: '#94a3b8', fontWeight: 500 }}>
                  Join{' '}
                  <strong style={{ color: '#334155', fontWeight: 700 }}>4,200+</strong>
                  {' '}Ethiopian businesses on OVDS
                </span>
              </div>

            </div>{/* /content column */}
          </div>{/* /form content */}
        </div>{/* /right column */}
      </div>{/* /shell */}
    </div>
  );
};

export default Register;
