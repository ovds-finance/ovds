import {
  Server, ArrowLeft, ArrowRight, Cloud,
  CheckCircle2, Database, Globe, Shield, Download, Crown,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import SetupGuide from '../components/setupGuide';
import { usePageTitle } from '../hooks/usePageTitle';

const SetupOnPremise: React.FC = () => {
  usePageTitle('OVDS On-Premise Self-Hosting');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <Link to="/start" className="hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors flex items-center gap-1.5">
          <ArrowLeft size={12} /> Get Started
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 dark:text-slate-300">On-Premise Setup</span>
      </nav>

      {/* Hero section with ovds flavor */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-7 py-10 text-white shadow-2xl shadow-green-900/20">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--pro-azure-100)] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[var(--pro-azure-50)] rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row items-center gap-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--pro-azure)] to-slate-800 flex items-center justify-center shrink-0 shadow-xl shadow-green-500/20">
            <Server size={40} className="text-white" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--pro-azure-50)]0/10 border border-[var(--pro-azure)]/20 rounded-full">
              <Shield size={12} className="text-[var(--pro-azure-light)]" />
              <span className="text-[10px] font-bold text-[var(--pro-azure-light)] uppercase tracking-widest">Enterprise Sovereignty · On-Premise · Hybrid Deployment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">OVDS On-Premise Self-Hosting</h1>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Keep your accounting data entirely under your control. Download and install OVDS on your own server — full data ownership, no recurring cloud fees, and air-gapped options for high-security environments.
              The preferred On-Premise and Hybrid Deployment choice for Banking & ovds, Healthcare & Pharmaceuticals, Manufacturing & Logistics, and IT & Software enterprises requiring complete data sovereignty and Competitive Landscape control.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
              {[
                { icon: <Database size={12} />, label: '100% data ownership' },
                { icon: <Globe size={12} />, label: 'LAN deployable' },
                { icon: <Server size={12} />, label: 'Docker supported' },
                { icon: <CheckCircle2 size={12} />, label: 'Air-gapped' },
              ].map(f => (
                <span key={f.label} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Switcher - ovds style premium toggle */}
      <div className="ovds-widget-card p-2 shadow-sm max-w-2xl mx-auto overflow-hidden">
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/getting-started/cloud"
            className="flex items-center justify-center gap-3 p-6 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
          >
            <Cloud size={24} className="text-slate-400 shrink-0 group-hover:text-[var(--pro-azure)] transition-colors" />
            <div className="text-left">
              <p className="text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">OVDS Cloud</p>
              <p className="text-[10px] text-slate-300 font-bold group-hover:text-[var(--pro-azure)] transition-colors">Managed Hosting</p>
            </div>
          </Link>
          <div className="flex items-center justify-center gap-3 p-6 bg-slate-800 text-white rounded-xl shadow-xl shadow-slate-900/40 transition-all">
            <Server size={24} className="shrink-0" />
            <div className="text-left">
              <p className="text-sm font-black uppercase tracking-widest">On-Premise</p>
              <p className="text-[10px] text-slate-400 font-bold opacity-80">Self-Hosted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Client cross-link banner */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
          <Crown size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            Already on Enterprise? Download the local client instead.
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
            Enterprise plan users can download the OVDS Client installer — a hybrid solution
            that runs locally and syncs to your cloud account automatically.
          </p>
          <Link
            to="/getting-started/client"
            className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-bold text-amber-700 dark:text-amber-400 underline hover:no-underline"
          >
            <Download size={11} /> Client download guide →
          </Link>
        </div>
      </div>

      {/* Docs */}
      <div className="ovds-widget-card overflow-hidden shadow-sm">
         <SetupGuide defaultMode="on-premise" />
      </div>

      {/* Footer nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Link to="/start" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft size={16} /> Back to Start
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/getting-started/cloud" className="text-sm font-bold text-slate-500 hover:text-[var(--pro-azure)] transition-colors">
            Cloud Setup Guide
          </Link>
          <Link to="/plans" className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-xl">
            Explore Plans <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SetupOnPremise;






