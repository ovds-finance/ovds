import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, X, Moon, Sun, ArrowRight, Check,
  FileText, Calculator, Users, BarChart3, Shield,
  Zap, Database, Landmark, ChevronDown,
  Package, Receipt, ScanLine, Anchor, Ship, Star,
  Globe, TrendingUp, Lock, Repeat, CreditCard, BookOpen,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   Akaunting-inspired: clean white surfaces, indigo-violet primary,
   large product mockups, generous radius, soft gradient backgrounds.
   ───────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
.lp { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #fff; }
.lp h1,.lp h2,.lp h3,.lp h4 {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

/* ── keyframes ── */
@keyframes ticker    { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes slideUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn    { from{opacity:0} to{opacity:1} }
@keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes floatY2   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes blobPulse { 0%,100%{transform:scale(1) translate(0,0)} 50%{transform:scale(1.08) translate(2%,2%)} }
@keyframes spinSlow  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes pulseDot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.75)} }

@media (prefers-reduced-motion:reduce){
  *,::before,::after{ animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; }
}

.su1 { animation: slideUp .65s .00s cubic-bezier(.16,1,.3,1) both; }
.su2 { animation: slideUp .65s .10s cubic-bezier(.16,1,.3,1) both; }
.su3 { animation: slideUp .65s .20s cubic-bezier(.16,1,.3,1) both; }
.su4 { animation: slideUp .65s .30s cubic-bezier(.16,1,.3,1) both; }
.su5 { animation: slideUp .65s .40s cubic-bezier(.16,1,.3,1) both; }
.fi  { animation: fadeIn  .9s  .45s both; }

.ticker-track { display:flex; width:max-content; animation:ticker 55s linear infinite; }
.ticker-track:hover{ animation-play-state:paused; }

.float-a { animation: floatY  7s ease-in-out infinite; }
.float-b { animation: floatY2 9s 1s ease-in-out infinite; }
.float-c { animation: floatY  11s 2s ease-in-out infinite; }
.blob { animation: blobPulse 12s ease-in-out infinite; }

/* cards */
.feat-card {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 1.25rem;
  padding: 1.5rem;
  transition: box-shadow .2s ease, transform .2s cubic-bezier(.16,1,.3,1), border-color .2s;
  cursor: default;
}
.feat-card:hover {
  box-shadow: 0 12px 32px -8px rgba(99,102,241,.12), 0 2px 8px -2px rgba(0,0,0,.06);
  transform: translateY(-2px);
  border-color: oklch(0.82 0.08 278);
}

/* pill badge */
.badge {
  display:inline-flex; align-items:center; gap:.375rem;
  font-size:.6875rem; font-weight:700; padding:.25rem .75rem;
  border-radius:999px; letter-spacing:.04em;
}
.badge-v { background:oklch(0.94 0.04 278); color:oklch(0.40 0.18 278); }
.badge-g { background:oklch(0.94 0.04 155); color:oklch(0.38 0.16 155); }

/* screenshot shadow */
.ss-shadow {
  box-shadow:
    0 0 0 1px oklch(0.88 0.02 258),
    0 24px 64px -12px rgba(99,102,241,.18),
    0 8px 24px -4px rgba(0,0,0,.10);
}

/* btn */
.btn-primary {
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.8125rem 1.625rem; border-radius:.875rem;
  font-size:.9375rem; font-weight:700;
  background:var(--violet); color:#fff;
  box-shadow:0 4px 20px oklch(0.55 0.22 278 / .35);
  transition:all .2s cubic-bezier(.16,1,.3,1);
  text-decoration:none;
}
.btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px oklch(0.55 0.22 278 / .45); }
.btn-secondary {
  display:inline-flex; align-items:center; gap:.5rem;
  padding:.8125rem 1.625rem; border-radius:.875rem;
  font-size:.9375rem; font-weight:600;
  background:#fff; color:var(--ink);
  border:1.5px solid var(--border);
  box-shadow:0 1px 4px rgba(0,0,0,.06);
  transition:all .2s;
  text-decoration:none;
}
.btn-secondary:hover { transform:translateY(-1px); border-color:oklch(.75 .08 278); box-shadow:0 4px 16px rgba(0,0,0,.09); }

