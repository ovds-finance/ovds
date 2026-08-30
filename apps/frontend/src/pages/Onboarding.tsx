import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Globe,
  Heart,
  Info,
  Lightbulb,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  Save,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';
// -- Types ---------------------------------------------------------------------
interface FormData {  contactName: string; contactEmail: string; contactPhone: string;  businessName: string; address: string; website: string; socialMedia: string;  valueProposition: string; mainGoals: string; successDefinition: string;  idealCustomerProfile: string; mainCompetitors: string;  topChallenges: string; currentBlockers: string;  budget: string; desiredTimeline: string; usp: string; kpis: string;  hasLogo: string; existingMaterials: string; brandLove: string;  preferredContact: string; updateFrequency: string; timezone: string;}
type FieldErrors = Partial<Record<keyof FormData, string>>;
const DRAFT_KEY = 'onboarding_draft';
const INITIAL: FormData = {  contactName: '', contactEmail: '', contactPhone: '', businessName: '',  address: '', website: '', socialMedia: '',  valueProposition: '', mainGoals: '', successDefinition: '',  idealCustomerProfile: '', mainCompetitors: '',  topChallenges: '', currentBlockers: '',  budget: '', desiredTimeline: '', usp: '', kpis: '', hasLogo: '',  existingMaterials: '', brandLove: '',  preferredContact: '', updateFrequency: '', timezone: '' };
const SECTION_FIELDS: (keyof FormData)[][] = [  ['contactName', 'contactEmail', 'contactPhone', 'businessName', 'website', 'address'],  ['valueProposition', 'mainGoals', 'successDefinition'],  ['idealCustomerProfile', 'mainCompetitors'],  ['topChallenges', 'currentBlockers'],  ['budget', 'desiredTimeline', 'usp', 'kpis', 'hasLogo', 'brandLove'],  ['preferredContact', 'updateFrequency', 'timezone'],];// Char limits for textarea fields
const CHAR_LIMITS: Partial<Record<keyof FormData, number>> = {  valueProposition: 500, mainGoals: 500, successDefinition: 300,  idealCustomerProfile: 600, mainCompetitors: 400,  topChallenges: 600, currentBlockers: 400,  usp: 300, kpis: 300, brandLove: 300 };// Tips shown per section
const SECTION_TIPS: string[] = [  'Tip: Use the email you check most often — we\'ll send your confirmation there.',  'Tip: Be specific about goals. "Grow revenue by 20%" beats "grow the business".',  'Tip: The more specific your ICP, the better we can tailor our approach.',  'Tip: Honest answers here help us prioritize what to tackle first.',  'Tip: Not sure about budget? Pick "To be discussed" — no pressure.',  'Tip: Review your summary below before submitting. You can go back to edit anything.',];
const SECTIONS: { key: string; label: string; icon: ComponentType }[] = [  { key: 'basic',       label: 'Basic Info',        icon: User },  { key: 'goals',       label: 'Business & Goals',  icon: Target },  { key: 'audience',    label: 'Target Audience',   icon: TrendingUp },  { key: 'challenges',  label: 'Challenges',         icon: AlertTriangle },  { key: 'project',     label: 'Project Specifics',  icon: Briefcase },  { key: 'comms',       label: 'Communication',     icon: MessageSquare },];
// -- Helpers -------------------------------------------------------------------
const inputCls = (err?: string) =>  `w-full px-3.5 py-2.5 rounded-xl border ${err ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 ${err ? 'focus:ring-rose-400/30 focus:border-rose-400' : 'focus:ring-teal-400/20 focus:border-teal-400'} transition-all`;
const textareaCls = (err?: string) => inputCls(err) + ' resize-none';
const Field: React.FC<{  label: string; required?: boolean; hint?: string;  error?: string; children: React.ReactNode;}> = ({ label, required, hint, error, children }) => (  <div className="space-y-1.5">    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}    </label>    {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}    {children}    {error && (      <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-1">        <span className="w-3 h-3 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-medium shrink-0">!</span>        {error}      </p>    )}  </div>);
const CharCount: React.FC<{ value: string; limit: number }> = ({ value, limit }) => {  const len = value.length;
const pct = len / limit;
return (    <span className={`text-[10px] font-semibold tabular-nums ${      pct >= 1 ? 'text-rose-500' : pct >= 0.85 ? 'text-amber-500' : 'text-slate-400'    }`}>      {len}/{limit}    </span>  );}
const SectionHeader: React.FC<{ icon: ComponentType; title: string; subtitle: string; completion: number; }> = ({ icon: Icon, title, subtitle, completion }) => (  <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
<Icon size={18} className="text-emerald-600 dark:text-emerald-400 dark:text-emerald-400" />    </div>    <div className="flex-1 min-w-0">      <div className="flex items-center justify-between gap-2">        <h2 className="font-semibold text-slate-900 dark:text-white text-base">{title}</h2>        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${          completion === 100 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'          : completion > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'        }`}>{completion}%</span>      </div>      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>      <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">        <div         
  className={`h-full rounded-full transition-all duration-500 ${completion === 100 ? 'bg-emerald-500' : 'bg-emerald-500'}`} style={{ width: `${completion}%` }}        />      </div>    </div>  </div>);
const RadioGroup: React.FC<{  options: string[]; value: string; onChange: (v: string) => void; cols?: number;}> = ({ options, value, onChange, cols = 4 }) => (  <div className={`grid grid-cols-2 sm:grid-cols-${cols} gap-2`}>    {options.map(opt => (      <label key={opt} className={[        'flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all select-none',        value === opt          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 shadow-sm'          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600',      ].join(' ')}>        <input type="radio" className="sr-only" value={opt} checked={value === opt} onChange={() => onChange(opt)} />        {value === opt && <CheckCircle2 size={12} />}        {opt}      </label>    ))}  </div>);
const TipBanner: React.FC<{ tip: string }> = ({ tip }) => (  <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl">
<Info size={14} className="text-amber-500 shrink-0 mt-0.5" />    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{tip}</p>  </div>);
// -- Confetti burst ------------------------------------------------------------
const CONFETTI_COLORS = ['#00E784', '#00E784', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
const Confetti: React.FC = () => {  const pieces = Array.from({ length: 48 }, (_, i) => ({    id: i,    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],    left: `${Math.random() * 100}%`,    delay: `${Math.random() * 0.8}s`,    duration: `${0.8 + Math.random() * 0.8}s`,    size: `${6 + Math.random() * 8}px`,    rotate: `${Math.random() * 360}deg` }));
return (    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">      {pieces.map(p => (        <div key={p.id} className="absolute top-0 animate-bounce" style={{            left: p.left,            width: p.size,            height: p.size,            backgroundColor: p.color,            borderRadius: Math.random() > 0.5 ? '50%' : '2px',            transform: `rotate(${p.rotate})`,            animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards` }}        />      ))}      <style>{`        @keyframes confettiFall {          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }        }      `}</style>    </div>  );};
// -- Time remaining estimate ---------------------------------------------------// Approximate minutes per section
const STEP_MINUTES = [1, 1, 1, 0.5, 1, 0.5];
function estimateMinutesRemaining(fromStep: number): number {  return Math.round(STEP_MINUTES.slice(fromStep).reduce((a, b) => a + b, 0));}
// -- Welcome Screen ------------------------------------------------------------
const WelcomeScreen: React.FC<{ onStart: () => void; hasDraft: boolean; onResume: () => void }> = ({ onStart, hasDraft, onResume }) => (  <div className="min-h-[80vh] flex items-center justify-center p-5">    <div className="max-w-lg w-full space-y-7 text-center">      {/* Animated icon */}      <div className="relative w-24 h-24 mx-auto">        <div className="absolute inset-0 bg-emerald-200 dark:bg-emerald-800/40 rounded-full animate-ping opacity-30" style={{ animationDuration: '2s' }} />        <div className="absolute inset-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full animate-pulse opacity-50" />        <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 dark:shadow-emerald-500/10">
<Sparkles size={36} className="text-white" />        </div>      </div>      {/* Headline */}      <div className="space-y-3">        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 uppercase tracking-wider">
<Zap size={11} /> Welcome aboard        </div>        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white leading-tight">          Great! Let's get<br />          <span className="text-emerald-600 dark:text-emerald-400 dark:text-emerald-400">started!</span>        </h1>        <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-md mx-auto">          We'll ask you a few questions to tailor our services specifically to your goals.          Takes about <span className="font-semibold text-slate-700 dark:text-slate-300">5 minutes</span> — and your progress is saved automatically.        </p>      </div>      {/* What to expect */}      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-left space-y-3">        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">What we'll cover</p>        <div className="grid grid-cols-2 gap-2">          {[            { icon: User,          label: 'Basic Info',    desc: 'Contact & business details', mins: 1 },            { icon: Target,        label: 'Goals',         desc: 'Where you want to go',       mins: 1 },            { icon: TrendingUp,    label: 'Your Market',   desc: 'Audience & competitors',     mins: 1 },            { icon: AlertTriangle, label: 'Challenges',    desc: "What's slowing you down",    mins: 1 },            { icon: Briefcase,     label: 'Project Scope', desc: 'Budget & timeline',          mins: 1 },            { icon: MessageSquare, label: 'Communication', desc: 'How to stay in sync',        mins: 1 },          ].map(({ icon: Icon, label, desc, mins }, i) => (            <div key={label} className="flex items-start gap-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
<Icon size={13} className="text-emerald-600 dark:text-emerald-400 dark:text-emerald-400" />              </div>              <div className="min-w-0">                <div className="flex items-center gap-1.5">                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</p>                  <span className="text-[9px] text-slate-400 font-medium">~{mins}m</span>                </div>                <p className="ovds-caption mt-0.5 truncate">{desc}</p>              </div>              <span className="ml-auto text-[10px] font-bold text-slate-300 dark:text-slate-600 shrink-0">{i + 1}</span>            </div>          ))}        </div>      </div>      {/* Trust strip */}      <div className="flex items-center justify-center gap-6 text-xs text-slate-400">        <span className="flex items-center gap-1.5">
<CheckCircle2 size={12} className="text-emerald-500" /> Auto-saved</span>        <span className="flex items-center gap-1.5">
<CheckCircle2 size={12} className="text-emerald-500" /> Private & secure</span>        <span className="flex items-center gap-1.5">
<CheckCircle2 size={12} className="text-emerald-500" /> No account needed</span>      </div>      {/* CTA */}      <div className="space-y-3">        <button         
  onClick={onStart} className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10/25 transition-all hover:scale-[1.01] active:scale-[0.99]"        >
<Sparkles size={18} /> Get started!        </button>        {hasDraft && (          <button onClick={onResume} className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
<Save size={14} /> Resume saved draft          </button>        )}        <p className="text-xs text-slate-400">Your answers are auto-saved as you go. No pressure.</p>      </div>    </div>  </div>);
// -- Main Component -------------------------------------------------------------
const Onboarding: React.FC = () => {  const { i18n } = useTranslation();
usePageTitle('Onboarding');
const navigate = useNavigate();
const cardRef = useRef<HTMLDivElement>(null);
const [showWelcome, setShowWelcome] = useState(true);
const [step, setStep] = useState(0);
const [animDir, setAnimDir] = useState<'forward' | 'back'>('forward');
const [animating, setAnimating] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [done, setDone] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);
const [hasDraft, setHasDraft] = useState(false);
const [errors, setErrors] = useState<FieldErrors>({});
const [showResumeBanner, setShowResumeBanner] = useState(false);
const [form, setForm] = useState<FormData>(() => {    try {      const saved = localStorage.getItem(DRAFT_KEY);
if (saved) {        const parsed = JSON.parse(saved) as FormData;
return parsed;      }    }
catch { /* ignore */ }
return INITIAL;  });
const hasDraftData = Object.values(form).some(v => v?.trim());
const startFresh = () => {    setShowWelcome(false);    setShowResumeBanner(false);  };
const resumeDraft = () => {    setShowWelcome(false);    setShowResumeBanner(false);  };  // Auto-save draft  
useEffect(() => {    
const t = setTimeout(() => {      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));      setLastSaved(new Date());      setHasDraft(true);    }, 1500);
return () => clearTimeout(t);  }, [form]);  // Warn before leaving with unsaved data  
useEffect(() => {    
const isDirty = Object.values(form).some(v => v?.trim());
const handler = (e: BeforeUnloadEvent) => {      if (isDirty && !done) { e.preventDefault(); e.returnValue = ''; }    };    window.addEventListener('beforeunload', handler);
return () => window.removeEventListener('beforeunload', handler); }, [form, done]);  // Scroll card into view on step change  
useEffect(() => {    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });  }, [step]);
  // Keyboard: Enter → next, Alt+→/← navigate
  useEffect(() => {    
const handler = (e: KeyboardEvent) => {      
const tag = (e.target as HTMLElement).tagName;
if (tag === 'TEXTAREA' || tag === 'SELECT') return;
if (e.key === 'Enter' && !e.shiftKey) {        e.preventDefault();
if (step < SECTIONS.length - 1) next();      }
if (e.key === 'ArrowRight' && e.altKey) { e.preventDefault();
if (step < SECTIONS.length - 1) next(); }
if (e.key === 'ArrowLeft' && e.altKey) { e.preventDefault();
if (step > 0) back(); }    };    window.addEventListener('keydown', handler);
return () => window.removeEventListener('keydown', handler);  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
const clearDraft = useCallback(() => {    localStorage.removeItem(DRAFT_KEY);    setForm(INITIAL);    setHasDraft(false);    setLastSaved(null);    setErrors({});    setShowResumeBanner(false);    setShowWelcome(true);
toast.success('Draft cleared');  }, []);
const set = (field: keyof FormData) => (    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>  ) => {    const val = e.target.value;
const limit = CHAR_LIMITS[field];
if (limit && val.length > limit) return; // enforce char limit    setForm(prev => ({ ...prev, [field]: val }));
if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));  };
const setVal = (field: keyof FormData, value: string) => {    setForm(prev => ({ ...prev, [field]: value }));
if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));  };  // Completion per section  
const sectionCompletion = SECTION_FIELDS.map(fields => {    
const filled = fields.filter(f => form[f]?.trim()).length;
return Math.round((filled / fields.length) * 100);  });
const totalCompletion = Math.round(    sectionCompletion.reduce((a, b) => a + b, 0) / SECTIONS.length  );  // Inline validation — returns true if valid  
const validateStep = (s: number): boolean => {    
const newErrors: FieldErrors = {};
if (s === 0) {      if (!form.contactName.trim()) newErrors.contactName = 'Name is required';
if (!form.contactEmail.trim()) newErrors.contactEmail = 'Email is required';
else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))        newErrors.contactEmail = 'Enter a valid email address';    }
if (s === 1) {      if (!form.valueProposition.trim()) newErrors.valueProposition = 'Please describe your value proposition';
if (!form.mainGoals.trim()) newErrors.mainGoals = 'Please describe your main goals';    }
if (s === 3) {      if (!form.topChallenges.trim()) newErrors.topChallenges = 'Please describe your top challenges';    }    setErrors(newErrors);
if (Object.keys(newErrors).length > 0) {      toast.error('Please fix the highlighted fields.');
return false;    }
return true;}
const goTo = (target: number, dir: 'forward' | 'back') => {    if (animating) return;    setAnimDir(dir);    setAnimating(true);    setTimeout(() => { setStep(target); setAnimating(false); }, 160);  };
const next = () => { if (validateStep(step)) goTo(Math.min(step + 1, SECTIONS.length - 1), 'forward'); };
const back = () => { setErrors({}); goTo(Math.max(step - 1, 0), 'back'); };
const submit = async () => {    if (!validateStep(step)) return;    setSubmitting(true);
try {      await api.post('/onboarding', form);      localStorage.removeItem(DRAFT_KEY);      setDone(true);    }
catch {      toast.error('Submission failed. Please try again.');    }
finally {      setSubmitting(false);    }  };  // -- Welcome screen -----------------------------------------------------------  
if (showWelcome && !done) {    
return (      <WelcomeScreen       
  onStart={startFresh} hasDraft={hasDraftData} onResume={resumeDraft}      />    );  }
  // -- Done screen --------------------------------------------------------------  
