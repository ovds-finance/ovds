import {
  DEVICE_CONTROL_CATEGORY_META,
  DEVICE_CONTROL_CATEGORIES,
  DEVICE_CONTROL_CHANGE_STATUSES,
  type DeviceControlCategory,
  type DeviceControlChangeRequestDTO as DeviceControlChangeRequest,
} from '@ovds/shared';
import { BaseTable, Btn, Select, StatusBadge } from '@ovds/ui';
import { Send, XCircle, Eye } from 'lucide-react';
import React, { useState } from 'react';

import { useAuth } from '../../rbac/AuthContext';
import {
  useCancelChangeRequest,
  useDeviceControlChangeRequests,
  useSubmitChangeRequest,
} from '../../services/deviceControlApi';

interface Props {
  onReview: (request: DeviceControlChangeRequest) => void;
}

export const ChangeRequestQueue: React.FC<Props> = ({ onReview }) => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [status, setStatus] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  const { data = [], isLoading } = useDeviceControlChangeRequests({
    status: status || undefined,
    category: category || undefined,
  });
  const submit = useSubmitChangeRequest();
  const cancel = useCancelChangeRequest();

  const cols = [
    {
      key: 'category',
      label: 'Control',
      render: (row: DeviceControlChangeRequest) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {DEVICE_CONTROL_CATEGORY_META[row.category]?.label ?? row.category}
          </span>
          <span className="text-[10px] text-slate-400">
            by {row.makerName ?? 'unknown'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: DeviceControlChangeRequest) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: 'reason',
      label: 'Justification',
      render: (row: DeviceControlChangeRequest) => (
        <span className="text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[280px]">
          {row.reason ?? '—'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (row: DeviceControlChangeRequest) => (
        <span className="text-slate-400">
          {new Date(row.updatedAt).toLocaleString()}
        </span>
      ),
    },
  ];

  const actions = (row: DeviceControlChangeRequest) => {
    const isMaker = !!row.makerId && row.makerId === currentUserId;
    if (row.status === 'DRAFT' && isMaker) {
      return (
        <>
          <Btn
            size="xs"
            variant="primary"
            loading={submit.isPending}
            onClick={() => submit.mutate(row.id)}
            icon={<Send size={12} />}
          >
            Submit
          </Btn>
          <Btn
            size="xs"
            variant="danger"
            loading={cancel.isPending}
            onClick={() => cancel.mutate(row.id)}
            icon={<XCircle size={12} />}
          >
            Cancel
          </Btn>
        </>
      );
    }
    if (row.status === 'PENDING' && !isMaker) {
      return (
        <Btn
          size="xs"
          variant="primary"
          onClick={() => onReview(row)}
          icon={<Eye size={12} />}
        >
          Review
        </Btn>
      );
    }
    if (row.status === 'PENDING' && isMaker) {
      return (
        <span className="text-[10px] text-amber-600 dark:text-amber-400">
          Awaiting review
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={status}
          onChange={(v) => setStatus(v)}
          className="w-40"
        >
          <option value="">All statuses</option>
          {DEVICE_CONTROL_CHANGE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={category}
          onChange={(v) => setCategory(v)}
          className="w-48"
        >
          <option value="">All categories</option>
          {DEVICE_CONTROL_CATEGORIES.map((c: DeviceControlCategory) => (
            <option key={c} value={c}>
              {DEVICE_CONTROL_CATEGORY_META[c].label}
            </option>
          ))}
        </Select>
      </div>

      <BaseTable
        cols={cols}
        rows={data}
        loading={isLoading}
        emptyLabel="No change requests"
        actions={actions}
      />
    </div>
  );
};
