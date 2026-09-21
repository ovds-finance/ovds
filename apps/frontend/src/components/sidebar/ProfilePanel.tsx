import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useBusiness } from '../../context/businessContext';
import { prefetchRoute } from '../../lib/routePreloader';
import { useAuth } from '../../rbac/AuthContext';
import { Icon } from '../ui';

import { ROLE_BADGE, COMPANY_GRADIENTS } from './constants';
import { PanelShell, PanelRow, PanelDivider, PanelSectionLabel } from './PanelPrimitives';

interface ProfilePanelProps {
  onClose: () => void;
  onNavClick?: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ onClose, onNavClick }) => {
  const { user, logout, can } = useAuth();
  const { companies, selectedCompanyId } = useBusiness();
  const activeCompany = companies.find(c => c.id === selectedCompanyId);
  const navigate = useNavigate();
  const go = (path: string) => { prefetchRoute(path); navigate(path); onClose(); onNavClick?.(); };
  const initials = (user?.username ?? 'U').slice(0, 2).toUpperCase();
  const roleBadge = ROLE_BADGE[user?.role ?? 'EMPLOYEE'];
  const roleKeys = Object.keys(ROLE_BADGE);
  const avatarGradient = COMPANY_GRADIENTS[Math.max(0, roleKeys.indexOf(user?.role ?? '')) % COMPANY_GRADIENTS.length];

  return (
    <PanelShell title="My Account" onClose={onClose}>
      <div
        className="px-4 py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--sys-bg-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-[15px] font-bold text-white shadow-sm`}>
              {initials}
            </div>
            {/* Online presence dot — green */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
              style={{
                background: 'var(--pro-indigo)',
                border: '2px solid var(--surface)',
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold truncate" style={{ color: 'var(--text)' }}>
              {user?.username}
            </p>
            {activeCompany ? (
              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-4)' }}>
                {activeCompany.name}
              </p>
            ) : (
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-4)' }}>
                {user?.subsidiary ?? 'OVDS'}
              </p>
            )}
            <span
              className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge?.cls ?? 'bg-[var(--sys-bg-accent)] text-[var(--pro-azure)]'}`}
            >
              {roleBadge?.label ?? user?.role}
            </span>
          </div>
        </div>
      </div>

      <PanelSectionLabel label="Account" />
      <PanelRow icon={<Icon name="CONTACT" size={15} />} label="My Profile" sub="Personal settings" onClick={() => go('/settings')} />
      <PanelRow icon={<Icon name="LOCK" size={15} />} label="Change Password" onClick={() => go('/settings')} />
      {can('settings:write') && (
        <PanelRow icon={<Icon name="SETTINGS" size={15} />} label="Company Settings" onClick={() => go('/settings/company-profile')} />
      )}
      {can('settings:write') && (
        <>
          <PanelRow icon={<Icon name="SHIELD_CHECK" size={15} />} label="EIMS Integration" sub="MoR invoice registration" onClick={() => go('/settings/eims')} />
          <PanelRow icon={<Icon name="SHIELD" size={15} />} label="Security Assessment" sub="OWASP ZAP / ASVS checklist" onClick={() => go('/settings/security')} />
        </>
      )}
      <PanelDivider />
      <PanelSectionLabel label="Navigation" />
      {can('settings:read') && (
        <PanelRow icon={<Icon name="USERS" size={15} />} label="Users & Access" onClick={() => go('/settings/users')} />
      )}
      {can('role_permissions:read') && (
        <PanelRow icon={<Icon name="LOCK" size={15} />} label="Roles" onClick={() => go('/settings/roles')} />
      )}
      <PanelRow icon={<Icon name="HELP_CIRCLE" size={15} />} label="Help & Support" onClick={() => go('/helpdesk')} />
      <PanelRow icon={<Icon name="FILE_TEXT" size={15} />} label="What's New" onClick={() => go('/settings/releases')} />
      <PanelDivider />
      <PanelRow
        icon={<Icon name="LOGOUT" size={15} />}
        label="Sign Out"
        danger
        onClick={() => { logout(); onClose(); }}
      />
    </PanelShell>
  );
};
