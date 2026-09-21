/**
 * SecurityEvaluator — AI-powered security posture assessment
 * Three pillars: Automated Assessment · Continuous Monitoring · Manual Reviews
 */
import { AppPage, Btn } from '@ovds/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert, ShieldCheck, ShieldX, Zap, RefreshCw, AlertTriangle,
  CheckCircle2, Info, Lock, Activity, Users, Database, Server, Eye,
  ChevronDown, ChevronUp, Bell, BellOff, PenLine, Trash2,
  TrendingUp, TrendingDown, Minus, Clock, X, Download, History,
} from 'lucide-react';
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useBusiness } from '../context/businessContext';
import { usePageTitle } from '../hooks/usePageTitle';
import api from '../services/api';


type Severity    = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
type RiskLevel   = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ReviewStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK';
type Trend = 'IMPROVING' | 'STABLE' | 'DEGRADING';
type Tab   = 'assessment' | 'monitoring' | 'reviews' | 'history';

interface Finding { id:string; category:string; title:string; description:string; severity:Severity; evidence:string; recommendation:string; cve?:string; owasp?:string; }
interface Metrics { totalAuditEvents:number; failedLogins24h:number; injectionAttempts7d:number; lockedAccounts:number; inactiveAdmins:number; usersWithoutMfa:number; privilegeEscalationAttempts7d:number; dataExports7d:number; }
interface Report { id:string; generatedAt:string; overallScore:number; riskLevel:RiskLevel; findings:Finding[]; summary:string; aiNarrative:string; metrics:Metrics; }
interface MonitoringAlert { id:string; type:string; message:string; severity:Severity; triggeredAt:string; acknowledged:boolean; }
interface MonitoringStatus { lastCheckedAt:string; alerts:MonitoringAlert[]; healthScore:number; trend:Trend; previousScore?:number; }
interface ManualReview { id:string; findingId:string; title:string; notes:string; status:ReviewStatus; reviewedBy:string; createdAt:string; updatedAt:string; priority:Severity; remediation?:string; dueDate?:string; }
interface ScanHistoryEntry { id:string; scannedAt:string; overallScore:number; riskLevel:RiskLevel; criticalCount:number; highCount:number; totalFindings:number; triggeredBy:'MANUAL'|'SCHEDULED'; companyId?:string; }

const SEV: Record<Severity,{cls:string;dot:string;icon:React.ReactNode;label:string}> = {
  CRITICAL: { cls:'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800',         dot:'bg-rose-500',   icon:<ShieldX size={12}/>,       label:'Critical' },
  HIGH:     { cls:'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800', dot:'bg-orange-500', icon:<AlertTriangle size={12}/>, label:'High'     },
  MEDIUM:   { cls:'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',    dot:'bg-amber-500',  icon:<AlertTriangle size={12}/>, label:'Medium'   },
  LOW:      { cls:'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800',                dot:'bg-sky-400',    icon:<Info size={12}/>,          label:'Low'      },
  INFO:     { cls:'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',        dot:'bg-slate-400',  icon:<Info size={12}/>,          label:'Info'     },
};
const RISK_COLOR: Record<RiskLevel,string> = { CRITICAL:'#ef4444', HIGH:'#f97316', MEDIUM:'#f59e0b', LOW:'#10b981' };
const RISK_LABEL: Record<RiskLevel,string> = { CRITICAL:'CRITICAL RISK', HIGH:'HIGH RISK', MEDIUM:'MEDIUM RISK', LOW:'LOW RISK' };
const STATUS_CFG: Record<ReviewStatus,{cls:string;label:string}> = {
  OPEN:          { cls:'bg-rose-50 text-rose-700 border-rose-200',         label:'Open'          },
  IN_PROGRESS:   { cls:'bg-amber-50 text-amber-700 border-amber-200',      label:'In Progress'   },
  RESOLVED:      { cls:'bg-[var(--pro-azure-50)] text-[var(--pro-azure-dark)] border-[var(--pro-azure-100)]', label:'Resolved'     },
  ACCEPTED_RISK: { cls:'bg-slate-100 text-slate-600 border-slate-200',     label:'Accepted Risk' },
};