/* section divider */
.section-pill {
  display:inline-flex; align-items:center; gap:.5rem;
  font-size:.8125rem; font-weight:700; padding:.375rem .875rem;
  border-radius:999px; margin-bottom:1.25rem;
  background:var(--violet-dim); color:var(--violet);
}
`;

/* ── Intersection reveal hook ─────────────────────────────────────────── */
function useReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [fired, setFired] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setFired(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, fired };
}

/* ── Ticker ────────────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  'VAT · TOT · WHT · PIT · DRRF · BIT',
  'AI-Powered Receipt OCR',
  'Real-Time Bank Sync',
  'TASS SRM Fiscal Validation',
  'MoR Proclamation 1341/2024 Compliant',
  'Customs Tax Simulator · e-SAD',
  'IFRS Financial Reports',
  'Amharic · Tigrinya · English',
  'Self-Host · Docker Ready',
  'Graduate Tax & Pension Automation',
];

function TickerBar() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ background:'oklch(0.55 0.22 278)', overflow:'hidden', height:'36px', display:'flex', alignItems:'center' }}>
      <div className="ticker-track">
        {items.map((item, i) => (
          <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0 1.5rem', whiteSpace:'nowrap', fontSize:'0.75rem', fontWeight:600, color:'rgba(255,255,255,0.9)' }}>
            <span style={{ width:4, height:4, borderRadius:'50%', background:'rgba(255,255,255,0.6)', display:'inline-block', flexShrink:0 }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Navbar ────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Platform',    href: '#platform' },
  { label: 'Tax Engine',  href: '#tax' },
  { label: 'Features',    href: '#features' },
  { label: 'Pricing',     href: '#pricing' },
  { label: 'Docs',        href: '/docs', internal: true },
];

function Navbar({ dark, toggleDark }: { dark: boolean; toggleDark: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 50,
    background: scrolled ? 'rgba(255,255,255,0.95)' : '#fff',
    backdropFilter: scrolled ? 'blur(16px)' : 'none',
    borderBottom: `1px solid ${scrolled ? 'oklch(0.91 0.01 258)' : 'transparent'}`,
    boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.07)' : 'none',
    transition: 'all 0.3s',
  };

  const linkStyle: React.CSSProperties = {
    padding: '0.5rem 0.875rem', borderRadius: '0.625rem',
    fontSize: '0.9rem', fontWeight: 500,
    color: 'oklch(0.35 0.03 258)', textDecoration: 'none',
    transition: 'all 0.15s',
  };

  return (
    <nav style={navStyle}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:'0.625rem', textDecoration:'none' }}>
          <div style={{ width:38, height:38, borderRadius:'0.75rem', background:'oklch(0.55 0.22 278)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px oklch(0.55 0.22 278 / .3)' }}>
            <Landmark size={18} style={{ color:'#fff' }} />
          </div>
          <div style={{ lineHeight:1.1 }}>
            <div style={{ fontWeight:800, fontSize:'1rem', color:'oklch(0.18 0.02 258)', letterSpacing:'-0.02em' }}>OVDS</div>
            <div style={{ fontSize:'0.625rem', fontWeight:700, color:'oklch(0.55 0.22 278)', letterSpacing:'0.06em' }}>finCloud</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.25rem' }} className="hidden md:flex">
          {NAV_LINKS.map(l =>
            l.internal ? (
              <Link key={l.href} to={l.href} style={linkStyle}>{l.label}</Link>
            ) : (
              <a key={l.href} href={l.href} style={linkStyle}>{l.label}</a>
            )
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <button onClick={toggleDark} style={{ padding:'0.5rem', borderRadius:'0.5rem', background:'transparent', border:'none', cursor:'pointer', color:'oklch(0.52 0.02 258)' }}>
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
          <Link to="/login" className="hidden sm:inline-flex" style={{ ...linkStyle, color:'oklch(0.40 0.03 258)' }}>Sign in</Link>
          <Link to="/register" className="btn-primary" style={{ padding:'0.625rem 1.25rem', fontSize:'0.875rem', borderRadius:'0.75rem' }}>
            Get Started <ArrowRight size={14}/>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(o => !o)}
            style={{ padding:'0.5rem', borderRadius:'0.5rem', background:'transparent', border:'none', cursor:'pointer', color:'oklch(0.40 0.03 258)' }}>
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ borderTop:'1px solid oklch(0.91 0.01 258)', padding:'0.75rem 1rem 1rem', display:'flex', flexDirection:'column', gap:'0.25rem' }}>
          {NAV_LINKS.map(l =>
            l.internal ? (
              <Link key={l.href} to={l.href} onClick={()=>setOpen(false)} style={{ ...linkStyle, display:'block', padding:'0.625rem 0.75rem' }}>{l.label}</Link>
            ) : (
              <a key={l.href} href={l.href} onClick={()=>setOpen(false)} style={{ ...linkStyle, display:'block', padding:'0.625rem 0.75rem' }}>{l.label}</a>
            )
          )}
          <div style={{ paddingTop:'0.75rem', borderTop:'1px solid oklch(0.91 0.01 258)', marginTop:'0.25rem' }}>
            <Link to="/register" className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
              Get Started  <ArrowRight size={14}/>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ── Dashboard SVG mockup ─────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="ss-shadow" style={{
      borderRadius:'1.25rem', overflow:'hidden', background:'#fff',
      border:'1px solid oklch(0.91 0.01 258)',
      userSelect:'none',
    }}>
      {/* Window chrome */}
      <div style={{ background:'oklch(0.975 0.006 258)', padding:'0.75rem 1rem', display:'flex', alignItems:'center', gap:'0.5rem', borderBottom:'1px solid oklch(0.91 0.01 258)' }}>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#ff5f57', display:'inline-block' }}/>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#febc2e', display:'inline-block' }}/>
        <span style={{ width:10, height:10, borderRadius:'50%', background:'#28c840', display:'inline-block' }}/>
        <span style={{ flex:1, display:'flex', justifyContent:'center' }}>
          <span style={{ background:'#fff', border:'1px solid oklch(0.88 0.01 258)', borderRadius:'0.5rem', padding:'0.25rem 1rem', fontSize:'0.7rem', color:'oklch(0.52 0.02 258)', fontFamily:'monospace' }}>
            app.ovds.et / dashboard
          </span>
        </span>
      </div>

      {/* Sidebar + content */}
      <div style={{ display:'flex', height:'360px' }}>
        {/* Mini sidebar */}
        <div style={{ width:'52px', background:'oklch(0.18 0.02 258)', display:'flex', flexDirection:'column', alignItems:'center', padding:'0.75rem 0', gap:'1.25rem', flexShrink:0 }}>
          <div style={{ width:28, height:28, borderRadius:'0.5rem', background:'oklch(0.55 0.22 278)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Landmark size={14} style={{ color:'#fff' }}/>
          </div>
          {[BarChart3, FileText, Users, Receipt, Shield, Database].map((Icon, i) => (
            <Icon key={i} size={16} style={{ color: i===0 ? 'oklch(0.72 0.14 278)' : 'oklch(0.42 0.03 258)', flexShrink:0 }}/>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex:1, padding:'1rem', background:'oklch(0.975 0.006 258)', overflowY:'hidden', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {/* Header row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'0.8125rem', fontWeight:700, color:'oklch(0.18 0.02 258)' }}>Dashboard</span>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <span style={{ background:'#fff', border:'1px solid oklch(0.88 0.01 258)', borderRadius:'0.5rem', padding:'0.25rem 0.625rem', fontSize:'0.6875rem', color:'oklch(0.45 0.02 258)' }}>Jul 2026</span>
              <div style={{ width:24, height:24, borderRadius:'0.5rem', background:'oklch(0.55 0.22 278)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <TrendingUp size={12} style={{ color:'#fff' }}/>
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem' }}>
            {[
              { label:'Revenue',  value:'ETB 482K', delta:'+12%', up:true, accent:'oklch(0.55 0.22 278)' },
              { label:'Expenses', value:'ETB 138K', delta:'-4%',  up:false, accent:'oklch(0.59 0.19 155)' },
              { label:'Net Tax',  value:'ETB 54K',  delta:'+7%',  up:true, accent:'oklch(0.72 0.16 50)' },
            ].map(k => (
              <div key={k.label} style={{ background:'#fff', borderRadius:'0.75rem', padding:'0.625rem 0.75rem', border:'1px solid oklch(0.91 0.01 258)' }}>
                <div style={{ fontSize:'0.625rem', color:'oklch(0.52 0.02 258)', marginBottom:'0.25rem' }}>{k.label}</div>
                <div style={{ fontSize:'0.875rem', fontWeight:800, color:'oklch(0.18 0.02 258)', letterSpacing:'-0.02em' }}>{k.value}</div>
                <div style={{ fontSize:'0.625rem', fontWeight:700, color: k.up ? 'oklch(0.50 0.17 155)' : 'oklch(0.55 0.20 25)', marginTop:'0.125rem' }}>{k.delta}</div>
              </div>
            ))}
          </div>

          {/* Chart + list side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:'0.5rem', flex:1 }}>
            {/* Bar chart mockup */}
            <div style={{ background:'#fff', borderRadius:'0.75rem', padding:'0.75rem', border:'1px solid oklch(0.91 0.01 258)' }}>
              <div style={{ fontSize:'0.625rem', color:'oklch(0.52 0.02 258)', marginBottom:'0.625rem', fontWeight:600 }}>Monthly Revenue</div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', height:'80px' }}>
                {[35,55,42,70,48,82,60,78,54,68,88,100].map((h,i) => (
                  <div key={i} style={{ flex:1, borderRadius:'3px 3px 0 0', height:`${h}%`,
                    background: i===11 ? 'oklch(0.55 0.22 278)' : `oklch(0.55 0.22 278 / ${0.15 + i*0.05})` }}/>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.5rem', color:'oklch(0.65 0.01 258)', marginTop:'4px' }}>
                <span>Jan</span><span>Jun</span><span>Dec</span>
              </div>
            </div>

            {/* Tx list */}
            <div style={{ background:'#fff', borderRadius:'0.75rem', padding:'0.75rem', border:'1px solid oklch(0.91 0.01 258)' }}>
              <div style={{ fontSize:'0.625rem', color:'oklch(0.52 0.02 258)', marginBottom:'0.625rem', fontWeight:600 }}>Recent</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {[
                  { name:'INV-1042',  amt:'+28,500', color:'oklch(0.50 0.17 155)' },
                  { name:'VAT April', amt:'-8,100',  color:'oklch(0.52 0.02 258)' },
                  { name:'Supplies',  amt:'-4,200',  color:'oklch(0.52 0.02 258)' },
                  { name:'INV-1043',  amt:'+14,700', color:'oklch(0.50 0.17 155)' },
                ].map(tx => (
                  <div key={tx.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.625rem', color:'oklch(0.30 0.02 258)', fontWeight:500 }}>{tx.name}</span>
                    <span style={{ fontSize:'0.625rem', fontWeight:700, color:tx.color }}>{tx.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div style={{ background:'oklch(0.94 0.04 278)', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'oklch(0.55 0.22 278)', animation:'pulseDot 2s infinite' }}/>
            <span style={{ fontSize:'0.6rem', fontWeight:600, color:'oklch(0.40 0.18 278)' }}>VAT Apr 2026 filed · TASS validated · 3 pending invoices</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ position:'relative', overflow:'hidden', padding:'5rem 0 0', background:'#fff' }}>
      {/* Gradient blobs — Akaunting-style soft colour fields */}
      <div className="blob" style={{
        position:'absolute', top:'-15%', right:'-8%', width:'580px', height:'580px',
        borderRadius:'50%', background:'radial-gradient(circle, oklch(0.55 0.22 278 / .10) 0%, transparent 68%)',
        pointerEvents:'none',
      }}/>
      <div className="blob" style={{
        position:'absolute', bottom:'5%', left:'-6%', width:'420px', height:'420px',
        borderRadius:'50%', background:'radial-gradient(circle, oklch(0.59 0.19 155 / .08) 0%, transparent 65%)',
        pointerEvents:'none', animationDelay:'4s',
      }}/>
      {/* Subtle dot grid */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(circle, oklch(0.78 0.04 258) 1px, transparent 1px)',
        backgroundSize:'28px 28px', opacity:0.35,
      }}/>

      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 1.5rem' }}>
        {/* Centre headline */}
        <div style={{ textAlign:'center', maxWidth:'780px', margin:'0 auto 3.5rem' }}>
          <div className="su1 badge badge-v" style={{ marginBottom:'1.25rem' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'oklch(0.55 0.22 278)', display:'inline-block', animation:'pulseDot 2s infinite' }}/>
            MoR Proclamation 1341/2024 · Tax Compliant
          </div>

          <h1 className="su2" style={{
            fontSize:'clamp(2.25rem,5.5vw,3.75rem)', fontWeight:800,
            color:'oklch(0.18 0.02 258)', lineHeight:1.1, marginBottom:'1.375rem',
          }}>
             Accounting Software<br/>
            <span style={{ color:'oklch(0.55 0.22 278)' }}>Built for Ethiopia</span>
          </h1>

          <p className="su3" style={{
            fontSize:'1.125rem', color:'oklch(0.45 0.02 258)', lineHeight:1.7,
            maxWidth:'58ch', margin:'0 auto 2.25rem',
          }}>
            invoice, expense tracking, bank sync, and the complete Ethiopian tax engine — VAT, PIT, DRRF, TASS, and more — all in one platform, for .
          </p>

          <div className="su4" style={{ display:'flex', flexWrap:'wrap', gap:'0.875rem', justifyContent:'center', marginBottom:'2.5rem' }}>
            <Link to="/register" className="btn-primary">
              Get Started  <ArrowRight size={15}/>
            </Link>
            <a href="#platform" className="btn-secondary">
              See Features
            </a>
          </div>

          {/* Social proof strip */}
          <div className="fi" style={{ display:'flex', flexWrap:'wrap', gap:'1.5rem', justifyContent:'center', alignItems:'center' }}>
            {[
              { stat:'150+',  label:'Ethiopian businesses' },
              { stat:'10M+',  label:'Invoices processed' },
              { stat:'99.9%', label:'MoR compliance rate' },
              { stat:'',  label:'Open-source plan' },
            ].map(({ stat, label }) => (
              <div key={label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.25rem', fontWeight:800, color:'oklch(0.18 0.02 258)', letterSpacing:'-0.03em', lineHeight:1 }}>{stat}</div>
                <div style={{ fontSize:'0.75rem', color:'oklch(0.52 0.02 258)', marginTop:'0.125rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero screenshot — centred, large, floats above page fold */}
        <div className="su5" style={{ position:'relative', maxWidth:'960px', margin:'0 auto', paddingBottom:0 }}>
          {/* Floating cards */}
          <div className="float-b" style={{
            position:'absolute', left:'-48px', top:'18%', zIndex:2,
            background:'#fff', borderRadius:'1rem', padding:'0.875rem 1rem',
            boxShadow:'0 8px 32px rgba(99,102,241,.15)', border:'1px solid oklch(0.91 0.01 258)',
            minWidth:'148px',
          }}>
            <div style={{ fontSize:'0.625rem', color:'oklch(0.52 0.02 258)', marginBottom:'0.25rem', fontWeight:600 }}>VAT FILED</div>
            <div style={{ fontSize:'0.9375rem', fontWeight:800, color:'oklch(0.50 0.17 155)', letterSpacing:'-0.02em' }}>✓ Apr 2026</div>
            <div style={{ fontSize:'0.625rem', color:'oklch(0.65 0.02 258)', marginTop:'0.25rem' }}>Proc. 1341/2024</div>
          </div>

          <div className="float-c" style={{
            position:'absolute', right:'-44px', top:'30%', zIndex:2,
            background:'#fff', borderRadius:'1rem', padding:'0.875rem 1rem',
            boxShadow:'0 8px 32px rgba(99,102,241,.15)', border:'1px solid oklch(0.91 0.01 258)',
            minWidth:'138px',
          }}>
            <div style={{ fontSize:'0.625rem', color:'oklch(0.52 0.02 258)', marginBottom:'0.25rem', fontWeight:600 }}>AI OCR</div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
              <ScanLine size={14} style={{ color:'oklch(0.55 0.22 278)' }}/>
              <span style={{ fontSize:'0.875rem', fontWeight:700, color:'oklch(0.18 0.02 258)' }}>Receipt scanned</span>
            </div>
            <div style={{ fontSize:'0.625rem', color:'oklch(0.50 0.17 155)', marginTop:'0.25rem', fontWeight:600 }}>ETB 4,200 · Supplies</div>
          </div>

          <DashboardMockup />

          {/* Soft fade at very bottom so it bleeds into next section */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:'120px',
            background:'linear-gradient(to bottom, transparent, #fff)',
            pointerEvents:'none',
          }}/>
        </div>
      </div>
    </section>
  );
}

/* ── Trusted-by bar ───────────────────────────────────────────────────── */
const TRUST_LOGOS = [
  'Addis Trading PLC', 'Haile Garment', 'Sunrise Hotel', 'MedTech Ethiopia',
  'Teklu & Sons', 'Abyssinia Freight', 'Blue Nile Foods', 'Capital Bank',
];

function TrustBar() {
  const items = [...TRUST_LOGOS, ...TRUST_LOGOS];
  return (
    <section style={{ padding: '2.5rem 0', background: 'oklch(0.975 0.006 258)', borderTop: '1px solid oklch(0.91 0.01 258)', borderBottom: '1px solid oklch(0.91 0.01 258)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: 'oklch(0.60 0.02 258)', marginBottom: '1.5rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Trusted by 150+ Ethiopian businesses
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', width: 'max-content', animation: 'ticker 40s linear infinite' }}>
            {items.map((name, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1.75rem', whiteSpace: 'nowrap',
                fontSize: '0.875rem', fontWeight: 700,
                color: 'oklch(0.45 0.03 258)', opacity: 0.7,
              }}>
                <div style={{ width: 24, height: 24, borderRadius: '0.4rem', background: 'oklch(0.91 0.02 278)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Landmark size={11} style={{ color: 'oklch(0.55 0.22 278)' }} />
                </div>
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Stats row ────────────────────────────────────────────────────────── */
const STATS = [
  { value: '85%',   label: 'Bookkeeping time saved',  icon: TrendingUp },
  { value: '150+',  label: 'Ethiopian SMEs active',   icon: Users },
  { value: '99.9%', label: 'MoR compliance rate',     icon: Shield },
  { value: '<24h',  label: 'Tax filing turnaround',   icon: Zap },
];

function StatsRow() {
  const { ref, fired } = useReveal(0.15);
  return (
    <section style={{ padding: '4rem 0', background: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem' }} className="sm:grid-cols-4">
          {STATS.map(({ value, label, icon: Icon }, i) => (
            <div key={label} style={{
              background: 'oklch(0.975 0.006 258)',
              border: '1px solid oklch(0.91 0.01 258)',
              borderRadius: '1.25rem',
              padding: '1.75rem',
              textAlign: 'center',
              opacity: fired ? 1 : 1,
              animation: fired ? `slideUp .55s ${i * 0.07}s cubic-bezier(.16,1,.3,1) both` : 'none',
              transition: 'box-shadow .2s, transform .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}>
              <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: 'oklch(0.94 0.04 278)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Icon size={20} style={{ color: 'oklch(0.55 0.22 278)' }} />
              </div>
              <div style={{ fontSize: 'clamp(1.75rem,3.5vw,2.25rem)', fontWeight: 800, color: 'oklch(0.18 0.02 258)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'oklch(0.52 0.02 258)', marginTop: '0.375rem', lineHeight: 1.4 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Platform section — Akaunting-style alternating screenshot + copy ─── */

/* Invoice SVG mockup */
function InvoiceMockup() {
  return (
    <div className="ss-shadow" style={{ borderRadius: '1.25rem', overflow: 'hidden', background: '#fff', border: '1px solid oklch(0.91 0.01 258)' }}>
      <div style={{ background: 'oklch(0.975 0.006 258)', padding: '0.625rem 1rem', borderBottom: '1px solid oklch(0.91 0.01 258)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
      </div>
      <div style={{ padding: '1.5rem' }}>
        {/* Invoice header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'oklch(0.52 0.02 258)', marginBottom: '0.25rem' }}>INVOICE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'oklch(0.18 0.02 258)', letterSpacing: '-0.02em' }}>#INV-2026-1042</div>
          </div>
          <span style={{ background: 'oklch(0.94 0.04 155)', color: 'oklch(0.38 0.16 155)', fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '999px' }}>
            PAID
          </span>
        </div>
        {/* Bill to / from */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {[{ label: 'From', name: 'OVDS Trading PLC', tin: 'TIN: 001234567890101' }, { label: 'To', name: 'Sunshine Import Ltd.', tin: 'TIN: 009876543210101' }].map(p => (
            <div key={p.label}>
              <div style={{ fontSize: '0.625rem', color: 'oklch(0.52 0.02 258)', fontWeight: 600, marginBottom: '0.25rem' }}>{p.label}</div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'oklch(0.22 0.02 258)' }}>{p.name}</div>
              <div style={{ fontSize: '0.625rem', color: 'oklch(0.60 0.02 258)' }}>{p.tin}</div>
            </div>
          ))}
        </div>
        {/* Line items */}
        <div style={{ borderTop: '1px solid oklch(0.91 0.01 258)', paddingTop: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'oklch(0.52 0.02 258)' }}>ITEM</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'oklch(0.52 0.02 258)' }}>QTY</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'oklch(0.52 0.02 258)', textAlign: 'right' }}>AMOUNT</span>
          </div>
          {[
            { item: 'Software Consulting — Jul', qty: '1', amt: 'ETB 24,000' },
            { item: 'Bank Integration Setup', qty: '1', amt: 'ETB 8,500' },
          ].map(r => (
            <div key={r.item} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', padding: '0.375rem 0', borderBottom: '1px solid oklch(0.94 0.005 258)' }}>
              <span style={{ fontSize: '0.75rem', color: 'oklch(0.22 0.02 258)', fontWeight: 500 }}>{r.item}</span>
              <span style={{ fontSize: '0.75rem', color: 'oklch(0.52 0.02 258)' }}>{r.qty}</span>
              <span style={{ fontSize: '0.75rem', color: 'oklch(0.22 0.02 258)', fontWeight: 600, textAlign: 'right' }}>{r.amt}</span>
            </div>
          ))}
        </div>
        {/* Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'oklch(0.52 0.02 258)' }}>Subtotal</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'oklch(0.22 0.02 258)' }}>ETB 32,500</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'oklch(0.52 0.02 258)' }}>VAT (15%)</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'oklch(0.22 0.02 258)' }}>ETB 4,875</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', padding: '0.375rem 0.75rem', background: 'oklch(0.94 0.04 278)', borderRadius: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'oklch(0.40 0.18 278)' }}>Total</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'oklch(0.40 0.18 278)' }}>ETB 37,375</span>
          </div>
        </div>
        {/* ERCA QR badge */}
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'oklch(0.975 0.006 258)', borderRadius: '0.625rem', border: '1px solid oklch(0.91 0.01 258)' }}>
          <div style={{ width: 32, height: 32, background: 'oklch(0.18 0.02 258)', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.4rem', color: '#fff', lineHeight: 1 }}>QR</span>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'oklch(0.22 0.02 258)' }}>ERCA Fiscal Receipt · TASS Validated</div>
            <div style={{ fontSize: '0.55rem', color: 'oklch(0.52 0.02 258)' }}>SRM#: 2026-ET-1042 · Proc. 1341/2024</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Receipt scan mockup */
function ReceiptMockup() {
  return (
    <div style={{ position: 'relative', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      {/* Receipt card */}
      <div className="ss-shadow float-a" style={{ borderRadius: '1rem', overflow: 'hidden', background: '#fff', border: '1px solid oklch(0.91 0.01 258)', minWidth: '200px' }}>
        <div style={{ background: 'oklch(0.55 0.22 278)', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ScanLine size={16} style={{ color: '#fff' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>AI Receipt Scan</span>
        </div>
        <div style={{ padding: '1rem' }}>
          {[
            { label: 'Vendor',  value: 'ABC Supplies' },
            { label: 'Date',    value: '14 Jul 2026' },
            { label: 'Amount',  value: 'ETB 4,200' },
            { label: 'VAT',     value: 'ETB 630' },
            { label: 'Category', value: 'Office Supplies' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid oklch(0.94 0.005 258)' }}>
              <span style={{ fontSize: '0.6875rem', color: 'oklch(0.52 0.02 258)' }}>{f.label}</span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'oklch(0.22 0.02 258)' }}>{f.value}</span>
            </div>
          ))}
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', background: 'oklch(0.94 0.04 155)', borderRadius: '0.5rem' }}>
            <Check size={11} style={{ color: 'oklch(0.38 0.16 155)' }} />
            <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'oklch(0.38 0.16 155)' }}>Extracted & auto-categorized</span>
          </div>
        </div>
      </div>
      {/* Confidence badge */}
      <div className="float-b" style={{ background: '#fff', borderRadius: '1rem', padding: '0.875rem 1rem', boxShadow: '0 8px 24px rgba(99,102,241,.12)', border: '1px solid oklch(0.91 0.01 258)', minWidth: '148px' }}>
        <div style={{ fontSize: '0.625rem', color: 'oklch(0.52 0.02 258)', marginBottom: '0.5rem', fontWeight: 600 }}>CONFIDENCE</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'oklch(0.50 0.17 155)', letterSpacing: '-0.03em', lineHeight: 1 }}>98%</div>
        <div style={{ height: 6, background: 'oklch(0.91 0.01 258)', borderRadius: '999px', marginTop: '0.5rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '98%', background: 'oklch(0.59 0.19 155)', borderRadius: '999px' }} />
        </div>
        <div style={{ fontSize: '0.6rem', color: 'oklch(0.60 0.02 258)', marginTop: '0.375rem' }}>Input VAT claimable</div>
      </div>
    </div>
  );
}

function PlatformSection() {
  const r1 = useReveal(0.08);
  const r2 = useReveal(0.08);
  const r3 = useReveal(0.08);

  const SectionRow = ({
    revealRef, fired, flip, badge, badgeClass, title, desc, bullets, mockup, id,
  }: {
    revealRef: React.RefObject<HTMLDivElement>; fired: boolean; flip?: boolean;
    badge: string; badgeClass: string; title: React.ReactNode; desc: string;
    bullets: string[]; mockup: React.ReactNode; id?: string;
  }) => (
    <div id={id} ref={revealRef} style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem',
      alignItems: 'center',
      flexDirection: flip ? 'row-reverse' : undefined,
      opacity: fired ? 1 : 1,
      animation: fired ? `slideUp .7s cubic-bezier(.16,1,.3,1) both` : 'none',
    }} className="platform-row">
      <div style={{ order: flip ? 2 : 1 }}>
        <div className={`badge ${badgeClass}`} style={{ marginBottom: '1.25rem' }}>{badge}</div>
        <h3 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: 'oklch(0.18 0.02 258)', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
          {title}
        </h3>
        <p style={{ fontSize: '1rem', color: 'oklch(0.45 0.02 258)', lineHeight: 1.72, marginBottom: '1.5rem', maxWidth: '44ch' }}>
          {desc}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {bullets.map(b => (
            <div key={b} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'oklch(0.94 0.04 278)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
                <Check size={10} style={{ color: 'oklch(0.55 0.22 278)' }} />
              </div>
              <span style={{ fontSize: '0.9375rem', color: 'oklch(0.35 0.02 258)', lineHeight: 1.55 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ order: flip ? 1 : 2 }}>{mockup}</div>
    </div>
  );

  return (
    <section id="platform" style={{ padding: '5rem 0', background: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="section-pill">Core Platform</div>
          <h2 style={{ fontSize: 'clamp(1.75rem,3.5vw,2.625rem)', fontWeight: 800, color: 'oklch(0.18 0.02 258)', marginBottom: '0.875rem' }}>
            Everything you need to manage your business
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'oklch(0.45 0.02 258)', maxWidth: '52ch', margin: '0 auto', lineHeight: 1.65 }}>
            From invoice to expense tracking to accounting — all the tools you need to manage your money, for .
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6rem' }}>
          {/* Row 1 — invoice */}
          <SectionRow
            revealRef={r1.ref} fired={r1.fired} flip={false}
            badge="e-invoice" badgeClass="badge-v"
            title={<>Professional invoices with<br /><span style={{ color: 'oklch(0.55 0.22 278)' }}>ERCA QR &amp; TASS validation</span></>}
            desc="Send professional invoices to clients, auto-calculate VAT at 15%, and embed ERCA-compliant QR codes with TASS SRM validation — all without leaving the platform."
            bullets={[
              'TIN validation against ERCA database',
              'VAT auto-calculated per Proc. 1341/2024',
              'TASS SRM fiscal receipt integration',
              'One-click PDF with QR code for clients',
            ]}
            mockup={<InvoiceMockup />}
          />

          {/* Row 2 — Receipt OCR, flipped */}
          <SectionRow
            revealRef={r2.ref} fired={r2.fired} flip={true}
            badge="AI Receipt Capture" badgeClass="badge-g"
            title={<>Photograph a receipt,<br /><span style={{ color: 'oklch(0.59 0.19 155)' }}>data appears instantly</span></>}
            desc="Our AI OCR engine reads vendor, amount, VAT, and date from any paper receipt and auto-categorizes the expense — with input VAT claimability scored at 98% confidence."
            bullets={[
              'Extracts all fields in under 3 seconds',
              'Auto-flags claimable input VAT',
              'Syncs directly to chart of accounts',
              'Works offline, syncs when online',
            ]}
            mockup={<ReceiptMockup />}
          />

          {/* Row 3 — Bank sync */}
          <SectionRow
            revealRef={r3.ref} fired={r3.fired} flip={false}
            badge="Bank Integration" badgeClass="badge-v"
            title={<>Bank accounts synced.<br /><span style={{ color: 'oklch(0.55 0.22 278)' }}>Reconciliation automatic.</span></>}
            desc="Connect CBE, Awash, Dashen, and Amole to get real-time transaction feeds. Every bank movement is matched to invoices and bills automatically — no manual reconciliation needed."
            bullets={[
              'CBE, Awash, Dashen, Telebirr, Amole',
              'Auto-matches transactions to invoices',
              'Flags unmatched items for review',
              'FX revaluation per IAS 21 built in',
            ]}
            mockup={
              <div className="ss-shadow float-a" style={{ borderRadius: '1.25rem', background: '#fff', border: '1px solid oklch(0.91 0.01 258)', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'oklch(0.22 0.02 258)', marginBottom: '1.25rem' }}>Bank Accounts</div>
                {[
                  { bank: 'CBE — Commercial Bank', bal: 'ETB 284,500', status: 'Synced', color: 'oklch(0.50 0.17 155)' },
                  { bank: 'Awash Bank', bal: 'ETB 97,300',  status: 'Synced', color: 'oklch(0.50 0.17 155)' },
                  { bank: 'Telebirr Wallet', bal: 'ETB 12,850', status: '3 unmatched', color: 'oklch(0.65 0.18 50)' },
                  { bank: 'Dashen Bank', bal: 'ETB 55,200', status: 'Synced', color: 'oklch(0.50 0.17 155)' },
                ].map(a => (
                  <div key={a.bank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid oklch(0.94 0.005 258)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: 'oklch(0.94 0.04 278)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CreditCard size={14} style={{ color: 'oklch(0.55 0.22 278)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'oklch(0.22 0.02 258)' }}>{a.bank}</div>
                        <div style={{ fontSize: '0.6875rem', color: a.color, fontWeight: 600 }}>{a.status}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'oklch(0.18 0.02 258)', letterSpacing: '-0.02em' }}>{a.bal}</span>
                  </div>
                ))}
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'oklch(0.94 0.04 278)', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'oklch(0.40 0.18 278)' }}>Total Balance</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'oklch(0.38 0.20 278)' }}>ETB 449,850</span>
                </div>
              </div>
            }
          />
        </div>
      </div>

      <style>{`
        @media (max-width:767px) {
          .platform-row { grid-template-columns:1fr!important; gap:2rem!important; }
          .platform-row > div { order:unset!important; }
        }
      `}</style>
    </section>
  );
}

/* ── Tax Engine section ───────────────────────────────────────────────── */
const TAX_RATES = [
  { label: 'VAT',        value: '15%',    note: 'Proc. 1341/2024', accent: true },
  { label: 'PIT',        value: '≥2K ETB', note: 'Proc. 1395/2025', accent: false },
  { label: 'WHT',        value: '3%',     note: 'Withholding Tax',  accent: false },
  { label: 'MAT',        value: '2.5%',   note: 'Min. Asset Tax',   accent: true },
  { label: 'TOT',        value: '2/10%',  note: 'Turnover Tax',     accent: false },
  { label: 'DRRF',       value: '1/5%',   note: 'Disaster Fund',    accent: false },
  { label: 'BIT',        value: '30%',    note: 'Business Income',  accent: true },
  { label: 'Schedule D', value: '5–30%',  note: 'Other Income',     accent: false },
];

function TaxSection() {
  const { ref, fired } = useReveal(0.08);
  return (
    <section id="tax" style={{ padding: '5rem 0', background: 'oklch(0.975 0.006 258)', borderTop: '1px solid oklch(0.91 0.01 258)', borderBottom: '1px solid oklch(0.91 0.01 258)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }} className="platform-row">
          {/* Left copy */}
          <div>
            <div className="section-pill">Tax Engine</div>
            <h2 style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', fontWeight: 800, color: 'oklch(0.18 0.02 258)', marginBottom: '1rem', letterSpacing: '-0.025em' }}>
              Every Ethiopian tax rate.<br />
              <span style={{ color: 'oklch(0.55 0.22 278)' }}>Applied automatically.</span>
            </h2>
            <p style={{ fontSize: '1rem', color: 'oklch(0.45 0.02 258)', lineHeight: 1.72, marginBottom: '1.75rem', maxWidth: '44ch' }}>
              VAT, PIT, WHT, MAT, TOT, DRRF, BIT, Schedule D — all built in and auto-applied based on your business type, turnover, and transaction data.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                'Auto-detects VAT vs TOT at ETB 2M threshold',
                'Consolidated monthly MoR-ready reports',
                'TASS SRM fiscal receipt validation',
                'Customs Tax Simulator — HS codes, e-SAD',
                'Graduate tax & pension auto-deduction',
              ].map(b => (
                <div key={b} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'oklch(0.94 0.04 278)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
                    <Check size={10} style={{ color: 'oklch(0.55 0.22 278)' }} />
                  </div>
                  <span style={{ fontSize: '0.9375rem', color: 'oklch(0.35 0.02 258)', lineHeight: 1.55 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: tax rate grid */}
          <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.625rem' }} className="tax-grid">
            {TAX_RATES.map((t, i) => (
              <div key={t.label}
                style={{
                  background: t.accent ? 'oklch(0.55 0.22 278)' : '#fff',
                  border: `1px solid ${t.accent ? 'oklch(0.55 0.22 278)' : 'oklch(0.91 0.01 258)'}`,
                  borderRadius: '1rem', padding: '1.125rem 0.75rem', textAlign: 'center',
                  opacity: fired ? 1 : 1,
                  animation: fired ? `slideUp .5s ${i * 0.055}s cubic-bezier(.16,1,.3,1) both` : 'none',
                  transition: 'transform .2s, box-shadow .2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: '0.375rem', color: t.accent ? '#fff' : 'oklch(0.55 0.22 278)' }}>
                  {t.value}
                </div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: t.accent ? 'rgba(255,255,255,0.9)' : 'oklch(0.22 0.02 258)', lineHeight: 1.3, marginBottom: '0.25rem' }}>
                  {t.label}
                </div>
                <div style={{ fontSize: '0.5875rem', color: t.accent ? 'rgba(255,255,255,0.65)' : 'oklch(0.55 0.02 258)', lineHeight: 1.3 }}>
                  {t.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:767px){.tax-grid{grid-template-columns:repeat(2,1fr)!important;}}`}</style>
    </section>
  );
}

