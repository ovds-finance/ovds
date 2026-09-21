import {
  ShieldOff, ArrowLeft, Home, ShieldCheck,
  CheckCircle2, ExternalLink, Lock, Zap,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import RoleBadge from '../components/roleBadge';
import { useBusiness } from '../context/businessContext';
import { useAuth } from '../rbac/AuthContext';
import { rbac, ROLE_METADATA } from '../rbac/rbac';

const Forbidden: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuth0User, stepUp } = useAuth();
  const { selectedBusinessType } = useBusiness();

  const role = user?.role;
  const businessType = selectedBusinessType || undefined;
  const meta = role ? ROLE_METADATA[role] : null;
  const defaultRoute = role ? rbac.defaultRoute(role) : '/';

  const permSummary = role
    ? rbac.summary(role, businessType)
        .filter(d => d.granted.length > 0)
        .sort((a, b) => b.granted.length - a.granted.length)
        .slice(0, 6)
    : [];

  const levelColor: Record<string, string> = {
    admin: 'text-red-500',
    write: 'text-[var(--pro-azure)]',
    read:  'text-[var(--pro-azure)]',
    none:  'text-gray-300',
  };
  const levelBg: Record<string, string> = {
    admin: 'bg-red-50 border-red-100',
    write: 'bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]',
    read:  'bg-[var(--pro-azure-50)] border-[var(--pro-azure-50)]',
    none:  'bg-white border-gray-100',
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Soft blobs */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)', transform: 'translate(25%,-25%)' }}/>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(85,188,126,0.10) 0%, transparent 70%)', transform: 'translate(-25%,25%)' }}/>

      <div className="relative z-10 w-full max-w-[460px] space-y-4">

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)' }}/>

          <div className="p-8 sm:p-10 space-y-6 text-center">

            {/* Illustration */}
            <div className="flex justify-center">
              <div className="relative select-none">
                <div className="text-[80px] font-black text-gray-100 leading-none tracking-tighter">403</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-50 border border-red-100 shadow-sm text-red-400">
                    <ShieldOff size={26} strokeWidth={1.8}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{t('forbidden.title')}</h1>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{t('forbidden.desc')}</p>
            </div>

            {/* Role context */}
            {role && meta && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-200 text-left">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm text-gray-500">
                  <ShieldCheck size={16}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <RoleBadge role={role} size="sm"/>
                    {isAuth0User && (
                      <span className="text-[10px] font-semibold text-[var(--pro-azure)] bg-[var(--pro-azure-50)] border border-[var(--pro-azure-100)] px-2 py-0.5 rounded-full">
                        {stepUp === 'full' ? 'SSO · MFA ✓' : 'SSO'}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-500 leading-snug">{meta.description}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={() => navigate(-1)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-white text-gray-600 rounded-xl text-sm font-semibold transition-all">
                <ArrowLeft size={15}/> {t('not_found.go_back')}
              </button>
              <Link to={defaultRoute}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
                style={{ background: '#55bc7e' }}>
                <Home size={15}/> {t('forbidden.my_dashboard')}
              </Link>
            </div>
          </div>
        </div>

        {/* Permissions card */}
        {permSummary.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Lock size={10} className="text-[var(--pro-azure-light)]"/>
                {t('forbidden.what_you_can_access', { role })}
              </p>
              <Link to="/settings/roles"
                className="flex items-center gap-1 text-[11px] font-semibold text-[var(--pro-azure)] hover:text-[var(--pro-azure-dark)] transition-colors">
                <ExternalLink size={10}/> {t('forbidden.view_permissions')}
              </Link>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {permSummary.map(d => (
                <div key={d.domain}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] ${levelBg[d.level] ?? 'bg-white border-gray-100'}`}>
                  <CheckCircle2 size={11} className={`shrink-0 ${levelColor[d.level] ?? 'text-gray-300'}`}/>
                  <span className="font-semibold text-gray-700 truncate capitalize flex-1">
                    {d.domain.replace(/_/g, ' ')}
                  </span>
                  <span className={`font-bold shrink-0 ${levelColor[d.level] ?? 'text-gray-300'}`}>{d.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
          <Zap size={10} className="text-[var(--pro-azure-light)]"/> OVDS AI ERP · Ethiopia 🇪🇹
        </p>
      </div>
    </div>
  );
};

export default Forbidden;
