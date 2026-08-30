import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, ArrowLeft, LayoutDashboard, Banknote,
  BarChart3, Receipt, Search, ChevronRight, Clock,
  FileQuestion, Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../rbac/AuthContext';
import { useNavTree } from '../hooks/useNavTree';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { canAccessRoute } = useAuth();
  const { allItems } = useNavTree();
  const [searchQuery, setSearchQuery] = useState('');

  const quickLinks = [
    { to: '/dashboard',      label: t('nav.items.dashboard'),     icon: <LayoutDashboard size={15} /> },
    { to: '/ovds',        label: t('nav.items.ovds_hub'),   icon: <Banknote size={15} /> },
    { to: '/sales/invoices', label: t('nav.items.invoices'),      icon: <Receipt size={15} /> },
    { to: '/reports',        label: t('nav.items.reports_main'),  icon: <BarChart3 size={15} /> },
  ];

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allItems.filter(item =>
      canAccessRoute(item.to) &&
      (item.label.toLowerCase().includes(q) ||
        (item.keywords ?? []).some(k => k.toLowerCase().includes(q)))
    ).slice(0, 5);
  }, [searchQuery, canAccessRoute, allItems]);

  const recentPages = useMemo(() => {
    try {
      const keys: string[] = JSON.parse(localStorage.getItem('sidebar_recent') || '[]');
      return keys
        .map(k => allItems.find(i => i.to === `/${k}` || i.to.endsWith(`/${k}`)))
        .filter((i): i is typeof allItems[0] => !!i && canAccessRoute(i.to))
        .slice(0, 4);
    } catch {
      return [];
    }
  }, [canAccessRoute, allItems]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Soft background blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(85,188,126,0.12) 0%, transparent 70%)', transform: 'translate(-30%,-30%)' }}/>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(85,188,126,0.10) 0%, transparent 70%)', transform: 'translate(30%,30%)' }}/>

      <div className="relative z-10 w-full max-w-[480px]">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Top accent stripe */}
          <div className="h-[3px]" style={{ background: '#55bc7e' }}/>

          <div className="p-8 sm:p-10 space-y-7">

            {/* Illustration */}
            <div className="flex justify-center">
              <div className="relative select-none">
                <div className="text-[96px] font-black text-gray-100 leading-none tracking-tighter">404</div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-100 bg-white shadow-md"
                    style={{ color: '#55bc7e' }}>
                    <FileQuestion size={30} strokeWidth={1.8}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="text-center space-y-2">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{t('not_found.title')}</h1>
              <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">{t('not_found.desc')}</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
              <input
                type="text"
                placeholder={t('not_found.search_placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 hover:border-gray-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none transition-all"
              />
              {/* Search results dropdown */}
              {filteredResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {filteredResults.map(item => (
                    <Link key={item.to} to={item.to}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-emerald-50 flex items-center justify-center text-gray-500 group-hover:text-emerald-600 transition-colors shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-700 group-hover:text-emerald-700 truncate">{item.label}</p>
                        <p className="text-[10px] text-gray-400">{item.to}</p>
                      </div>
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0"/>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent pages + Quick links (shown when not searching) */}
            {!searchQuery && (
              <>
                {recentPages.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                      <Clock size={10}/> {t('not_found.recently_visited')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {recentPages.map(item => (
                        <Link key={item.to} to={item.to}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-medium text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all group">
                          <span className="text-gray-400 group-hover:text-emerald-500 shrink-0 transition-colors">{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick links */}
                <div className="grid grid-cols-2 gap-2">
                  {quickLinks.map(link => (
                    <Link key={link.to} to={link.to}
                      className="flex items-center gap-2.5 px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm transition-all group">
                      <span className="text-gray-400 group-hover:text-emerald-500 shrink-0 transition-colors">{link.icon}</span>
                      <span className="truncate">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button onClick={() => navigate(-1)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-white text-gray-600 rounded-xl text-sm font-semibold transition-all">
                <ArrowLeft size={15}/> {t('not_found.go_back')}
              </button>
              <Link to="/dashboard"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
                style={{ background: '#55bc7e' }}>
                <Home size={15}/> {t('not_found.dashboard')}
              </Link>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-gray-400 mt-4 flex items-center justify-center gap-1.5">
          <Zap size={10} className="text-emerald-400"/> OVDS AI ERP · Ethiopia 🇪🇹
        </p>
      </div>
    </div>
  );
};

export default NotFound;
