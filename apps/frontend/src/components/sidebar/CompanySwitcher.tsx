import React from 'react';
import { useTranslation } from 'react-i18next';

import { Icon } from '../ui';

import { COMPANY_GRADIENTS, TYPE_BADGE_CLS } from './constants';
import type { CompanySwitcherPanelProps } from './types';
import { companyInitials } from './utils';

export const CompanySwitcherPanel: React.FC<CompanySwitcherPanelProps> = ({
  companies, selectedCompanyId, onSelect, onClose, onManage, canAddCompany, onAddCompany,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="absolute top-full left-0 right-0 z-[350] mt-1 rounded-xl overflow-hidden animate-aki-enter"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--border-alt)', background: 'var(--sys-bg-subtle)' }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-4)' }}
        >
          {t('sidebar.company_switcher', { defaultValue: 'Switch Company' })}
        </p>
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-4)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--sys-bg-accent)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--pro-azure)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)';
          }}
        >
          <Icon name="CLOSE" size={10} />
        </button>
      </div>

      {/* Company list */}
      <div className="py-1 max-h-52 overflow-y-auto">
        {companies.map((c, idx) => {
          const isActive = c.id === selectedCompanyId;
          const grad     = COMPANY_GRADIENTS[idx % COMPANY_GRADIENTS.length];
          const typeMeta = TYPE_BADGE_CLS[c.type];
          return (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left"
              style={{ background: isActive ? 'var(--sys-bg-accent)' : 'transparent' }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--sys-bg-subtle)';
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 text-[10px] font-bold text-white`}
              >
                {companyInitials(c.name)}
              </div>

              {/* Name + TIN */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] font-semibold truncate"
                  style={{ color: isActive ? 'var(--pro-azure)' : 'var(--text)' }}
                >
                  {c.name}
                </p>
                {c.tin && (
                  <p className="text-[9px] mt-0.5 font-mono truncate" style={{ color: 'var(--text-4)' }}>
                    TIN: {c.tin}
                  </p>
                )}
              </div>

              {/* Type badge + active check */}
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                {typeMeta && (
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none ${typeMeta.cls}`}>
                    {typeMeta.label}
                  </span>
                )}
                {isActive && (
                  <Icon name="CHECK" size={10} style={{ color: 'var(--pro-azure)' }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer actions */}
      <div
        className="px-3 py-1.5 flex flex-col gap-0.5"
        style={{ borderTop: '1px solid var(--border-alt)' }}
      >
        {canAddCompany && onAddCompany && (
          <button
            onClick={() => { onAddCompany(); onClose(); }}
            className="w-full flex items-center gap-1.5 text-[11px] py-1 transition-colors"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--pro-azure)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
          >
            <Icon name="PLUS" size={11} className="shrink-0" />
            <span>{t('sidebar.add_company', { defaultValue: 'Add Company' })}</span>
          </button>
        )}
        <button
          onClick={() => { onManage(); onClose(); }}
          className="w-full flex items-center gap-1.5 text-[11px] py-1 transition-colors"
          style={{ color: 'var(--text-4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--pro-azure)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
        >
          <Icon name="SETTINGS" size={11} className="shrink-0" />
          <span>{t('sidebar.manage_companies', { defaultValue: 'Manage Companies' })}</span>
        </button>
      </div>
    </div>
  );
};
