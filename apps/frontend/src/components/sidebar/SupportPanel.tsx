import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui';
import { PanelShell, PanelRow, PanelDivider, PanelSectionLabel } from './PanelPrimitives';

interface SupportPanelProps {
  onClose: () => void;
  onNavClick?: () => void;
}

export const SupportPanel: React.FC<SupportPanelProps> = ({ onClose, onNavClick }) => {
  const navigate = useNavigate();
  const go = (path: string) => { navigate(path); onClose(); onNavClick?.(); };
  return (
    <PanelShell title="Help & Support" onClose={onClose}>
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
          <Icon name="HELP_CIRCLE" size={20} className="text-blue-500" />
        </div>
        <p className="text-[13px] font-bold text-slate-700">How can we help?</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Find answers, guides, and support resources.</p>
      </div>
      <PanelSectionLabel label="Resources" />
      <PanelRow icon={<Icon name="BOOK_OPEN" size={15} />} label="Documentation" sub="Guides & tutorials" onClick={() => go('/docs')} />
      <PanelRow icon={<Icon name="FILE_TEXT" size={15} />} label="API Reference" sub="Developer docs" onClick={() => go('/settings/api-docs')} />
      <PanelRow icon={<Icon name="ZAP" size={15} />} label="Getting Started" sub="Setup wizard" onClick={() => go('/getting-started')} />
      <PanelDivider />
      <PanelSectionLabel label="Support" />
      <PanelRow icon={<Icon name="MESSAGE_SQUARE" size={15} />} label="Helpdesk" sub="Open a support ticket" onClick={() => go('/helpdesk')} />
      <PanelRow icon={<Icon name="REFRESH_CW" size={15} />} label="System Updates" sub="Release notes" onClick={() => go('/settings/releases')} />
    </PanelShell>
  );
};
