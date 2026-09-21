import {
  Lock, User, AlertCircle, CheckCircle2, Loader2,
  Eye, EyeOff, Shield, ArrowRight,
  ChevronLeft, RefreshCw, Smartphone,
  Mail, Zap, Landmark,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link, Navigate } from "react-router-dom";

import LanguageSwitcher from "../components/languageSwitcher";
import { useAuth0Session } from "../hooks/useAuth0Session";
import { rbac, type AppRole } from "../rbac";
import { Auth0LoginButton } from "../rbac/auth0LoginButton";
import type { AuthUser } from "../rbac/AuthContext";
import { useAuth } from "../rbac/AuthContext";
import api from "../services/api";
import { isHttpOnlyAuth, setCsrfToken } from "../utils/authMode";

/* ─── types ──────────────────────────────────────────────────────────── */
type AuthMethod = "email";

/* ─── constants ──────────────────────────────────────────────────────── */
const AUTH0_ENABLED = import.meta.env.VITE_AUTH0_ENABLED === "true";
const Auth0SessionHandler: React.FC = () => { useAuth0Session(); return null; };

/* ── Global CSS (Professional GUI) ─────────────────────────────────── */
const LOGIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
.lp-login {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.lp-login *, .lp-login *::before, .lp-login *::after { box-sizing: border-box; }

/* ── keyframes ── */
@keyframes lp-slide-up { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes lp-fade-in  { from { opacity:0 } to { opacity:1 } }
@keyframes lp-shake    { 0%,100%{transform:translateX(0)} 18%{transform:translateX(-6px)} 36%{transform:translateX(6px)} 54%{transform:translateX(-4px)} 72%{transform:translateX(4px)} 90%{transform:translateX(-1px)} }
@keyframes lp-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes lp-float-b  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes lp-pulse-dot{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
@keyframes lp-ticker   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes lp-shimmer  { 0%{opacity:.3} 50%{opacity:.9} 100%{opacity:.3} }
@keyframes lp-spin     { to{transform:rotate(360deg)} }
@keyframes lp-bar      { 0%{transform:translateX(-100%)} 50%{transform:translateX(60%)} 100%{transform:translateX(200%)} }
@keyframes lp-blob     { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.06) translate(1.5%,1.5%)} }
@keyframes lp-check-in { from{stroke-dashoffset:20;opacity:0} to{stroke-dashoffset:0;opacity:1} }

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}

.lp-su1 { animation: lp-slide-up .55s .00s cubic-bezier(.16,1,.3,1) both; }
.lp-su2 { animation: lp-slide-up .55s .07s cubic-bezier(.16,1,.3,1) both; }
.lp-su3 { animation: lp-slide-up .55s .14s cubic-bezier(.16,1,.3,1) both; }
.lp-su4 { animation: lp-slide-up .55s .21s cubic-bezier(.16,1,.3,1) both; }
.lp-su5 { animation: lp-slide-up .55s .28s cubic-bezier(.16,1,.3,1) both; }
.lp-fade { animation: lp-fade-in .6s .4s both; }
.lp-float-a { animation: lp-float  7s ease-in-out infinite; }
.lp-float-b { animation: lp-float-b 9s 1.2s ease-in-out infinite; }
.lp-shake { animation: lp-shake .5s ease both; }
.lp-spin  { animation: lp-spin 1s linear infinite; }

