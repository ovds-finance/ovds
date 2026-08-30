import React, { useState } from 'react';
import { PageShell, Btn } from '@ovds/ui';
import { ShieldAlert, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  type DeviceControlCategory,
  type DeviceControlChangeRequestDTO as DeviceControlChangeRequest,
  type DeviceControlSettings,
} from '@ovds/shared';
import { useAuth } from '../rbac/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  useDeviceControlChangeRequests,
  useDeviceControlPolicies,
} from '../services/deviceControlApi';
import { DeviceControlCenter } from '../components/device-control/DeviceControlCenter';
import { ChangeRequestQueue } from '../components/device-control/ChangeRequestQueue';
import { ChangeRequestDialog } from '../components/device-control/ChangeRequestDialog';
import { ReviewDialog } from '../components/device-control/ReviewDialog';

export default function DeviceControl() {
  const { can, user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'center' | 'queue'>('center');
  const [createOpen, setCreateOpen] = useState(false);
  const [initial, setInitial] = useState<{
    category?: DeviceControlCategory;
    settings?: DeviceControlSettings;
  }>({});
  const [reviewRequest, setReviewRequest] =
    useState<DeviceControlChangeRequest | null>(null);

  const { data: policies = [], isLoading: policiesLoading } =
    useDeviceControlPolicies();
  const { data: requests = [] } = useDeviceControlChangeRequests();
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  useWebSocket({
    events: {
      deviceControlUpdate: () => {
        qc.invalidateQueries({ queryKey: ['device-control'] });
      },
    },
  });

  const openPropose = (category: DeviceControlCategory, settings: DeviceControlSettings) => {
    setInitial({ category, settings });
    setCreateOpen(true);
  };

  return (
    <PageShell
      title="Device Control Center"
      subtitle="Organization-wide controls with maker-checker enforcement. Every high-impact change is reviewed by a second person before it takes effect."
      icon={<ShieldAlert size={18} />}
      actions={
        can('device_control:propose') ? (
          <Btn
            variant="primary"
            onClick={() => {
              setInitial({});
              setCreateOpen(true);
            }}
            icon={<Plus size={14} />}
          >
            New Change Request
          </Btn>
        ) : undefined
      }
      tabs={[
        { key: 'center', label: 'Control Center' },
        { key: 'queue', label: 'Change Requests', count: pendingCount },
      ]}
      activeTab={tab}
      onTabChange={(k) => setTab(k as 'center' | 'queue')}
    >
      {tab === 'center' ? (
        <DeviceControlCenter
          policies={policies}
          loading={policiesLoading}
          onPropose={openPropose}
        />
      ) : (
        <ChangeRequestQueue onReview={setReviewRequest} />
      )}

      <ChangeRequestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        initialCategory={initial.category}
        initialSettings={initial.settings}
      />

      <ReviewDialog
        open={!!reviewRequest}
        onClose={() => setReviewRequest(null)}
        request={reviewRequest}
        currentUserId={user?.id}
      />
    </PageShell>
  );
}
