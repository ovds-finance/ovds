import {
  Building2, Globe, DollarSign, Receipt, Layers,
  FileText, Mail, Settings as SettingsIcon, Wallet, UserCog,
  Code, Server, Shield, Lock,
} from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';

type Section = 'profile' | 'localization' | 'financial' | 'invoice' | 'currency' | 'email' | 'taxes' | 'modules' | 'defaults' | 'users' | 'developers' | 'security' | 'roles';

interface SettingsSidebarProps {
  activeTab: Section;
  onTabChange: (tab: Section) => void;
}

const GENERAL_TABS: { id: Section; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'profile',      label: 'Company',       icon: <Building2 size={14} />,    description: 'Business identity & contacts' },
  { id: 'localization', label: 'Localization',  icon: <Globe size={14} />,        description: 'Language, timezone & format' },
  { id: 'financial',    label: 'Financial',     icon: <DollarSign size={14} />,   description: 'Currency & fiscal calendar' },
  { id: 'invoice',      label: 'Invoice',       icon: <FileText size={14} />,     description: 'Templates, prefixes & QR' },
  { id: 'defaults',     label: 'Defaults',      icon: <Wallet size={14} />,       description: 'Payment, tax & bank defaults' },
];

const ADVANCED_TABS: { id: Section; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'currency',     label: 'Currencies',    icon: <DollarSign size={14} />,   description: 'Base currency & live rates' },
  { id: 'email',        label: 'Email & SMTP',  icon: <Mail size={14} />,         description: 'Outgoing mail & SMTP' },
  { id: 'taxes',        label: 'Taxes',         icon: <Receipt size={14} />,      description: 'VAT, TOT, WHT & BIT toggles' },
  { id: 'users',        label: 'Users & Access', icon: <UserCog size={14} />,    description: 'Roles, portals & security' },
  { id: 'roles',        label: 'Roles & Permissions', icon: <Lock size={14} />, description: 'Manage roles & feature access' },
  { id: 'security',     label: 'Security',      icon: <Shield size={14} />,       description: 'OWASP ZAP / ASVS controls' },
];

const SYSTEM_TABS: { id: Section; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'modules',      label: 'Modules',       icon: <Layers size={14} />,       description: 'Enable / disable system modules' },
  { id: 'developers',   label: 'Developers',    icon: <Code size={14} />,         description: '.env, API keys & server config' },
];

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="ovds-widget-card overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <SettingsIcon size={14} className="text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Settings</p>
            <p className="text-[9px] text-slate-400">Central control panel</p>
          </div>
        </div>
      </div>

      <nav className="py-2" aria-label="Settings navigation">
        <SectionGroup title="General" items={GENERAL_TABS} activeTab={activeTab} onTabChange={onTabChange} />
        <SectionGroup title="Advanced" items={ADVANCED_TABS} activeTab={activeTab} onTabChange={onTabChange} />
        <SectionGroup title="System" items={SYSTEM_TABS} activeTab={activeTab} onTabChange={onTabChange} />
      </nav>
    </div>
  );
};

function SectionGroup({ title, items, activeTab, onTabChange }: {
  title: string;
  items: { id: Section; label: string; icon: React.ReactNode; description: string }[];
  activeTab: Section;
  onTabChange: (tab: Section) => void;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div className="px-2 py-1">
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-1 px-2 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <span className="transition-transform duration-200" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
        {title}
      </button>
      {!collapsed && (
        <div className="space-y-0.5 mt-0.5">
          {items.map(tab => (
            <NavLink
              key={tab.id}
              to={`/settings?tab=${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left ${
                  isActive || activeTab === tab.id
                    ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
              }
            >
              <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {tab.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{tab.label}</p>
                <p className="text-[9px] text-slate-400 leading-tight truncate">{tab.description}</p>
              </div>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
