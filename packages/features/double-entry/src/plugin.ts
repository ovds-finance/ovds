import React from 'react';

import type { IconType } from '@ovds/shared';

export interface ModuleUIRegistration {
  id: string;
  title: string;
  navigationPath: string;
  icon: IconType;
  dashboardWidgets: Array<{
    id: string;
    component: React.ComponentType<any>;
    gridSize: string;
  }>;
  settingsPanel?: React.ComponentType<any>;
}

export function TrialBalanceWidget(props: { companyId?: string }) {
  return React.createElement(
    'div',
    { style: { padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' } },
    React.createElement('h3', { style: { margin: '0 0 8px' } }, 'Trial Balance'),
    React.createElement(
      'p',
      { style: { margin: 0, color: '#6b7280' } },
      props.companyId ? `Company: ${props.companyId}` : 'Select a company to view trial balance',
    ),
  );
}

export function LedgerSettingsPanel(props: { moduleKey?: string }) {
  return React.createElement(
    'div',
    { style: { padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' } },
    React.createElement('h3', { style: { margin: '0 0 8px' } }, 'Ledger Settings'),
    React.createElement(
      'p',
      { style: { margin: 0, color: '#6b7280' } },
      props.moduleKey ? `Module: ${props.moduleKey}` : 'Configure double-entry ledger settings',
    ),
  );
}

export const DoubleEntryPluginConfig: ModuleUIRegistration = {
  id: 'double-entry',
  title: 'General Ledger',
  navigationPath: '/accounting/ledger',
  icon: 'BOOK_OPEN',
  dashboardWidgets: [
    {
      id: 'double-entry.trial-balance',
      component: TrialBalanceWidget,
      gridSize: 'full',
    },
  ],
  settingsPanel: LedgerSettingsPanel,
};
