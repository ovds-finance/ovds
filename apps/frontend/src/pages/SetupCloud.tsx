import React from 'react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  Cloud, ArrowLeft, ArrowRight, Server,
  CheckCircle2, Zap, RefreshCw, Shield,
  Sparkles,
} from 'lucide-react';

const SetupCloud: React.FC = () => {
  usePageTitle('Setting Up OVDS Cloud');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <Link to="/start" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5">
          <ArrowLeft size={12} /> Get Started
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 dark:text-slate-300">Cloud Setup</span>
      </nav>

      {/* Hero section with ovds flavor */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-7 py-10 text-white shadow-2xl shadow-emerald-900/20">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-100 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-600/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row items-center gap-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-xl shadow-emerald-500/20">
            <Cloud size={40} className="text-white" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Sparkles size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Small Business Solution · SaaS-Based · Cloud Deployment</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">Setting Up OVDS Cloud</h1>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Ovds Cloud is perfect for small businesses focused on productivity with little time to manage IT tasks. Your small business financial management will be up and running in minutes.
              Ideal for Banking & ovds, Retail & E-commerce, IT & Software, Manufacturing & Logistics, and Healthcare & Pharmaceuticals teams needing a fully managed SaaS-Based ERP and Business Intelligence platform.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-2">
              {[
                { icon: <Zap size={12} />, label: 'Up in 60 seconds' },
                { icon: <RefreshCw size={12} />, label: 'Auto updates' },
                { icon: <Shield size={12} />, label: 'Managed backups' },
                { icon: <CheckCircle2 size={12} />, label: 'SSL included' },
              ].map(f => (
                <span key={f.label} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-step guide with card-over-grid feel */}
      <div className="ovds-grid-layout cols-2">
        {[
          {
            step: 1,
            title: 'Signing up to Ovds',
            desc: 'New to bookkeeping? Signing on to Ovds Cloud is intuitive and fast.',
            items: [
              'Click "Get Started" on our homepage',
              'Select "Start" on the welcome screen',
              'Choose "Create New Account" at login',
              'Complete the registration form',
              'Confirm your email to activate',
            ],
            cta: { label: 'Get Started Now', to: '/start' },
            color: 'blue'
          },
          {
            step: 2,
            title: 'Creating Your Company',
            desc: 'You only need four essential details to build your first company profile.',
            items: [
              'Registered company name',
              'Dashboard interface language',
              'Primary business currency (ETB, USD, etc.)',
              'Official business location',
            ],
            note: 'The wizard allows adding TIN, logo, and financial start dates later.',
            color: 'indigo'
          },
          {
            step: 3,
            title: 'Configuring Core Apps',
            desc: 'We provide four essential pre-installed apps to get you moving.',
            items: [
              '🔐 2FA (Security pre-installed)',
              '📍 Address Finder (Data entry pre-installed)',
              '📅 Business Calendar (Optional)',
              '💱 Live Currency Rates (Optional)',
            ],
            note: 'Browse 50+ more apps in our Integrated App Store.',
            color: 'violet'
          },
          {
            step: 4,
            title: 'Send Your First Invoice',
            desc: 'Once configured, generate professional ERCA-compliant invoices instantly.',
            items: [
              'Go to ovds → Invoices',
              'Fill in customer & item details',
              'Automatic 15% VAT & DRRF calculation',
              'Email with secure QR payment code',
            ],
            cta: { label: 'Go to Invoices', to: '/sales/invoices' },
            color: 'emerald'
          },
        ].map(s => (
          <div key={s.step} className="group relative ovds-widget-card p-8 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 text-6xl font-black text-slate-100 dark:text-slate-800/50 group-hover:text-emerald-600/10 transition-colors pointer-events-none">
              0{s.step}
            </div>
            <div className="relative space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-black text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-inner">
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              
              <ul className="space-y-3">
                {s.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              {s.note && (
                <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border-l-4 border-emerald-500">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">{s.note}</p>
                </div>
              )}

              {s.cta && (
                <Link
                  to={s.cta.to}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  {s.cta.label} <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Deployment Switcher - ovds style premium toggle */}
      <div className="ovds-widget-card p-2 shadow-sm max-w-2xl mx-auto overflow-hidden">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-center gap-3 p-6 bg-emerald-500 text-white rounded-xl shadow-xl shadow-emerald-500/20 transition-all">
            <Cloud size={24} className="shrink-0" />
            <div className="text-left">
              <p className="text-sm font-black uppercase tracking-widest">OVDS Cloud</p>
              <p className="text-[10px] text-emerald-100 font-bold opacity-80">Managed Hosting</p>
            </div>
          </div>
          <Link
            to="/getting-started/on-premise"
            className="flex items-center justify-center gap-3 p-6 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
          >
            <Server size={24} className="text-slate-400 shrink-0 group-hover:text-emerald-600 transition-colors" />
            <div className="text-left">
              <p className="text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">On-Premise</p>
              <p className="text-[10px] text-slate-300 font-bold group-hover:text-emerald-500 transition-colors">Self-Hosted</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Link to="/start" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft size={16} /> Back to Start
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/getting-started/on-premise" className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
            On-Premise Setup
          </Link>
          <Link to="/plans" className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all shadow-xl">
            Explore Plans <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SetupCloud;