/* ── Features grid — Akaunting app-store tile style ──────────────────── */
const FEATURES = [
  { icon: FileText,   title: 'e-invoice',         desc: 'ERCA QR codes, TIN validation, TASS SRM. Auto VAT calculation.' },
  { icon: Calculator, title: 'Payroll & PIT',        desc: 'ETB 2K threshold, pension 7%/11%, DRRF, graduate tax automated.' },
  { icon: Users,      title: 'HR Suite',             desc: 'Biometric check-in, leave, shift scheduling, overtime.' },
  { icon: Shield,     title: 'DRRF Compliance',      desc: '1% salary levy + 5% telecom/banking remittance, auto-filed.' },
  { icon: BookOpen,   title: 'Double-Entry GL',      desc: 'Chart of accounts, journals, IAS 12 deferred tax, IAS 21 FX.' },
  { icon: BarChart3,  title: 'IFRS Reports',         desc: 'Balance sheet, P&L, cash flow — auditor-ready.' },
  { icon: Anchor,     title: 'Customs Simulator',    desc: 'HS codes, duty rates, surtax, VAT on imports, COMESA rates.' },
  { icon: Package,    title: 'e-SAD & e-Manifest',   desc: 'Import/export declarations to trade.gov.et, direct filing.' },
  { icon: Receipt,    title: 'Net Tax Payable',      desc: 'VAT + TOT + WHT + PAYE + pension + excise — one report.' },
  { icon: ScanLine,   title: 'Fiscal Validation',    desc: 'TASS verifies ERCA receipts before input VAT is claimed.' },
  { icon: Globe,      title: 'International Tax',    desc: 'Foreign tax credit, thin cap, transfer pricing, loss carry.' },
  { icon: Repeat,     title: 'Recurring Everything', desc: 'Auto-create invoices, revenues, bills for ongoing work.' },
  { icon: Lock,       title: 'Fine-Grained RBAC',    desc: 'Role-level permissions — SPURADMIN, HR, Accountant, Client.' },
  { icon: Ship,       title: 'Tax Clearance',        desc: 'Vehicle tax verification, SRM registration, certificates.' },
  { icon: Database,   title: 'Multi-Company',        desc: 'Manage multiple companies from one admin panel.' },
  { icon: Zap,        title: 'App Store',            desc: 'Install domain modules without leaving the admin panel.' },
];

