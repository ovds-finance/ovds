import React from 'react';
import { useTranslation } from 'react-i18next';

import { Icon } from '../ui';

import { MODULE_COLORS } from './constants';
import type { NavGroup } from './types';

interface SectionHeaderProps {
  group: NavGroup;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ group }) => {
  const { t } = useTranslation();
  const groupLabel = group.i18nKey ? t(group.i18nKey, { defaultValue: group.label }) : group.label;
  const mc = MODULE_COLORS[group.key] ?? MODULE_COLORS.system;

  return (
    <div className="px-4 pt-4 pb-1.5">
      <div className="flex items-center gap-2">
        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${mc.bg} ${mc.text}`}>
          <Icon name={group.icon as any} size={11} />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-4)' }}>
          {groupLabel}
        </p>
      </div>
    </div>
  );
};