// ── Shared sub-components ─────────────────────────────────────────────────────

const ScoreGauge: React.FC<{score:number; risk:RiskLevel}> = ({score, risk}) => {
  const r=44, circ=2*Math.PI*r, color=RISK_COLOR[risk];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" stroke="currentColor" className="text-slate-100 dark:text-slate-800"/>
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" stroke={color} strokeLinecap="round"
            strokeDasharray={`${(score/100)*circ} ${circ}`} style={{transition:'stroke-dasharray 1s ease'}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{color}}>{score}</span>
          <span className="text-[10px] text-slate-400">/ 100</span>
        </div>
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{color, borderColor:color+'40'}}>{RISK_LABEL[risk]}</span>
    </div>
  );
};

const SevBadge: React.FC<{s:Severity}> = ({s}) => {
  const c = SEV[s];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${c.cls}`}>{c.icon} {c.label}</span>;
};

const Kpi: React.FC<{label:string; value:number; icon:React.ReactNode; alert?:boolean}> = ({label, value, icon, alert}) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs ${alert&&value>0?'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-400':'bg-white border-slate-100 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'}`}>
    <span className="shrink-0 opacity-60">{icon}</span>
    <div><p className="font-bold text-base tabular-nums">{value.toLocaleString()}</p><p className="opacity-60 mt-0.5">{label}</p></div>
  </div>
);