function FeaturesSection() {
  const { ref, fired } = useReveal(0.05);
  return (
    <section id="features" style={{ padding: '5rem 0', background: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="section-pill">Full Platform</div>
          <h2 style={{ fontSize: 'clamp(1.75rem,3.5vw,2.625rem)', fontWeight: 800, color: 'oklch(0.18 0.02 258)', marginBottom: '0.875rem' }}>
            Everything your business needs
          </h2>
          <p style={{ fontSize: '1.0625rem', color: 'oklch(0.45 0.02 258)', maxWidth: '52ch', margin: '0 auto', lineHeight: 1.65 }}>
            From expense capture to customs declarations — built for Ethiopian tax law and IFRS accounting.
          </p>
        </div>

        <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feat-card"
              style={{
                opacity: fired ? 1 : 1,
                animation: fired ? `slideUp .5s ${i * 0.04}s cubic-bezier(.16,1,.3,1) both` : 'none',
              }}>
              <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: 'oklch(0.94 0.04 278)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <f.icon size={20} style={{ color: 'oklch(0.55 0.22 278)' }} />
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'oklch(0.18 0.02 258)', marginBottom: '0.375rem' }}>
                {f.title}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'oklch(0.50 0.02 258)', lineHeight: 1.6 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Selam Tesfaye', role: 'Owner · Addis Trading PLC', avatar: 'ST', stars: 5,
    text: 'OVDS cut our monthly closing from 3 days to a few hours. The VAT automation alone saves us massive time every month.',
  },
  {
    name: 'Bereket Haile', role: 'CFO · Haile Garment Factory', avatar: 'BH', stars: 5,
    text: 'The customs tax simulator is a game-changer. We calculate landed cost before goods arrive. No more surprise duty bills.',
  },
  {
    name: 'Tigist Bekele', role: 'Accountant · Sunrise Hotel Group', avatar: 'TB', stars: 5,
    text: 'Payroll used to take two full days. Now done before lunch. Pension and DRRF deductions are correct every time.',
  },
];

