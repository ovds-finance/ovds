import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui';
import { companyInitials } from './utils';
import { COMPANY_GRADIENTS, TYPE_BADGE_CLS } from './constants';
import type { CompanySwitcherPanelProps } from './types';

export const CompanySwitcherPanel: React.FC<CompanySwitcherPanelProps> = ({
  companies, selectedCompanyId, onSelect, onClose, onManage, canAddCompany, onAddCompany,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={[
        'absolute top-full left-0 right-0 z-[350] mt-1',
        'bg-white border border-slate-200',
        'rounded-xl shadow-xl shadow-slate-200/60 overflow-hidden',
        'animate-aki-enter',
      ].join(' ')}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {t('sidebar.company_switcher', { defaultValue: 'Switch Company' })}
        </p>
        <button onClick={onClose} className="w-5 h-5 flex items-center justify-center rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors">
          <Icon name="CLOSE" size={10} />
        </button>
      </div>
      <div className="py-1 max-h-52 overflow-y-auto">
        {companies.map((c, idx) => {
          const isActive = c.id === selectedCompanyId;
          const grad = COMPANY_GRADIENTS[idx % COMPANY_GRADIENTS.length];
          const typeMeta = TYPE_BADGE_CLS[c.type];
          return (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); onClose(); }}
              className={['w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left',
                isActive ? 'bg-blue-50' : 'hover:bg-slate-50'].join(' ')}
            >
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-sm`}>
                {companyInitials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-semibold truncate ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>{c.name}</p>
                {c.tin && <p className="text-[9px] text-slate-400 mt-0.5 font-mono truncate">TIN: {c.tin}</p>}
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                {typeMeta && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none ${typeMeta.cls}`}>{typeMeta.label}</span>}
                {isActive && <Icon name="CHECK" size={10} className="text-blue-500" />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="border-t border-slate-100 px-3 py-1.5 flex flex-col gap-0.5">
        {canAddCompany && onAddCompany && (
          <button onClick={() => { onAddCompany(); onClose(); }} className="w-full flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 py-1 transition-colors">
            <Icon name="PLUS" size={11} className="shrink-0" />
            <span>{t('sidebar.add_company', { defaultValue: 'Add Company' })}</span>
          </button>
        )}
        <button onClick={() => { onManage(); onClose(); }} className="w-full flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 py-1 transition-colors">
          <Icon name="SETTINGS" size={11} className="shrink-0" />
          <span>{t('sidebar.manage_companies', { defaultValue: 'Manage Companies' })}</span>
        </button>
      </div>
    </div>
  );
};
