/**
 * UsersAccessPage — /settings/users-access
 *
 * Renders the Users & Access settings section as a standalone page.
 */
import { CentralControlPanelContent } from '@ovds/features/settings';
import { Skeleton } from '@ovds/ui';
import React from 'react';

import { useBusiness } from '../../context/businessContext';
import { orpc } from '../../lib/orpc';
import { useAuth } from '../../rbac';

const UsersAccessPage: React.FC = () => {
  const { can } = useAuth();
  const { selectedCompanyId, loading } = useBusiness();

  if (loading) {
    return (
      <div className="space-y-4 p-1">
        <Skeleton.Line className="h-10 w-64 rounded-xl" />
        <div className="grid gap-5" style={{ gridTemplateColumns: '248px 1fr' }}>
          <Skeleton.Line className="h-[480px] rounded-xl" />
          <Skeleton.Line className="h-[480px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <CentralControlPanelContent
      orpc={orpc}
      canWrite={can('settings:write')}
      companyId={selectedCompanyId}
      defaultSection="users"
    />
  );
};

export default UsersAccessPage;