if (done) {    
return (      <div className="min-h-[70vh] flex items-center justify-center p-5">
<Confetti />        <div className="max-w-md w-full text-center space-y-5">          <div className="relative w-24 h-24 mx-auto">            <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-full animate-ping opacity-25" />            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
<CheckCircle2 size={44} className="text-white" />            </div>          </div>          <div>            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">You're all set!</h2>            <p className="mt-2 text-slate-500 dark:text-slate-400">              Thanks, <span className="font-semibold text-slate-700 dark:text-slate-300">{form.contactName}</span>.              We've received your onboarding details and will be in touch shortly.            </p>          </div>          {/* What happens next */}          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 text-sm text-left space-y-3 border border-emerald-100 dark:border-emerald-900/30">            <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-sm">
<Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" /> What happens next?            </p>            {[              { icon: Clock,        text: 'We\'ll review your submission within 1 business day' },              { icon: Mail,         text: `Confirmation sent to ${form.contactEmail}` },              { icon: MessageSquare,text: 'We\'ll schedule a kickoff call to align on goals' },              { icon: Heart,        text: 'We\'re genuinely excited to work with you' },            ].map(({ icon: Icon, text }) => (              <div key={text} className="flex items-start gap-2.5">                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
<Icon size={11} className="text-emerald-600 dark:text-emerald-400 dark:text-emerald-400" />                </div>                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{text}</p>              </div>            ))}          </div>          {/* Summary pill */}          {form.businessName && (            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-400 font-medium">
<Building2 size={12} /> {form.businessName}              {form.budget && <><span className="text-slate-300 dark:text-slate-600">·</span> {form.budget}</>}              {form.desiredTimeline && <><span className="text-slate-300 dark:text-slate-600">·</span> {form.desiredTimeline}</>}            </div>          )}          <div className="flex gap-3">            <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/20 dark:shadow-emerald-500/10">              Go to Dashboard            </button>            <button onClick={() => { setDone(false); setForm(INITIAL); setStep(0); setErrors({}); setShowWelcome(true); }} className="px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">              New Submission            </button>          </div>        </div>      </div>    );  }
const progress = ((step + 1) / SECTIONS.length) * 100;
return (    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">      {/* Resume draft banner */}      {showResumeBanner && (        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
<Save size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />          <p className="flex-1 text-sm text-emerald-600 dark:text-emerald-400 dark:text-emerald-300 font-medium">            You have a saved draft. Pick up where you left off.          </p>          <button onClick={() => setShowResumeBanner(false)} className="text-xs text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 font-bold hover:underline shrink-0">            Dismiss          </button>          <button onClick={clearDraft} className="text-xs text-rose-500 font-bold hover:underline shrink-0">            Start fresh          </button>        </div>      )}      {/* Header */}      <div className="text-center space-y-2">        <div className="flex items-center justify-between">          <button           
  onClick={() => setShowWelcome(true)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"          >
<ArrowLeft size={12} /> Back to start          </button>          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 uppercase tracking-wider">
<Sparkles size={12} /> Onboarding          </div>          <div className="flex items-center gap-1 text-xs text-slate-400">
<Timer size={11} />            <span>~{estimateMinutesRemaining(step)}m left</span>          </div>        </div>        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">          {form.contactName ? `Hey ${form.contactName.split(' ')[0]}, keep going!` : 'Great! Let\'s start!'}        </h1>        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">          Step {step + 1} of {SECTIONS.length} — {SECTIONS[step].label}        </p>      </div>      {/* Overall completion + draft controls */}      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">        <div className="flex-1">          <div className="flex items-center justify-between mb-1">            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Overall completion</span>            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{totalCompletion}%</span>          </div>          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">            <div             
  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-full transition-all duration-700" style={{ width: `${totalCompletion}%` }}            />          </div>        </div>        <div className="flex items-center gap-2 shrink-0">          {lastSaved && (            <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
<Save size={10} /> {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}            </span>          )}          {hasDraft && (            <button onClick={clearDraft} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors" title="Clear draft">
<RotateCcw size={11} /> Clear            </button>          )}        </div>      </div>      {/* Step indicators */}      <div className="flex items-center gap-1">        {SECTIONS.map((s, i) => {          const Icon = s.icon;
const isActive = i === step;
const isDone = i < step;
const comp = sectionCompletion[i];
return (            <React.Fragment key={s.key}>              <button               
  onClick={() => i < step && goTo(i, 'back')} disabled={i > step} title={s.label} className={[                  'relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all',                  isActive ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 dark:shadow-emerald-500/10' :                  isDone ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30' :                  'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default',                ].join(' ')}              >                {isDone && comp === 100 ? <CheckCircle2 size={11} /> : <Icon size={11} />}                <span className="hidden md:inline">{s.label}</span>                {isDone && comp < 100 && (                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-slate-900" title="Incomplete" />                )}              </button>              {i < SECTIONS.length - 1 && (                <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${i < step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />              )}            </React.Fragment>          );        })}      </div>      {/* Step progress bar */}      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />      </div>      {/* Tip banner */}      <TipBanner tip={SECTION_TIPS[step]} />      {/* Animated card */}      <div       
  ref={cardRef} className="ovds-widget-card shadow-sm p-6 space-y-5" style={{          opacity: animating ? 0 : 1,          transform: animating            ? `translateX(${animDir === 'forward' ? '14px' : '-14px'})`            : 'translateX(0)',          transition: 'opacity 160ms ease, transform 160ms ease' }}      >        {/* Section 1 — Basic Info */}        {step === 0 && (          <>
<SectionHeader icon={User} title="Basic Information" subtitle="Let's start with who you are." completion={sectionCompletion[0]} />            <div className="ovds-grid-layout cols-2">
<Field label="Full Name" required
  error={errors.contactName}>                <div className="relative">
<User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />                  <input autoFocus
  className={inputCls(errors.contactName) + ' pl-9'} placeholder="Jane Doe" value={form.contactName} onChange={set('contactName')} />                </div>              </Field>
<Field label="Email Address" required
  error={errors.contactEmail}>                <div className="relative">
<Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />                  <input type="email" className={inputCls(errors.contactEmail) + ' pl-9'} placeholder="jane@company.com" value={form.contactEmail} onChange={set('contactEmail')} />                </div>              </Field>
<Field label="Phone Number">                <div className="relative">
<Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />                  <input className={inputCls() + ' pl-9'} placeholder="+1 555 000 0000" value={form.contactPhone} onChange={set('contactPhone')} />                </div>              </Field>
<Field label="Business Name">                <div className="relative">
<Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />                  <input className={inputCls() + ' pl-9'} placeholder="Acme Corp" value={form.businessName} onChange={set('businessName')} />                </div>              </Field>
<Field label="Website">                <div className="relative">
<Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />                  <input className={inputCls() + ' pl-9'} placeholder="https://yoursite.com" value={form.website} onChange={set('website')} />                </div>              </Field>
<Field label="Social Media">                <input className={inputCls()} placeholder="@handle or profile URL" value={form.socialMedia} onChange={set('socialMedia')} />              </Field>            </div>
<Field label="Business Address">              <div className="relative">
<MapPin size={14} className="absolute left-3 top-3 text-slate-400" />                <textarea rows={2} className={textareaCls() + ' pl-9'} placeholder="123 Main St, City, Country" value={form.address} onChange={set('address')} />              </div>            </Field>          </>        )}        {/* Section 2 — Business & Goals */}        {step === 1 && (          <>
<SectionHeader icon={Target} title="Business & Goals" subtitle="Help us understand what you're building and where you want to go." completion={sectionCompletion[1]} />
<Field label="What does your product or service aim to solve for your customers?" required
  hint="Your core value proposition in 2–3 sentences." error={errors.valueProposition}>              <textarea autoFocus
  rows={3} className={textareaCls(errors.valueProposition)} placeholder="We help small businesses automate their invoice so they get paid faster..." value={form.valueProposition} onChange={set('valueProposition')} />              <div className="flex justify-end mt-1">
<CharCount value={form.valueProposition} limit={CHAR_LIMITS.valueProposition!} /></div>            </Field>
<Field label="What are your main goals for the next 3–6 months?" required
  error={errors.mainGoals}>              <textarea rows={3} className={textareaCls(errors.mainGoals)} placeholder="Grow revenue by 30%, launch in 2 new markets, hire 5 engineers..." value={form.mainGoals} onChange={set('mainGoals')} />              <div className="flex justify-end mt-1">
<CharCount value={form.mainGoals} limit={CHAR_LIMITS.mainGoals!} /></div>            </Field>
<Field label="How will you define success?" hint="What KPIs or outcomes matter most?">              <textarea rows={2} className={textareaCls()} placeholder="Monthly recurring revenue of $50k, NPS above 60..." value={form.successDefinition} onChange={set('successDefinition')} />              <div className="flex justify-end mt-1">
<CharCount value={form.successDefinition} limit={CHAR_LIMITS.successDefinition!} /></div>            </Field>          </>        )}        {/* Section 3 — Target Audience */}        {step === 2 && (          <>
<SectionHeader icon={TrendingUp} title="Target Audience & Market" subtitle="Who are you serving and who are you up against?" completion={sectionCompletion[2]} />
<Field label="Describe your ideal customer profile (ICP)" hint="Industry, company size, role, pain points, buying behavior.">              <textarea autoFocus
  rows={4} className={textareaCls()} placeholder="SMBs in the retail sector, 10–50 employees, ovds managers who struggle with manual reconciliation..." value={form.idealCustomerProfile} onChange={set('idealCustomerProfile')} />              <div className="flex justify-end mt-1">
<CharCount value={form.idealCustomerProfile} limit={CHAR_LIMITS.idealCustomerProfile!} /></div>            </Field>
<Field label="Who are your main competitors?" hint="List 2–5 competitors and what differentiates you.">              <textarea rows={3} className={textareaCls()} placeholder="QuickBooks, FreshBooks — we differ by offering real-time multi-currency support..." value={form.mainCompetitors} onChange={set('mainCompetitors')} />              <div className="flex justify-end mt-1">
<CharCount value={form.mainCompetitors} limit={CHAR_LIMITS.mainCompetitors!} /></div>            </Field>          </>        )}        {/* Section 4 — Challenges */}        {step === 3 && (          <>
<SectionHeader icon={AlertTriangle} title="Challenges & Pain Points" subtitle="What's slowing you down? Knowing this helps us focus on what matters." completion={sectionCompletion[3]} />
<Field label="What are the top 3 challenges you're facing right now?" required
  error={errors.topChallenges}>              <textarea autoFocus
  rows={4} className={textareaCls(errors.topChallenges)} placeholder={'1. Customer acquisition cost is too high\n2. Our onboarding takes too long\n3. We lack visibility into cash flow...'} value={form.topChallenges} onChange={set('topChallenges')} />              <div className="flex justify-end mt-1">
<CharCount value={form.topChallenges} limit={CHAR_LIMITS.topChallenges!} /></div>            </Field>
<Field label="What is currently not working or blocking growth?">              <textarea rows={3} className={textareaCls()} placeholder="Our sales team spends 40% of their time on manual data entry..." value={form.currentBlockers} onChange={set('currentBlockers')} />              <div className="flex justify-end mt-1">
<CharCount value={form.currentBlockers} limit={CHAR_LIMITS.currentBlockers!} /></div>            </Field>          </>        )}        {/* Section 5 — Project Specifics */}        {step === 4 && (          <>
<SectionHeader icon={Briefcase} title="Project Specifics" subtitle="Let's talk scope, timeline, and what you already have." completion={sectionCompletion[4]} />            <div className="ovds-grid-layout cols-2">
<Field label="Budget Range">                <div className="relative">
<DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />                  <select className={inputCls() + ' pl-9'} value={form.budget} onChange={set('budget')}>                    <option value="">Select range</option>                    <option value="under_5k">Under $5,000</option>                    <option value="5k_20k">$5,000 – $20,000</option>                    <option value="20k_50k">$20,000 – $50,000</option>                    <option value="50k_plus">$50,000+</option>                    <option value="tbd">To be discussed</option>                  </select>                </div>              </Field>
<Field label="Desired Timeline">                <div className="relative">
<Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />                  <select className={inputCls() + ' pl-9'} value={form.desiredTimeline} onChange={set('desiredTimeline')}>                    <option value="">Select timeline</option>                    <option value="asap">ASAP</option>                    <option value="1_month">Within 1 month</option>                    <option value="3_months">1–3 months</option>                    <option value="6_months">3–6 months</option>                    <option value="flexible">Flexible</option>                  </select>                </div>              </Field>            </div>
<Field label="What is your brand's unique selling proposition (USP)?">              <textarea rows={2} className={textareaCls()} placeholder="We're the only platform that combines X with Y for Z audience..." value={form.usp} onChange={set('usp')} />              <div className="flex justify-end mt-1">
<CharCount value={form.usp} limit={CHAR_LIMITS.usp!} /></div>            </Field>
<Field label="What KPIs will you use to measure results?">              <textarea rows={2} className={textareaCls()} placeholder="CAC, LTV, churn rate, MRR growth..." value={form.kpis} onChange={set('kpis')} />              <div className="flex justify-end mt-1">
<CharCount value={form.kpis} limit={CHAR_LIMITS.kpis!} /></div>            </Field>
<Field label="Do you have an existing logo / brand guidelines?">
<RadioGroup options={['Yes', 'No', 'In progress']} value={form.hasLogo} onChange={v => setVal('hasLogo', v)} cols={3} />            </Field>            {form.hasLogo && form.hasLogo !== 'No' && (              <Field label="Existing materials" hint="Links to brand guidelines, Figma files, Google Drive, etc.">                <input className={inputCls()} placeholder="https://drive.google.com/..." value={form.existingMaterials} onChange={set('existingMaterials')} />              </Field>            )}            <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 rounded-xl border border-amber-200 dark:border-amber-800/40">
<Field label="What's one thing you love most about your business?" hint="Give us a quick win — something you're genuinely proud of!">                <textarea rows={2} className={textareaCls()} placeholder="Our customer support team has a 98% satisfaction rate..." value={form.brandLove} onChange={set('brandLove')} />                <div className="flex justify-end mt-1">
<CharCount value={form.brandLove} limit={CHAR_LIMITS.brandLove!} /></div>              </Field>            </div>          </>        )}        {/* Section 6 — Communication */}        {step === 5 && (          <>
<SectionHeader icon={MessageSquare} title="Communication Preferences" subtitle="How and when should we reach you?" completion={sectionCompletion[5]} />
<Field label="Preferred contact method">
<RadioGroup options={['Email', 'Slack', 'Phone', 'WhatsApp']} value={form.preferredContact} onChange={v => setVal('preferredContact', v)} cols={4} />            </Field>
<Field label="How often would you like updates?">              <select className={inputCls()} value={form.updateFrequency} onChange={set('updateFrequency')}>                <option value="">Select frequency</option>                <option value="DAILY">Daily</option>                <option value="WEEKLY">Weekly</option>                <option value="BIWEEKLY">Bi-weekly</option>                <option value="MONTHLY">Monthly</option>              </select>            </Field>
<Field label="Your timezone">              <input className={inputCls()} placeholder="e.g. UTC+3, EST, PST" value={form.timezone} onChange={set('timezone')} />            </Field>            {/* Summary card */}            <div className="p-4 bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-emerald-900/10 dark:to-slate-800/50 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-3">              <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-sm">
<Lightbulb size={14} className="text-amber-500" /> Submission summary              </p>              <div className="grid grid-cols-2 gap-2 text-xs">                {[                  { label: 'Contact', value: form.contactName || '—' },                  { label: 'Business', value: form.businessName || '—' },                  { label: 'Budget', value: form.budget || '—' },                  { label: 'Timeline', value: form.desiredTimeline || '—' },                ].map(({ label, value }) => (                  <div key={label} className="bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">                    <p className="text-slate-400 text-[10px] uppercase tracking-wide font-bold">{label}</p>                    <p className="text-slate-700 dark:text-slate-300 font-semibold mt-0.5 truncate">{value}</p>                  </div>                ))}              </div>              {form.valueProposition && (                <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">                  <p className="text-slate-400 text-[10px] uppercase tracking-wide font-bold">Value Proposition</p>                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 line-clamp-2">{form.valueProposition}</p>                </div>              )}              {form.mainGoals && (                <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">                  <p className="text-slate-400 text-[10px] uppercase tracking-wide font-bold">Goals</p>                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 line-clamp-2">{form.mainGoals}</p>                </div>              )}              {form.topChallenges && (                <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-slate-100 dark:border-slate-700">                  <p className="text-slate-400 text-[10px] uppercase tracking-wide font-bold">Top Challenges</p>                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 line-clamp-2">{form.topChallenges}</p>                </div>              )}              {/* Section completion mini-grid */}              <div className="grid grid-cols-3 gap-1.5">                {SECTIONS.map((s, i) => (                  <button                   
  key={s.key} onClick={() => goTo(i, i < step ? 'back' : 'forward')} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity text-left" title={`Go to ${s.label}`}                  >                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sectionCompletion[i] === 100 ? 'bg-emerald-500' : sectionCompletion[i] > 0 ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'}`} />                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{s.label}</span>                  </button>                ))}              </div>              <div className="flex items-center gap-2">                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${totalCompletion}%` }} />                </div>                <span className="text-xs font-bold text-slate-500">{totalCompletion}% complete</span>              </div>            </div>          </>        )}      </div>      {/* Navigation */}      <div className="space-y-3">        {/* Motivational nudge on last step */}        {step === SECTIONS.length - 1 && (          <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
<CheckCircle2 size={13} />            You're almost done — just hit Submit!          </div>        )}        <div className="flex items-center justify-between">          <button           
  onClick={back} disabled={step === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"          >
<ChevronLeft size={16} /> Back          </button>          {/* Dot-nav */}          <div className="flex items-center gap-1.5">            {SECTIONS.map((s, i) => {              const comp = sectionCompletion[i];
return (                <button                 
  key={s.key} onClick={() => i <= step && goTo(i, i < step ? 'back' : 'forward')} disabled={i > step} title={s.label} className={[                    'rounded-full transition-all duration-200',                    i === step ? 'w-5 h-2 bg-emerald-500' :                    i < step && comp === 100 ? 'w-2 h-2 bg-emerald-200 hover:bg-emerald-500' :                    i < step ? 'w-2 h-2 bg-amber-400 hover:bg-amber-500' :                    'w-2 h-2 bg-slate-200 dark:bg-slate-700 cursor-default',                  ].join(' ')}                />              );            })}          </div>          {step < SECTIONS.length - 1 ? (            <button             
  onClick={next} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-500/20 dark:shadow-emerald-500/10 transition-all"            >              Next <ChevronRight size={16} />            </button>          ) : (            <button             
  onClick={submit} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-500/20 disabled:opacity-60 transition-all"            >              {submitting                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>                : <>
<Zap size={15} /> Submit</>              }            </button>          )}        </div>      </div>    </div>  );};
export default Onboarding;












