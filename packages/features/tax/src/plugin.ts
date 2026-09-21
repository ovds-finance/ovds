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

export function VatDashboardWidget(props: { companyId?: string }) {
  return React.createElement(
    'div',
    { style: { padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' } },
    React.createElement('h3', { style: { margin: '0 0 8px' } }, 'VAT Dashboard'),
    React.createElement(
      'p',
      { style: { margin: 0, color: '#6b7280' } },
      props.companyId ? `Company: ${props.companyId}` : 'Select a company to view VAT declarations',
    ),
  );
}

export function VatSettingsPanel(props: { moduleKey?: string }) {
  return React.createElement(
    'div',
    { style: { padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' } },
    React.createElement('h3', { style: { margin: '0 0 8px' } }, 'VAT Settings'),
    React.createElement(
      'p',
      { style: { margin: 0, color: '#6b7280' } },
      props.moduleKey ? `Module: ${props.moduleKey}` : 'Configure VAT settings and filing frequencies',
    ),
  );
}

export const VatPluginConfig: ModuleUIRegistration = {
  id: 'tax',
  title: 'Tax & VAT',
  navigationPath: '/tax/vat',
  icon: 'RECEIPT',
  dashboardWidgets: [
    {
      id: 'vat.dashboard',
      component: VatDashboardWidget,
      gridSize: 'full',
    },
  ],
  settingsPanel: VatSettingsPanel,
};