/* input base */
.lp-input {
  width:100%; padding:.625rem .875rem .625rem 2.5rem;
  border:1.5px solid #e2e8f0; border-radius:.75rem;
  font-size:.875rem; color: var(--ink); background:#fff;
  outline:none; transition:border-color .15s, box-shadow .15s;
  font-family: inherit;
}
.lp-input::placeholder { color: #94a3b8; }
.lp-input:hover { border-color: #c7d2fe; }
.lp-input:focus { border-color: var(--lv); box-shadow: 0 0 0 3px oklch(0.59 0.19 145 / .12); }
.lp-input.error { border-color: #f87171; box-shadow: 0 0 0 3px rgba(239,68,68,.10); background: #fff; }
.lp-input.pr { padding-right:2.75rem; }
.lp-input.mono { font-family: ui-monospace, monospace; letter-spacing:.08em; }

/* primary button */
.lp-btn-primary {
  width:100%; padding:.75rem 1.25rem;
  border:none; border-radius:.875rem;
  font-size:.9375rem; font-weight:700;
  color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem;
  background: var(--lv);
  box-shadow: 0 4px 16px oklch(0.55 0.22 278 / .3);
  transition: all .2s cubic-bezier(.16,1,.3,1);
  font-family: inherit;
}
.lp-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow: 0 6px 24px oklch(0.55 0.22 278 / .4); }
.lp-btn-primary:active:not(:disabled) { transform:translateY(0); }
.lp-btn-primary:disabled { opacity:.55; cursor:not-allowed; }
.lp-btn-primary.success { background: var(--lg); box-shadow: 0 4px 16px oklch(0.59 0.19 155 / .3); }

/* secondary button */
.lp-btn-secondary {
  padding:.625rem 1rem; border-radius:.75rem;
  border: 1.5px solid #e2e8f0; background:#fff;
  font-size:.8125rem; font-weight:600; color: var(--ink-2);
  cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem;
  transition: all .15s;
  font-family: inherit;
}
.lp-btn-secondary:hover { border-color: #c7d2fe; background: var(--lv-dim); color: var(--lv-deep); }

/* otp cell */
.lp-otp-cell {
  width:48px; height:56px; text-align:center; font-size:1.25rem; font-weight:800;
  border:2px solid #e2e8f0; border-radius:.75rem; background:#fff; outline:none;
  color: var(--ink); transition: border-color .15s, box-shadow .15s, background .15s;
  font-family: ui-monospace, monospace;
}
.lp-otp-cell:focus { border-color: var(--lv); box-shadow: 0 0 0 3px oklch(0.59 0.19 145 / .12); }
.lp-otp-cell.filled { border-color: var(--lv); background: #fff; color: var(--lv-deep); }

/* social btn */
.lp-social {
  flex:1; padding:.625rem .875rem; border-radius:.75rem;
  border: 1.5px solid #e2e8f0; background:#fff;
  font-size:.8125rem; font-weight:600; color: var(--ink-2);
  cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.5rem;
  transition: all .15s; white-space:nowrap;
  font-family: inherit;
}
.lp-social:hover { border-color: #c7d2fe; background: #fff; color: var(--lv-deep); box-shadow: 0 2px 8px oklch(0.59 0.19 145 / .10); }

/* method tab */
.lp-tab {
  flex:1; display:flex; flex-direction:column; align-items:center; gap:2px;
  padding:.5rem .25rem; border-radius:.625rem;
  font-size:.6875rem; font-weight:600; color: var(--ink-3);
  border:none; background:transparent; cursor:pointer;
  transition: all .15s;
  font-family: inherit;
}
.lp-tab:hover { background: rgba(255,255,255,.6); color: var(--ink-2); }
.lp-tab.active { background:#fff; color: var(--lv-deep); box-shadow: 0 1px 6px rgba(0,0,0,.07); font-weight:700; }

/* ticker — kept for potential reuse */
/* .lp-ticker-track { display:flex; width:max-content; animation: lp-ticker 55s linear infinite; } */

/* ss-shadow */
.lp-ss-shadow {
  box-shadow:
    0 0 0 1px #e2e8f0,
    0 24px 64px -12px oklch(0.55 0.22 278 / .18),
    0 8px 24px -4px rgba(0,0,0,.10);
}
`;

/* ─── password strength ──────────────────────────────────────────────── */
function getPasswordStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw))  s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: "Weak",   color: "#ef4444" };
  if (s <= 2) return { score: s, label: "Fair",   color: "#f59e0b" };
  if (s <= 3) return { score: s, label: "Good",   color: "var(--lv-light)" };
  return              { score: s, label: "Strong", color: "var(--lg)" };
}

const StrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2" role="status" aria-label={`Password strength: ${label}`}>
      <div style={{ display:"flex", gap:4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            height:4, flex:1, borderRadius:4,
            background: i <= score ? color : "#e2e8f0",
            transition: "background .3s",
          }} />
        ))}
      </div>
      <p style={{ fontSize:".6875rem", fontWeight:700, color, marginTop:4 }}>{label}</p>
    </div>
  );
};

/* ─── OTP Input ──────────────────────────────────────────────────────── */
const OtpInput: React.FC<{ value: string; onChange: (v: string) => void; onComplete?: () => void }> = ({ value, onChange, onComplete }) => {
  const r0 = useRef<HTMLInputElement>(null);
  const r1 = useRef<HTMLInputElement>(null);
  const r2 = useRef<HTMLInputElement>(null);
  const r3 = useRef<HTMLInputElement>(null);
  const r4 = useRef<HTMLInputElement>(null);
  const r5 = useRef<HTMLInputElement>(null);
  const refs = [r0, r1, r2, r3, r4, r5];
  const digits = value.padEnd(6, " ").split("").slice(0, 6);
  const handle = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = d || " ";
    const str = next.join("").trimEnd();
    onChange(str);
    if (d && i < 5) refs[i + 1].current?.focus();
    if (str.replace(/ /g, "").length === 6) onComplete?.();
  };
  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && digits[i].trim() === "" && i > 0) refs[i - 1].current?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); if (pasted.length === 6) onComplete?.(); }
    e.preventDefault();
  };
  return (
    <div style={{ display:"flex", gap:8, justifyContent:"center" }} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1}
          value={d.trim()} onChange={e => handle(i, e)} onKeyDown={e => handleKey(i, e)}
          aria-label={`Digit ${i + 1} of 6`} autoComplete="one-time-code"
          className={`lp-otp-cell${d.trim() ? " filled" : ""}`} />
      ))}
    </div>
  );
};





/* ─── Left Brand Panel — name only, clean white ───────────────── */
const BrandPanel: React.FC = () => (
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
    </div>
  </div>
);


/* ─── Field wrapper ──────────────────────────────────────────────────── */
const Field: React.FC<{
  label: React.ReactNode; id?: string; htmlFor?: string;
  icon?: React.ElementType; right?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, htmlFor, icon: Icon, right, children }) => (
  <div>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
      <label htmlFor={htmlFor} style={{ fontSize:".75rem", fontWeight:700, color:"var(--ink-2)" }}>{label}</label>
      {right}
    </div>
    <div style={{ position:"relative" }}>
      {Icon && <Icon size={14} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--ink-3)", pointerEvents:"none" }} />}
      {children}
    </div>
  </div>
);

/* ─── Alert ──────────────────────────────────────────────────────────── */
const Alert: React.FC<{ type: "success" | "error"; text: string; onDismiss: () => void }> = ({ type, text, onDismiss }) => (
  <div role="alert" aria-live={type === "error" ? "assertive" : "polite"} aria-atomic style={{
    display:"flex", alignItems:"flex-start", gap:10, padding:".875rem 1rem",
    borderRadius:12,
    border:`1.5px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
    background:"#fff",
    boxShadow: type === "success" ? "0 1px 6px rgba(16,185,129,.08)" : "0 1px 6px rgba(239,68,68,.08)",
    animation:"lp-slide-up .3s cubic-bezier(.16,1,.3,1) both",
    marginBottom:"1.25rem",
  }}>
    {type === "success"
      ? <CheckCircle2 size={15} style={{ flexShrink:0, marginTop:1, color:"#10b981" }} />
      : <AlertCircle  size={15} style={{ flexShrink:0, marginTop:1, color:"#ef4444" }} />}
    <span style={{ flex:1, fontSize:".8125rem", fontWeight:600, color: type === "success" ? "#065f46" : "#b91c1c" }}>{text}</span>
    <button type="button" onClick={onDismiss} aria-label="Dismiss"
      style={{ flexShrink:0, padding:2, borderRadius:6, border:"none", background:"transparent", cursor:"pointer", color:"#94a3b8", display:"flex", alignItems:"center" }}>
      <AlertCircle size={12} />
    </button>
  </div>
);

/* ─── Primary button ─────────────────────────────────────────────────── */
const SubmitBtn: React.FC<{ loading: boolean; success: boolean; label?: string; icon?: React.ReactNode }> = ({
  loading, success, label = "Sign In", icon,
}) => (
  <button type="submit" disabled={loading} className={`lp-btn-primary${success ? " success" : ""}`}>
    {loading
      ? <><Loader2 size={15} className="lp-spin" /> Signing in…</>
      : success
      ? <><CheckCircle2 size={15} /> Signed in!</>
      : <>{icon ?? <ArrowRight size={15} />} {label}</>}
  </button>
);

/* ─── OTP action button ──────────────────────────────────────────────── */
const OtpBtn: React.FC<{
  loading: boolean; disabled?: boolean; onClick: () => void;
  label: string; loadingLabel?: string; icon?: React.ReactNode; color?: string;
}> = ({ loading, disabled, onClick, label, loadingLabel = "Sending…", icon, color }) => (
  <button type="button" disabled={loading || disabled} onClick={onClick}
    className="lp-btn-primary"
    style={{ background: color ?? "var(--lv)", boxShadow: `0 4px 16px ${color ?? "oklch(0.59 0.19 145)"} / .3)` }}>
    {loading ? <><Loader2 size={15} className="lp-spin" /> {loadingLabel}</> : <>{icon} {label}</>}
  </button>
);

/* ─── Resend row ─────────────────────────────────────────────────────── */
const ResendRow: React.FC<{ cd: number; onResend: () => void }> = ({ cd, onResend }) =>
  cd > 0 ? (
    <p style={{ textAlign:"center", fontSize:".75rem", color:"var(--ink-3)", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
      <RefreshCw size={11} className="lp-spin" /> Resend available in {cd}s
    </p>
  ) : (
    <button type="button" onClick={onResend}
      style={{ display:"flex", alignItems:"center", gap:6, margin:"0 auto", fontSize:".75rem", fontWeight:700, color:"var(--lv)", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
      <RefreshCw size={11}/> Resend code
    </button>
  );

/* ─── Back button ────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick}
    style={{ display:"flex", alignItems:"center", gap:4, fontSize:".75rem", fontWeight:600, color:"var(--ink-3)", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
    <ChevronLeft size={13}/> Change
  </button>
);

/* ══════════════════════════════════════════════════════════════════════
   Main Login component
   ══════════════════════════════════════════════════════════════════════ */
const Login: React.FC = () => {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading]   = useState(false);
  const [showPw,  setShowPw]    = useState(false);
  const [capsLock, setCaps]     = useState(false);
  const [msg, setMsg]           = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [fails, setFails]       = useState(0);
  const [remember, setRemember] = useState(() => !!localStorage.getItem("remembered_username"));
  const [focused, setFocused]   = useState<string | null>(null);
  const [shake, setShake]       = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [showStr, setShowStr]   = useState(false);
  const [method] = useState<AuthMethod>("email");

  /* 2FA */
  const [mfaChallenge, setMfaChallenge] = useState<{
    userId: string; username: string; sentTo: string; dev_code?: string;
  } | null>(null);
  const [mfaOtp, setMfaOtp] = useState("");
  const [mfaCD,  setMfaCd]  = useState(0);

  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("remembered_username");
    if (saved) setFormData(p => ({ ...p, username: saved }));
    const timer = setTimeout(() => setMounted(true), 60);
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setMsg({ type: "error", text: decodeURIComponent(urlError) });
      window.history.replaceState({}, "", window.location.pathname);
    }
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { if (mfaCD <= 0) return; const i = setInterval(() => setMfaCd(s => s - 1), 1000); return () => clearInterval(i); }, [mfaCD]);

  if (isAuthenticated && user) return <Navigate to={rbac.defaultRoute(user.role)} replace />;

  const doErr = (text: string) => {
    setFails(f => f + 1); setMsg({ type: "error", text }); setLoading(false);
    setShake(true); setTimeout(() => setShake(false), 550);
  };
  const doOk = (token: string | null, u: AuthUser, csrf?: string) => {
    login(token, u, csrf);
    setFails(0);
    setMsg({ type: "success", text: "Login successful! Redirecting…" });
    setLoading(false);
    setTimeout(() => navigate(rbac.defaultRoute((u?.role ?? "EMPLOYEE") as AppRole)), 900);
  };

  const completeAuth = (data: {
    access_token?: string;
    user: AuthUser;
    csrf_token?: string;
    token_delivery?: string;
  }) => {
    if (data.csrf_token) setCsrfToken(data.csrf_token);
    const token =
      data.token_delivery === "cookie" || isHttpOnlyAuth()
        ? null
        : (data.access_token ?? null);
    doOk(token, data.user, data.csrf_token);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Synchronous guard — setState is async so the button's `disabled` prop
    // won't prevent rapid Enter-key presses from firing multiple submissions
    // before the re-render happens.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true); setMsg(null); setShake(false);
    try {
      const res  = await api.post("/auth/login", formData);
      const data = res.data?.data ?? res.data;
      if (data?.mfa_required) {
        setMfaChallenge({ userId: data.userId, username: data.username, sentTo: data.sentTo, dev_code: data.dev });
        setMfaCd(60); setLoading(false);
        setMsg({ type: "success", text: `A 2FA code was sent to ${data.sentTo}` });
        submittingRef.current = false;
        return;
      }
      const typed = data as { access_token?: string; user: AuthUser; csrf_token?: string; token_delivery?: string };
      if (remember) localStorage.setItem("remembered_username", formData.username);
      else          localStorage.removeItem("remembered_username");
      completeAuth(typed);
    } catch (err: any) {
      doErr(err.response?.data?.message || t("login_failed") || "Invalid credentials");
    } finally {
      submittingRef.current = false;
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaChallenge || mfaOtp.length < 6) return;
    setLoading(true); setMsg(null);
    try {
      const res  = await api.post("/auth/otp/2fa", { userId: mfaChallenge.userId, otp: mfaOtp });
      const data = (res.data?.data ?? res.data) as { access_token?: string; user: AuthUser; csrf_token?: string; token_delivery?: string };
      completeAuth(data);
    } catch (err: any) { doErr(err.response?.data?.message || "Invalid 2FA code."); setMfaOtp(""); }
  };

  const handleResendMfa = async () => {
    if (!mfaChallenge) return; setLoading(true); setMsg(null);
    try {
      await api.post("/auth/otp/send", { target: mfaChallenge.sentTo, channel: "email" });
      setMfaCd(60); setMfaOtp(""); setMsg({ type: "success", text: "A new code was sent." });
    } catch (err: any) { doErr(err.response?.data?.message || "Failed to resend."); }
    finally { setLoading(false); }
  };

  /* ─── render ──────────────────────────────────────────────────────── */
  return (
    <>
      <style>{LOGIN_CSS}</style>
      {AUTH0_ENABLED && <Auth0SessionHandler />}

      <div className="lp-login" style={{ minHeight:"100vh", display:"flex", background:"#fff", opacity: mounted?1:0, transition:"opacity .4s ease", fontFamily:"'Inter', ui-sans-serif, system-ui, sans-serif" }}>

        {/* ── Left brand panel (sticky) ── */}
        <div style={{ width:"43%", maxWidth:520, flexShrink:0, position:"sticky", top:0, height:"100vh", overflow:"hidden" }} className="hidden lg:block">
          <BrandPanel />
        </div>

        {/* ── Right form panel ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", background:"#fff", overflowY:"auto" }}>

          {/* header */}
          <header style={{ position:"sticky", top:0, zIndex:10, display:"flex", alignItems:"center", justifyContent:"space-between", padding:".875rem 2.5rem", borderBottom:"1px solid #f1f5f9", background:"#fff", backdropFilter:"blur(16px)" }}>
            {/* name (mobile only) */}
            <div className="lg:hidden" style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:".9375rem", color:"var(--ink)", letterSpacing:"-0.025em", lineHeight:1.1 }}>OVDS FINCLOUD</div>
              </div>
            </div>
            <div className="hidden lg:block" />
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <LanguageSwitcher variant="select" />
              <Link to="/register"
                style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:".8125rem", fontWeight:700, color:"var(--lv)", border:"1.5px solid #c7d2fe", borderRadius:999, padding:".375rem .875rem", textDecoration:"none", transition:"all .15s", background:"#fff" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background="#eff6ff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background="#fff"; }}>
                Create account <ArrowRight size={12} />
              </Link>
            </div>
          </header>

          {/* progress bar */}
          {loading && (
            <div style={{ position:"fixed", top:0, left:0, right:0, height:3, background:"#e0e7ff", zIndex:50 }}>
              <div style={{ position:"absolute", top:0, left:0, bottom:0, width:"40%", background:"var(--lv)", animation:"lp-bar 1.4s ease-in-out infinite", borderRadius:3 }} />
            </div>
          )}

          {/* main */}
          <main style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"2.5rem 1.25rem", background:"#fff" }}>
            <div style={{ width:"100%", maxWidth:420 }}>

              {/* ── Page heading ── */}
              <div className="lp-su1" style={{ marginBottom:"2rem" }}>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:999, background:"#f8fafc", border:"1px solid #e2e8f0", fontSize:".6875rem", fontWeight:700, color:"var(--lv-deep)", marginBottom:".875rem" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--lv)", display:"inline-block", animation:"lp-pulse-dot 2s infinite" }}/>
                  Secure sign in
                </div>
                <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--ink)", letterSpacing:"-0.03em", lineHeight:1.15, marginBottom:".375rem" }}>
                  Welcome back
                </h1>
                <p style={{ fontSize:".875rem", color:"var(--ink-3)", lineHeight:1.5 }}>Sign in to your OVDS workspace</p>
              </div>

              {/* ── Alert ── */}
              {msg && <Alert type={msg.type} text={msg.text} onDismiss={() => setMsg(null)} />}

              {/* ── Too many failures ── */}
              {fails >= 3 && (
                <div role="alert" style={{ display:"flex", alignItems:"flex-start", gap:10, padding:".875rem 1rem", borderRadius:12, border:"1.5px solid #fed7aa", background:"#fff", boxShadow:"0 1px 6px rgba(234,88,12,.08)", marginBottom:"1rem", animation:"lp-slide-up .3s both" }}>
                  <AlertCircle size={14} style={{ flexShrink:0, marginTop:2, color:"#ea580c" }} />
                  <span style={{ fontSize:".8125rem", fontWeight:600, color:"#9a3412" }}>
                    {fails} failed attempts. <Link to="/settings?tab=profile" style={{ textDecoration:"underline", fontWeight:700, color:"inherit" }}>Reset password</Link>
                  </span>
                </div>
              )}

              {/* ══ 2FA challenge ══ */}
              {mfaChallenge ? (
                <div className={shake ? "lp-shake" : ""} style={{ display:"flex", flexDirection:"column", gap:"1rem", animation:"lp-slide-up .35s cubic-bezier(.16,1,.3,1) both" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"1rem 1.125rem", borderRadius:14, border:"1.5px solid #e0e7ff", background:"#fff", boxShadow:"0 1px 6px rgba(79,186,111,.08)" }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:"var(--lv)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 4px 14px oklch(0.55 0.22 278 / .3)" }}>
                      <Shield size={18} style={{ color:"#fff" }} />
                    </div>
                    <div>
                      <p style={{ fontSize:".875rem", fontWeight:700, color:"var(--ink)", marginBottom:3 }}>Two-Factor Authentication</p>
                      <p style={{ fontSize:".8125rem", color:"var(--ink-3)", lineHeight:1.4 }}>
                        Code sent to <strong style={{ fontWeight:700, color:"var(--ink-2)" }}>{mfaChallenge.sentTo}</strong>
                      </p>
                      {mfaChallenge.dev_code && (
                        <span style={{ display:"inline-block", marginTop:6, fontSize:".6875rem", fontWeight:700, color:"var(--lv-deep)", background:"#f8fafc", border:"1px solid #e2e8f0", padding:"2px 10px", borderRadius:6 }}>
                          Dev code: {mfaChallenge.dev_code}
                        </span>
                      )}
                    </div>
                  </div>

                  <OtpInput value={mfaOtp} onChange={setMfaOtp} onComplete={handleVerifyMfa} />
                  <ResendRow cd={mfaCD} onResend={handleResendMfa} />

                  <OtpBtn loading={loading} disabled={mfaOtp.replace(/ /g, "").length < 6}
                    onClick={handleVerifyMfa} label="Verify & Continue" loadingLabel="Verifying…"
                    icon={<Shield size={14}/>} />

                  <button type="button" onClick={() => { setMfaChallenge(null); setMfaOtp(""); setMsg(null); }}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontSize:".75rem", color:"var(--ink-3)", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", marginTop:4 }}>
                    <ChevronLeft size={12}/> Back to sign in
                  </button>
                </div>
              ) : (
                <>
                  {/* ══ EMAIL form ══ */}
                  {method === "email" && (
                    <form ref={formRef} onSubmit={handleEmailSubmit} noValidate
                      className={`lp-su4${shake ? " lp-shake" : ""}`}
                      style={{ display:"flex", flexDirection:"column", gap:"1.125rem" }}>

                      <Field label={t("username") || "Email / Username"} htmlFor="l-user" icon={User}>
                        <input id="l-user" data-testid="login-username"
                          type="text" required autoComplete="username" autoFocus
                          value={formData.username}
                          onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                          onFocus={() => setFocused("user")} onBlur={() => setFocused(null)}
                          placeholder="you@company.com"
                          aria-invalid={msg?.type === "error" && !formData.username}
                          className={`lp-input${msg?.type === "error" && !formData.username ? " error" : ""}`} />
                        {formData.username && focused !== "user" && (
                          <CheckCircle2 size={13} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"var(--lv)" }} />
                        )}
                      </Field>

                      <Field
                        label={t("password") || "Password"}
                        htmlFor="l-pw"
                        icon={Lock}
                        right={
                          <Link to="/settings?tab=profile" tabIndex={-1}
                            style={{ fontSize:".75rem", fontWeight:700, color:"var(--lv)", textDecoration:"none" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color="var(--lv-deep)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color="var(--lv)"; }}>
                            Forgot password?
                          </Link>
                        }>
                        <input id="l-pw" data-testid="login-password"
                          type={showPw ? "text" : "password"} required autoComplete="current-password"
                          value={formData.password}
                          onChange={e => { setFormData(p => ({ ...p, password: e.target.value })); setShowStr(true); }}
                          onFocus={() => setFocused("pw")} onBlur={() => setFocused(null)}
                          onKeyDown={e => setCaps(e.getModifierState("CapsLock"))}
                          onKeyUp={e => setCaps(e.getModifierState("CapsLock"))}
                          placeholder="••••••••"
                          aria-describedby={capsLock ? "l-pw-caps" : undefined}
                          className={`lp-input pr${msg?.type === "error" && !formData.password ? " error" : ""}`} />
                        <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                          aria-label={showPw ? "Hide password" : "Show password"}
                          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--ink-3)", padding:4, display:"flex", alignItems:"center", borderRadius:6 }}>
                          {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                        {showStr && <StrengthBar password={formData.password} />}
                        {capsLock && (
                          <p id="l-pw-caps" style={{ display:"flex", alignItems:"center", gap:6, fontSize:".6875rem", fontWeight:700, color:"#ea580c", marginTop:4 }}>
                            <AlertCircle size={11}/> Caps Lock is on
                          </p>
                        )}
                      </Field>

                      {/* remember me */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                          <input type="checkbox" id="l-remember" checked={remember}
                            onChange={e => setRemember(e.target.checked)}
                            aria-label="Remember me"
                            style={{ position:"absolute", opacity:0, width:0, height:0 }} />
                          <div style={{
                            width:18, height:18, borderRadius:5, border:`2px solid ${remember ? "var(--lv)" : "#e2e8f0"}`,
                            background: remember ? "var(--lv)" : "#fff",
                            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                            transition:"all .15s",
                          }}>
                            {remember && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span style={{ fontSize:".8125rem", fontWeight:500, color:"var(--ink-3)", userSelect:"none" }}>Remember me</span>
                        </label>
                        <kbd style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:".6875rem", color:"#94a3b8", background:"#f8fafc", border:"1px solid #e2e8f0", padding:"2px 8px", borderRadius:6, fontFamily:"ui-monospace,monospace" }}>⏎ Enter</kbd>
                      </div>

                      <SubmitBtn loading={loading} success={msg?.type === "success"} />
                    </form>
                  )}

                  {/* ── Sign up link ── */}
                  <div className="lp-fade" style={{ marginTop:"1.75rem", textAlign:"center" }}>
                    <p style={{ fontSize:".8125rem", color:"var(--ink-3)" }}>
                      No account?{" "}
                      <Link to="/register"
                        style={{ fontWeight:700, color:"var(--lv)", textDecoration:"none" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color="var(--lv-deep)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color="var(--lv)"; }}>
                        Create one free →
                      </Link>
                    </p>
                  </div>

                  {/* ── Trust badges — pill style ── */}
                  <div className="lp-fade" style={{ marginTop:"1.5rem", paddingTop:"1.25rem", borderTop:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", gap:".625rem", flexWrap:"wrap" }}>
                    {[
                      { Icon: Shield,       label: "256-bit TLS"       },
                      { Icon: CheckCircle2, label: "ISO 27001 Ready"   },
                      { Icon: Zap,          label: "99.9% Uptime"      },
                    ].map(({ Icon, label }) => (
                      <span key={label} style={{
                        display:"inline-flex", alignItems:"center", gap:5,
                        fontSize:".6875rem", fontWeight:600, color:"#64748b",
                        padding:".3125rem .625rem", borderRadius:999,
                        background:"#f8fafc", border:"1px solid #e2e8f0",
                      }}>
                        <Icon size={11} style={{ color:"var(--lv)" }} /> {label}
                      </span>
                    ))}
                  </div>
                </>
              )}

            </div>
          </main>

          {/* footer */}
          <footer style={{ padding:".875rem 2.5rem", borderTop:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fff" }}>
            <p style={{ fontSize:".6875rem", color:"var(--ink-3)" }}>© {new Date().getFullYear()} OVDS AI ERP · Ethiopia 🇪🇹</p>
            <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:".6875rem", color:"var(--ink-3)" }}>
              <Link to="/privacy" style={{ color:"inherit", textDecoration:"none", transition:"color .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color="var(--lv)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color="var(--ink-3)"; }}>Privacy</Link>
              <span style={{ opacity:.4 }}>·</span>
              <Link to="/terms" style={{ color:"inherit", textDecoration:"none", transition:"color .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color="var(--lv)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color="var(--ink-3)"; }}>Terms</Link>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Login;