const FindingCard: React.FC<{f:Finding; onReview:(f:Finding)=>void}> = ({f, onReview}) => {
  const [open, setOpen] = useState(false);
  const s = SEV[f.severity];
  return (
    <div className={`rounded-xl border overflow-hidden ${s.cls}`}>
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90 transition-opacity">
        <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`}/>
        <span className="shrink-0 opacity-60">{s.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{f.title}</p>
          <p className="text-[10px] opacity-60 mt-0.5">{f.category}{f.owasp?` · ${f.owasp}`:''}</p>
        </div>
        <SevBadge s={f.severity}/>
        {open?<ChevronUp size={12} className="shrink-0 opacity-40"/>:<ChevronDown size={12} className="shrink-0 opacity-40"/>}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-2 border-t border-current/10 bg-white/60 dark:bg-slate-900/40">
          <p className="text-[11px] leading-relaxed"><span className="font-semibold">Description:</span> {f.description}</p>
          <p className="text-[11px] leading-relaxed"><span className="font-semibold">Evidence:</span> {f.evidence}</p>
          <p className="text-[11px] leading-relaxed text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]"><span className="font-semibold">Recommendation:</span> {f.recommendation}</p>
          {(f.cve||f.owasp)&&(
            <div className="flex flex-wrap gap-1.5 pt-1">
              {f.cve  && <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{f.cve}</span>}
              {f.owasp && <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{f.owasp}</span>}
            </div>
          )}
          <button onClick={()=>onReview(f)} className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <PenLine size={11}/> Add Manual Review
          </button>
        </div>
      )}
    </div>
  );
};

// ── Review Modal ──────────────────────────────────────────────────────────────

const ReviewModal: React.FC<{finding:Finding|null; existing?:ManualReview; onClose:()=>void; onSave:(d:Partial<ManualReview>)=>void}> =
  ({finding, existing, onClose, onSave}) => {
  const [form, setForm] = useState({
    title:       existing?.title       ?? finding?.title ?? '',
    notes:       existing?.notes       ?? '',
    status:      (existing?.status     ?? 'OPEN') as ReviewStatus,
    priority:    (existing?.priority   ?? finding?.severity ?? 'MEDIUM') as Severity,
    remediation: existing?.remediation ?? finding?.recommendation ?? '',
    dueDate:     existing?.dueDate     ?? '',
  });
  if (!finding) return null;
  const inp = 'w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-colors';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Manual Review</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{finding.id} · {finding.category}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={14}/></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">Title</label>
            <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className={inp}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Status</label>
              <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value as ReviewStatus}))} className={inp}>
                {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Priority</label>
              <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value as Severity}))} className={inp}>
                {(['CRITICAL','HIGH','MEDIUM','LOW'] as Severity[]).map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">Analyst Notes</label>
            <textarea rows={3} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} className={inp+' resize-none'} placeholder="Observations, context, risk acceptance rationale…"/>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">Remediation Plan</label>
            <textarea rows={2} value={form.remediation} onChange={e=>setForm(p=>({...p,remediation:e.target.value}))} className={inp+' resize-none'}/>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">Due Date</label>
            <input type="date" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))} className={inp}/>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={()=>{onSave({...form,findingId:finding.id});onClose();}} className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-medium transition-colors">Save Review</button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const SecurityEvaluator: React.FC = () => {
  usePageTitle('Security Evaluator');
  const { selectedCompanyId } = useBusiness();
  const qc = useQueryClient();
  const [tab, setTab]         = useState<Tab>('assessment');
  const [report, setReport]   = useState<Report | null>(null);
  const [scanning, setScanning] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Finding | null>(null);
  const qs = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';

  const { data: mon, isLoading: monLoading, refetch: refetchMon } = useQuery<MonitoringStatus>({
    queryKey: ['sec-mon', selectedCompanyId],
    queryFn:  () => api.get(`/security-evaluator/monitoring${qs}`).then((r:any)=>r?.data?.data??r?.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery<ManualReview[]>({
    queryKey: ['sec-reviews'],
    queryFn:  () => api.get('/security-evaluator/reviews').then((r:any) => { const d = r?.data?.data ?? r?.data; return Array.isArray(d) ? d : []; }),
    staleTime: 30_000,
  });

  const { data: history = [] } = useQuery<ScanHistoryEntry[]>({
    queryKey: ['sec-history', selectedCompanyId],
    queryFn:  () => api.get(`/security-evaluator/history${qs}`).then((r:any) => { const d = r?.data?.data ?? r?.data; return Array.isArray(d) ? d : []; }),
    staleTime: 60_000,
  });

  const saveReview   = useMutation({ mutationFn:(d:Partial<ManualReview>)=>api.post('/security-evaluator/reviews',d),   onSuccess:()=>{toast.success('Review saved');   void refetchReviews();} });
  const delReview    = useMutation({ mutationFn:(id:string)=>api.delete(`/security-evaluator/reviews/${id}`),           onSuccess:()=>{toast.success('Review deleted'); void refetchReviews();} });
  const ackAlert     = useMutation({ mutationFn:(id:string)=>api.patch(`/security-evaluator/monitoring/alerts/${id}/acknowledge`), onSuccess:()=>{ void refetchMon(); void qc.invalidateQueries({queryKey:['sec-mon']}); } });

  const runEval = useCallback(async () => {
    setScanning(true);
    try {
      const res:any  = await api.get(`/security-evaluator/evaluate${qs}`);
      const data:Report = res?.data?.data ?? res?.data;
      setReport(data);
      toast.success('Evaluation complete');
      setTab('assessment');
    } catch { toast.error('Evaluation failed — check permissions'); }
    finally { setScanning(false); }
  }, [qs]);

  const trendIcon = (t?:Trend) =>
    t==='IMPROVING' ? <TrendingUp size={12} className="text-[var(--pro-azure)]"/> :
    t==='DEGRADING' ? <TrendingDown size={12} className="text-rose-500"/> :
    <Minus size={12} className="text-slate-400"/>;

  const unacked = (mon?.alerts??[]).filter(a=>!a.acknowledged);

  const handleExport = useCallback((fmt: 'csv' | 'html') => {
    const token = localStorage.getItem('ovds_token') || localStorage.getItem('auth0_token') || '';
    const base  = (import.meta as any).env?.VITE_API_URL || '/api';
    const url   = `${base}/security-evaluator/export/${fmt}${qs}`;
    // Open in new tab — browser will handle the download via Content-Disposition
    const a = document.createElement('a');
    a.href = url + (url.includes('?') ? '&' : '?') + `_t=${encodeURIComponent(token)}`;
    a.target = '_blank';
    a.click();
    toast.success(`Downloading ${fmt.toUpperCase()} report…`);
  }, [qs]);

  const TABS = [
    { key:'assessment' as Tab, label:'Assessment',    badge: report ? report.findings.filter(f=>f.severity==='CRITICAL'||f.severity==='HIGH').length : undefined },
    { key:'monitoring' as Tab, label:'Monitoring',    badge: unacked.length||undefined },
    { key:'reviews'    as Tab, label:'Manual Reviews', badge: reviews.filter(r=>r.status==='OPEN').length||undefined },
    { key:'history'    as Tab, label:'Scan History',  badge: undefined },
  ];

  return (
    <AppPage title="Security Evaluator"
      subtitle="AI-powered automated assessment · continuous monitoring · manual review & remediation tracking"
      icon={<ShieldAlert size={18}/>} iconBg="bg-rose-500"
      crumbs={[{label:'Security'},{label:'Evaluator'}]}
      actions={
        <div className="flex gap-2">
          {report && (
            <>
              <Btn variant="ghost" size="sm" icon={<Download size={12}/>} onClick={()=>handleExport('csv')}>CSV</Btn>
              <Btn variant="ghost" size="sm" icon={<Download size={12}/>} onClick={()=>handleExport('html')}>HTML</Btn>
            </>
          )}
          <Btn variant="primary" size="sm"
            icon={scanning?<RefreshCw size={13} className="animate-spin"/>:<Zap size={13}/>}
            onClick={runEval} disabled={scanning}>
            {scanning?'Scanning…':'Run Evaluation'}
          </Btn>
        </div>
      }
    >
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab===t.key?'bg-white dark:bg-slate-900 shadow text-slate-800 dark:text-slate-100':'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {t.label}
            {!!t.badge&&<span className="min-w-[16px] h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ══ TAB 1 — AUTOMATED ASSESSMENT ══════════════════════════════════ */}
      {tab==='assessment' && (
        <div className="space-y-5">
          {!report && !scanning && (
            <div className="flex flex-col items-center py-20 gap-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center"><ShieldAlert size={28} className="text-rose-400"/></div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No assessment yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">Scans audit logs, user accounts, and system configuration — then generates an AI narrative.</p>
              </div>
              <Btn variant="primary" icon={<Zap size={13}/>} onClick={runEval}>Run Security Evaluation</Btn>
            </div>
          )}
          {scanning && (
            <div className="flex flex-col items-center py-20 gap-4">
              <RefreshCw size={28} className="text-rose-400 animate-spin"/>
              <p className="text-sm text-slate-500">Analysing audit logs, accounts & configuration…</p>
            </div>
          )}
          {report && !scanning && (<>
            {/* Score strip */}
            <div className="ovds-widget-card overflow-hidden">
              <div className="flex h-1.5">
                <div className="transition-all duration-700" style={{width:`${report.overallScore}%`,backgroundColor:RISK_COLOR[report.riskLevel]}}/>
                <div className="bg-slate-100 dark:bg-slate-800 flex-1"/>
              </div>
              <div className="p-5 flex flex-wrap items-center gap-6">
                <ScoreGauge score={report.overallScore} risk={report.riskLevel}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Security Posture Assessment</p>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(report.generatedAt).toLocaleString('en-ET',{dateStyle:'medium',timeStyle:'short'})}</p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    {[
                      {label:'Critical',v:report.findings.filter(f=>f.severity==='CRITICAL').length,c:'text-rose-600'},
                      {label:'High',    v:report.findings.filter(f=>f.severity==='HIGH').length,    c:'text-orange-600'},
                      {label:'Total',   v:report.findings.length,                                   c:'text-slate-600'},
                    ].map(k=>(
                      <div key={k.label} className="text-center">
                        <p className={`text-lg font-bold tabular-nums ${k.c}`}>{k.v}</p>
                        <p className="text-[10px] text-slate-400">{k.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Btn variant="ghost" size="sm" icon={<RefreshCw size={11}/>} onClick={runEval}>Re-run</Btn>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Kpi label="Failed Logins (24h)"     value={report.metrics.failedLogins24h}               icon={<Lock size={14}/>}     alert/>
              <Kpi label="Injection Attempts (7d)" value={report.metrics.injectionAttempts7d}           icon={<ShieldX size={14}/>}  alert/>
              <Kpi label="Locked Accounts"         value={report.metrics.lockedAccounts}                icon={<Users size={14}/>}    alert/>
              <Kpi label="No-MFA Priv. Users"      value={report.metrics.usersWithoutMfa}               icon={<Eye size={14}/>}      alert/>
              <Kpi label="Priv. Escalation (7d)"   value={report.metrics.privilegeEscalationAttempts7d} icon={<Activity size={14}/>} alert/>
              <Kpi label="Data Exports (7d)"        value={report.metrics.dataExports7d}                icon={<Database size={14}/>}/>
              <Kpi label="Stale Admins (30d)"       value={report.metrics.inactiveAdmins}               icon={<Users size={14}/>}    alert/>
              <Kpi label="Total Audit Events"       value={report.metrics.totalAuditEvents}             icon={<Server size={14}/>}/>
            </div>

            {/* AI Narrative */}
            {report.aiNarrative && (
              <div className="ovds-widget-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-violet-500"/>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">AI Security Narrative</h3>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-600 border border-violet-200 dark:border-violet-800 font-medium">Rule-Based</span>
                </div>
                {report.aiNarrative.split('\n\n').filter(Boolean).map((p,i)=>(
                  <p key={i} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">{p}</p>
                ))}
              </div>
            )}

            {/* Findings */}
            <div className="ovds-widget-card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-rose-400"/> Findings ({report.findings.length})
                </h3>
                {report.findings.length===0 && <span className="flex items-center gap-1 text-xs text-[var(--pro-azure)] font-medium"><CheckCircle2 size={12}/> All clear</span>}
              </div>
              <div className="p-4 space-y-2">
                {report.findings.length===0
                  ? <div className="flex flex-col items-center py-8 gap-2 text-[var(--pro-azure)]"><ShieldCheck size={24}/><p className="text-sm font-medium">No issues detected</p></div>
                  : report.findings.map(f=><FindingCard key={f.id} f={f} onReview={fnd=>{setReviewTarget(fnd);setTab('reviews');}}/>)
                }
              </div>
            </div>
          </>)}
        </div>
      )}

      {/* ══ TAB 2 — CONTINUOUS MONITORING ════════════════════════════════ */}
      {tab==='monitoring' && (
        <div className="space-y-5">
          {/* Health score bar */}
          <div className="ovds-widget-card p-5 flex flex-wrap items-center gap-5">
            {mon ? (
              <>
                <ScoreGauge score={mon.healthScore} risk={mon.healthScore<40?'CRITICAL':mon.healthScore<60?'HIGH':mon.healthScore<80?'MEDIUM':'LOW'}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Live Health Score</p>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">{trendIcon(mon.trend)} {mon.trend}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Last checked {new Date(mon.lastCheckedAt).toLocaleTimeString('en-ET',{hour:'2-digit',minute:'2-digit'})}</p>
                  {mon.previousScore!==undefined && (
                    <p className="text-[10px] text-slate-400 mt-1">Previous score: {mon.previousScore}/100</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">Auto-refreshes every 60 s · Hourly deep check via scheduler</p>
                </div>
                <Btn variant="ghost" size="sm" icon={monLoading?<RefreshCw size={11} className="animate-spin"/>:<RefreshCw size={11}/>} onClick={()=>void refetchMon()}>Refresh</Btn>
              </>
            ) : (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <RefreshCw size={14} className="animate-spin"/> Loading monitoring status…
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Bell size={14} className="text-amber-500"/> Monitoring Alerts
                {unacked.length>0 && <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-bold">{unacked.length} new</span>}
              </h3>
              {unacked.length>0 && (
                <button onClick={()=>unacked.forEach(a=>ackAlert.mutate(a.id))}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  <BellOff size={10}/> Acknowledge all
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {(mon?.alerts??[]).length===0 ? (
                <div className="flex flex-col items-center py-12 gap-2 text-[var(--pro-azure)]">
                  <ShieldCheck size={24}/><p className="text-sm font-medium">No active alerts</p>
                  <p className="text-xs text-slate-400">The hourly monitor has not detected any threshold breaches.</p>
                </div>
              ) : (mon?.alerts??[]).map(alert=>{
                const s = SEV[alert.severity]??SEV.INFO;
                return (
                  <div key={alert.id} className={`flex items-start gap-3 px-5 py-3 ${alert.acknowledged?'opacity-40':''}`}>
                    <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SevBadge s={alert.severity}/>
                        <span className="text-[10px] font-mono text-slate-400">{alert.type}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{alert.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={9}/> {new Date(alert.triggeredAt).toLocaleString('en-ET',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                        {alert.acknowledged && <span className="ml-2 text-[var(--pro-azure)] font-medium">· Acknowledged</span>}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <button onClick={()=>ackAlert.mutate(alert.id)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[var(--pro-azure)] transition-colors" title="Acknowledge">
                        <CheckCircle2 size={13}/>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* How it works */}
          <div className="ovds-widget-card p-5">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2"><Activity size={13} className="text-slate-400"/> How Continuous Monitoring Works</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon:<Clock size={14}/>, title:'Hourly Scheduler', desc:'Backend cron runs a lightweight threshold check every hour without full AI cost.' },
                { icon:<Bell size={14}/>, title:'Threshold Alerts', desc:'Brute-force (≥10 failures), injection attempts, priv. escalation, locked accounts, missing MFA.' },
                { icon:<ShieldCheck size={14}/>, title:'Auto-Deduplication', desc:'Same alert type is suppressed for 1 hour to prevent noise. Stale alerts pruned after 24 h.' },
              ].map(item=>(
                <div key={item.title} className="flex gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl">
                  <span className="shrink-0 text-slate-400 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{item.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 3 — MANUAL REVIEWS ════════════════════════════════════════ */}
      {tab==='reviews' && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              {label:'Open',          s:'OPEN'          as ReviewStatus, cls:'text-rose-600'},
              {label:'In Progress',   s:'IN_PROGRESS'   as ReviewStatus, cls:'text-amber-600'},
              {label:'Resolved',      s:'RESOLVED'      as ReviewStatus, cls:'text-[var(--pro-azure)]'},
              {label:'Accepted Risk', s:'ACCEPTED_RISK' as ReviewStatus, cls:'text-slate-600'},
            ]).map(row=>{
              const count = reviews.filter(r=>r.status===row.s).length;
              return (
                <div key={row.s} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-center">
                  <p className={`text-xl font-bold tabular-nums ${row.cls}`}>{count}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{row.label}</p>
                </div>
              );
            })}
          </div>

          {/* Add review button when coming from Assessment */}
          {reviewTarget && (
            <ReviewModal finding={reviewTarget} onClose={()=>setReviewTarget(null)}
              existing={reviews.find(r=>r.findingId===reviewTarget.id)}
              onSave={d=>saveReview.mutate(d)}/>
          )}

          {/* Add new review CTA when no target set */}
          {!reviewTarget && report && (
            <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl text-xs text-violet-700 dark:text-violet-400">
              <PenLine size={13}/>
              <span>Open a finding in the <button onClick={()=>setTab('assessment')} className="underline font-semibold">Assessment tab</button> to add a manual review note.</span>
            </div>
          )}
          {!reviewTarget && !report && (
            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500">
              <Info size={13}/> Run an evaluation first to create review notes linked to findings.
            </div>
          )}

          {/* Review list */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <PenLine size={14} className="text-violet-400"/> Review Notes ({reviews.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {reviews.length===0 ? (
                <div className="flex flex-col items-center py-12 gap-2 text-slate-400">
                  <PenLine size={24}/><p className="text-sm font-medium">No reviews yet</p>
                  <p className="text-xs">Click "Add Manual Review" on any finding to start tracking.</p>
                </div>
              ) : reviews.map(rev=>{
                const sc = STATUS_CFG[rev.status];
                return (
                  <div key={rev.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${sc.cls}`}>{sc.label}</span>
                          <SevBadge s={rev.priority}/>
                          <span className="text-[10px] font-mono text-slate-400">{rev.findingId}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{rev.title}</p>
                        {rev.notes && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{rev.notes}</p>}
                        {rev.remediation && (
                          <p className="text-[11px] text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] mt-1">
                            <span className="font-semibold">Plan:</span> {rev.remediation}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                          <span>By {rev.reviewedBy}</span>
                          <span>·</span>
                          <span>{new Date(rev.updatedAt).toLocaleDateString('en-ET',{month:'short',day:'numeric',year:'numeric'})}</span>
                          {rev.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock size={9}/> Due {new Date(rev.dueDate).toLocaleDateString('en-ET',{month:'short',day:'numeric'})}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={()=>{ const f = report?.findings.find(f=>f.id===rev.findingId); if(f) setReviewTarget(f); }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-violet-500 transition-colors" title="Edit">
                          <PenLine size={13}/>
                        </button>
                        <button onClick={()=>delReview.mutate(rev.findingId)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review modal (when triggered from reviews tab via edit) */}
      {reviewTarget && tab==='reviews' && (
        <ReviewModal finding={reviewTarget} onClose={()=>setReviewTarget(null)}
          existing={reviews.find(r=>r.findingId===reviewTarget.id)}
          onSave={d=>saveReview.mutate(d)}/>
      )}

      {/* ══ TAB 4 — SCAN HISTORY ══════════════════════════════════════════ */}
      {tab==='history' && (
        <div className="space-y-5">
          <div className="ovds-widget-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <History size={14} className="text-slate-400"/> Scan History ({history.length})
              </h3>
              <p className="text-[10px] text-slate-400">Last {history.length} evaluations · persisted in database</p>
            </div>
            {history.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2 text-slate-400">
                <History size={24}/><p className="text-sm font-medium">No scans yet</p>
                <p className="text-xs">Run an evaluation to start building history.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                      {['Date','Score','Risk','Critical','High','Total','Triggered By'].map(h=>(
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {history.map((h, i) => {
                      const color = RISK_COLOR[h.riskLevel];
                      const isLatest = i === 0;
                      return (
                        <tr key={h.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isLatest?'bg-violet-50/40 dark:bg-violet-950/10':''}`}>
                          <td className="px-4 py-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                            {new Date(h.scannedAt).toLocaleString('en-ET',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                            {isLatest && <span className="ml-2 px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded text-[9px] font-bold">LATEST</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold tabular-nums text-sm" style={{color}}>{h.overallScore}</span>
                            <span className="text-slate-400 text-[10px]">/100</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{color, borderColor:color+'40'}}>{h.riskLevel}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-rose-600 tabular-nums">{h.criticalCount}</td>
                          <td className="px-4 py-3 font-bold text-orange-600 tabular-nums">{h.highCount}</td>
                          <td className="px-4 py-3 text-slate-600 tabular-nums">{h.totalFindings}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${h.triggeredBy==='SCHEDULED'?'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800':'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}>
                              {h.triggeredBy}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Score trend mini-chart */}
          {history.length > 1 && (
            <div className="ovds-widget-card p-5">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><TrendingUp size={13} className="text-slate-400"/> Score Trend</h4>
              <div className="flex items-end gap-2 h-20">
                {[...history].reverse().map((h, i) => {
                  const color = RISK_COLOR[h.riskLevel];
                  const pct   = Math.max(4, h.overallScore);
                  return (
                    <div key={h.id} className="flex-1 flex flex-col items-center gap-1 group" title={`${new Date(h.scannedAt).toLocaleDateString()} — ${h.overallScore}/100`}>
                      <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">{h.overallScore}</span>
                      <div className="w-full rounded-t-sm transition-all" style={{height:`${pct}%`, backgroundColor:color, opacity: i===history.length-1?1:0.6}}/>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-400">{new Date(history[history.length-1]?.scannedAt).toLocaleDateString('en-ET',{month:'short',day:'numeric'})}</span>
                <span className="text-[9px] text-slate-400">Latest</span>
              </div>
            </div>
          )}
        </div>
      )}
    </AppPage>
  );
};

export default SecurityEvaluator;
