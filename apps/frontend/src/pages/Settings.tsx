/**
 * Settings — thin app shell.
 *
 * All logic, forms, and section components live in:
 *   @ovds/features/settings → CentralControlPanelContent
 *
 * This file only wires the orpc client, auth, and business context.
 */
import React from 'react';
import { CentralControlPanelContent } from '@ovds/features/settings';
import { orpc } from '../lib/orpc';
import { useAuth } from '../rbac';
import { useBusiness } from '../context/businessContext';

const Settings: React.FC = () => {
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  return (
    <CentralControlPanelContent
      orpc={orpc}
      canWrite={can('settings:write')}
      companyId={selectedCompanyId}
    />
  );
};

export default Settings;