function Testimonials() {
  const { ref, fired } = useReveal(0.1);
  return (
    <section style={{ padding: '5rem 0', background: 'oklch(0.975 0.006 258)', borderTop: '1px solid oklch(0.91 0.01 258)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="section-pill">Testimonials</div>
          <h2 style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', fontWeight: 800, color: 'oklch(0.18 0.02 258)' }}>
            Trusted by Ethiopian businesses
          </h2>
        </div>
        <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem' }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className="feat-card"
              style={{
                opacity: fired ? 1 : 1,
                animation: fired ? `slideUp .6s ${i * 0.1}s cubic-bezier(.16,1,.3,1) both` : 'none',
              }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem' }}>
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={14} style={{ color: 'oklch(0.75 0.18 75)', fill: 'oklch(0.75 0.18 75)' }} />
                ))}
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'oklch(0.35 0.02 258)', lineHeight: 1.7, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid oklch(0.91 0.01 258)', paddingTop: '1rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'oklch(0.55 0.22 278)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'oklch(0.18 0.02 258)' }}>{t.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'oklch(0.52 0.02 258)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ──────────────────────────────────────────────────────────── */
const PLANS = [
  {
    name: 'Starter', price: '', period: '',
    desc: 'For micro-businesses starting out.',
    features: ['Basic invoice', 'PIT calculator', 'Cloud hosted', '1 user', 'Receipt tracking'],
    cta: 'Get Started', link: '/register', highlight: false,
  },
  {
    name: 'Business', price: 'ETB 499', period: '/mo',
    desc: 'Full compliance & automation.',
    features: ['AI receipt OCR', 'Bank sync', 'VAT & DRRF filing', 'Payroll & pension', 'IFRS reports', 'TASS integration', 'Up to 5 users'],
    cta: 'Start Business', link: '/register?plan=business', highlight: true, badge: 'Most Popular',
  },
  {
    name: 'Enterprise', price: 'Custom', period: '',
    desc: 'Multi-company & on-premise.',
    features: ['Multi-company', 'WHT / MAT / BIT', 'SSO & RBAC', 'Self-host / Docker', 'Dedicated support', 'Unlimited users'],
    cta: 'Contact Sales', link: '/contact', highlight: false,
  },
];

function Pricing() {
  const { ref, fired } = useReveal(0.1);
  return (
    <section id="pricing" style={{ padding: '5rem 0', background: '#fff' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="section-pill">Pricing</div>
          <h2 style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', fontWeight: 800, color: 'oklch(0.18 0.02 258)', marginBottom: '0.75rem' }}>
            Simple, honest pricing
          </h2>
          <p style={{ fontSize: '1rem', color: 'oklch(0.45 0.02 258)' }}>
            Start . Scale when you're ready. No hidden fees.
          </p>
        </div>

        <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem', alignItems: 'start' }}>
          {PLANS.map((p, i) => (
            <div key={p.name}
              style={{
                position: 'relative',
                borderRadius: '1.5rem',
                padding: '2rem',
                display: 'flex', flexDirection: 'column',
                background: p.highlight ? 'oklch(0.55 0.22 278)' : '#fff',
                border: `1px solid ${p.highlight ? 'oklch(0.55 0.22 278)' : 'oklch(0.91 0.01 258)'}`,
                boxShadow: p.highlight ? '0 24px 60px oklch(0.55 0.22 278 / .28), 0 4px 16px rgba(0,0,0,.08)' : '0 1px 4px rgba(0,0,0,.04)',
                transform: p.highlight ? 'scale(1.03)' : '',
                opacity: fired ? 1 : 1,
                animation: fired ? `slideUp .6s ${i * 0.1}s cubic-bezier(.16,1,.3,1) both` : 'none',
                transition: 'box-shadow .25s, transform .25s',
              }}
              onMouseEnter={e => { if (!p.highlight) { e.currentTarget.style.boxShadow = '0 12px 36px rgba(99,102,241,.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; } }}
              onMouseLeave={e => { if (!p.highlight) { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.04)'; e.currentTarget.style.transform = ''; } }}>

              {p.badge && (
                <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)' }}>
                  <span style={{ background: '#fff', color: 'oklch(0.55 0.22 278)', fontSize: '0.6875rem', fontWeight: 800, padding: '0.25rem 1rem', borderRadius: '999px', boxShadow: '0 2px 12px rgba(99,102,241,.25)', border: '1px solid oklch(0.88 0.06 278)' }}>
                    {p.badge}
                  </span>
                </div>
              )}

              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: p.highlight ? 'rgba(255,255,255,0.7)' : 'oklch(0.52 0.02 258)', marginBottom: '0.5rem' }}>
                  {p.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: 'clamp(2rem,4vw,2.5rem)', fontWeight: 800, color: p.highlight ? '#fff' : 'oklch(0.18 0.02 258)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {p.price}
                  </span>
                  {p.period && <span style={{ fontSize: '0.875rem', color: p.highlight ? 'rgba(255,255,255,0.6)' : 'oklch(0.55 0.02 258)', marginBottom: '0.25rem' }}>{p.period}</span>}
                </div>
                <p style={{ fontSize: '0.875rem', color: p.highlight ? 'rgba(255,255,255,0.72)' : 'oklch(0.50 0.02 258)' }}>{p.desc}</p>
              </div>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem', flex: 1 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: p.highlight ? 'rgba(255,255,255,.2)' : 'oklch(0.94 0.04 278)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} style={{ color: p.highlight ? '#fff' : 'oklch(0.55 0.22 278)' }} />
                    </div>
                    <span style={{ fontSize: '0.9375rem', color: p.highlight ? 'rgba(255,255,255,0.88)' : 'oklch(0.35 0.02 258)' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link to={p.link}
                style={{
                  display: 'block', textAlign: 'center', padding: '0.875rem',
                  borderRadius: '0.875rem', fontSize: '0.9375rem', fontWeight: 700,
                  background: p.highlight ? '#fff' : 'oklch(0.55 0.22 278)',
                  color: p.highlight ? 'oklch(0.55 0.22 278)' : '#fff',
                  boxShadow: p.highlight ? '0 4px 16px rgba(0,0,0,.12)' : '0 4px 16px oklch(0.55 0.22 278 / .35)',
                  transition: 'all .2s', textDecoration: 'none',
                }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  { q: 'How does OVDS reduce manual bookkeeping?', a: 'AI-powered receipt capture, bank transaction sync, and automatic categorization eliminate 85% of manual data entry. Expenses are summarized in real-time with tax-deductible suggestions.' },
  { q: 'Is OVDS compliant with Ethiopian tax law?', a: 'Yes — built around Proclamation 1341/2024 (VAT), Proclamation 1395/2025 (PIT), and Regulation 570/2025 (DRRF). It includes the Customs Tax Simulator, Schedule D, excise, stamp duty, and property tax.' },
  { q: 'Can I self-host OVDS?', a: 'Yes. Docker deployment gives you full data sovereignty and compliance with internal IT policies. The Standard on-premise plan is completely .' },
  { q: 'What government integrations are supported?', a: 'TASS (SRM registration, vehicle verification, fiscal receipt validation), MoR e-Tax (declaration submission), Ethiopia Customs Trade Portal (e-SAD, e-Manifest, Tax Simulator).' },
  { q: 'How does the Net Tax Payable Report work?', a: 'The system consolidates VAT, TOT, WHT, PAYE, pension, graduate tax, excise, stamp duty, and Schedule D into a single monthly report ready for MoR submission.' },
  { q: 'What is the VAT registration threshold?', a: 'ETB 2,000,000 annual turnover per Proclamation 1341/2024. OVDS monitors your revenue and alerts when approaching the threshold, auto-switching between VAT and TOT regimes.' },
  { q: 'How does payroll automation work?', a: 'OVDS calculates PIT above the ETB 2,000 threshold, deducts employee pension (7%) and employer pension (11%), applies DRRF (1% of salary), and includes graduate tax — all auto-generated at pay run.' },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" style={{ padding: '5rem 0', background: 'oklch(0.975 0.006 258)', borderTop: '1px solid oklch(0.91 0.01 258)' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="section-pill">FAQ</div>
          <h2 style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', fontWeight: 800, color: 'oklch(0.18 0.02 258)', marginBottom: '0.625rem' }}>
            Frequently asked questions
          </h2>
          <p style={{ fontSize: '1rem', color: 'oklch(0.45 0.02 258)' }}>
            Can't find the answer?{' '}
            <a href="mailto:hello@ovds.et" style={{ color: 'oklch(0.55 0.22 278)', fontWeight: 600, textDecoration: 'none' }}>Email us</a>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {FAQ_ITEMS.map((f, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: '1rem',
              border: `1px solid ${open === i ? 'oklch(0.82 0.08 278)' : 'oklch(0.91 0.01 258)'}`,
              overflow: 'hidden',
              boxShadow: open === i ? '0 4px 16px rgba(99,102,241,.08)' : 'none',
              transition: 'border-color .2s, box-shadow .2s',
            }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.125rem 1.25rem', cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left' }}
                aria-expanded={open === i}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'oklch(0.18 0.02 258)', paddingRight: '1rem', lineHeight: 1.5 }}>{f.q}</span>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: open === i ? 'oklch(0.55 0.22 278)' : 'oklch(0.94 0.04 278)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform .25s cubic-bezier(.16,1,.3,1), background .2s',
                }}>
                  <ChevronDown size={14} style={{ color: open === i ? '#fff' : 'oklch(0.55 0.22 278)' }} />
                </div>
              </button>
              {open === i && (
                <div style={{
                  padding: '0 1.25rem 1.25rem',
                  fontSize: '0.9375rem', color: 'oklch(0.42 0.02 258)', lineHeight: 1.72,
                  borderTop: '1px solid oklch(0.94 0.005 258)', paddingTop: '1rem',
                  animation: 'slideUp .25s cubic-bezier(.16,1,.3,1) both',
                }}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA Banner ───────────────────────────────────────────────────────── */
function CTABanner() {
  return (
    <section style={{ padding: '5rem 0', background: 'oklch(0.55 0.22 278)', position: 'relative', overflow: 'hidden' }}>
      <div className="blob" style={{ position: 'absolute', top: '-30%', right: '-8%', width: '520px', height: '520px', borderRadius: '50%', background: 'oklch(0.62 0.20 278 / .35)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '0.375rem 1rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.75rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
           to start. No credit card required.
        </div>
        <h2 style={{ fontSize: 'clamp(1.875rem,4.5vw,3rem)', fontWeight: 800, color: '#fff', marginBottom: '1.25rem', letterSpacing: '-0.025em', lineHeight: 1.12 }}>
          Start managing your business<br />finances today
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.78)', marginBottom: '2.25rem', fontSize: '1.0625rem', lineHeight: 1.7, maxWidth: '50ch', margin: '0 auto 2.25rem' }}>
          Join 150+ Ethiopian businesses using OVDS to automate invoice, tax filing, and accounting — for .
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', justifyContent: 'center' }}>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#fff', color: 'oklch(0.55 0.22 278)',
            padding: '0.875rem 1.875rem', borderRadius: '0.875rem', fontWeight: 800, fontSize: '0.9375rem',
            boxShadow: '0 8px 28px rgba(0,0,0,.18)', textDecoration: 'none', transition: 'all .2s',
          }}>
            Get Started  <ArrowRight size={15} />
          </Link>
          <a href="mailto:hello@ovds.et" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            padding: '0.875rem 1.875rem', borderRadius: '0.875rem', fontWeight: 600, fontSize: '0.9375rem',
            border: '1px solid rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'all .2s',
          }}>
            Talk to Sales
          </a>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────── */
const FOOTER_COLS = {
  Product:  ['Solutions', 'Features', 'Tax Engine', 'Pricing', 'Changelog', 'App Store'],
  Company:  ['About', 'Blog', 'Careers', 'Contact', 'Partners', 'Accountants'],
  Legal:    ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'],
  Support:  ['Documentation', 'API Reference', 'Status', 'Community', 'GitHub'],
};

function Footer() {
  const colHead: React.CSSProperties = { fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'oklch(0.60 0.02 258)', marginBottom: '1rem' };
  const colLink: React.CSSProperties = { fontSize: '0.875rem', color: 'oklch(0.55 0.02 258)', textDecoration: 'none', transition: 'color .15s', lineHeight: 1 };

  return (
    <footer style={{ background: 'oklch(0.11 0.015 258)', borderTop: '1px solid oklch(0.18 0.01 258)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3.5rem 1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr repeat(4, 1fr)', gap: '2.5rem', marginBottom: '3rem' }} className="footer-grid">
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '0.75rem', background: 'oklch(0.55 0.22 278)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Landmark size={16} style={{ color: '#fff' }} />
              </div>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.9375rem' }}>OVDS</div>
                <div style={{ fontSize: '0.625rem', color: 'oklch(0.68 0.18 278)', fontWeight: 700, letterSpacing: '0.06em' }}>finCloud</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'oklch(0.50 0.02 258)', lineHeight: 1.72, marginBottom: '1.25rem', maxWidth: '28ch' }}>
              , open-source accounting for Ethiopian SMEs — MoR and Customs compliant from day one.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['🇪🇹 Amharic', '🇺🇸 English', 'ትግርኛ'].map(l => (
                <span key={l} style={{ fontSize: '0.6875rem', background: 'oklch(0.18 0.015 258)', color: 'oklch(0.60 0.02 258)', padding: '0.25rem 0.625rem', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid oklch(0.22 0.01 258)' }}>
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_COLS).map(([col, links]) => (
            <div key={col}>
              <div style={colHead}>{col}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {links.map(link => (
                  <li key={link}>
                    <a href="#" style={colLink}
                      onMouseEnter={e => { (e.target as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.color = 'oklch(0.55 0.02 258)'; }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid oklch(0.18 0.01 258)', paddingTop: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', color: 'oklch(0.45 0.02 258)' }}>
            © {new Date().getFullYear()} OVDS finCloud. Built for Ethiopia 🇪🇹 &middot; Open-source on GitHub
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy', 'Terms', 'hello@ovds.et'].map(l => (
              <a key={l} href={l.includes('@') ? `mailto:${l}` : '#'}
                style={{ fontSize: '0.8125rem', color: 'oklch(0.45 0.02 258)', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'oklch(0.45 0.02 258)'; }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .footer-grid{grid-template-columns:1fr 1fr!important;}
        }
        @media(max-width:540px){
          .footer-grid{grid-template-columns:1fr!important;}
        }
      `}</style>
    </footer>
  );
}

/* ── Root ─────────────────────────────────────────────────────────────── */
export default function Landing() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined'
      ? document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="lp">
        <TickerBar />
        <Navbar dark={dark} toggleDark={() => setDark(d => !d)} />
        <main>
          <Hero />
          <TrustBar />
          <StatsRow />
          <PlatformSection />
          <TaxSection />
          <FeaturesSection />
          <Testimonials />
          <Pricing />
          <FAQ />
          <CTABanner />
        </main>
        <Footer />
      </div>
    </>
  );
}
