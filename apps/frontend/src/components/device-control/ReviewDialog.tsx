import {
  DEVICE_CONTROL_CATEGORY_META,
  type DeviceControlChangeRequestDTO as DeviceControlChangeRequest,
} from '@ovds/shared';
import { Modal, Btn, Textarea, FormField, StatusBadge } from '@ovds/ui';
import React from 'react';

import { useReviewChangeRequest } from '../../services/deviceControlApi';

import { PolicySettingsForm } from './PolicySettingsForm';

interface Props {
  open: boolean;
  onClose: () => void;
  request: DeviceControlChangeRequest | null;
  currentUserId?: string;
}

export const ReviewDialog: React.FC<Props> = ({
  open,
  onClose,
  request,
  currentUserId,
}) => {
  const review = useReviewChangeRequest();
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    if (open) setNote('');
  }, [open, request?.id]);

  if (!request) return null;

  const meta = DEVICE_CONTROL_CATEGORY_META[request.category];
  const isMaker = !!request.makerId && request.makerId === currentUserId;
  const disabled = isMaker || review.isPending;

  const decide = async (decision: 'APPROVE' | 'REJECT') => {
    await review.mutateAsync({
      id: request.id,
      dto: { decision, reviewNote: note.trim() || undefined },
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title="Review Device Control Change"
      subtitle={`${meta?.label ?? request.category} — maker ${request.makerName ?? 'unknown'}`}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={review.isPending}>
            Close
          </Btn>
          <Btn
            variant="danger"
            onClick={() => decide('REJECT')}
            loading={review.isPending}
            disabled={disabled}
          >
            Reject
          </Btn>
          <Btn
            variant="primary"
            onClick={() => decide('APPROVE')}
            loading={review.isPending}
            disabled={disabled}
          >
            Approve &amp; Enforce
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} />
          {isMaker && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              You proposed this change and cannot also review it (segregation of duties).
            </span>
          )}
        </div>

        {request.reason && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-[12px] text-slate-600 dark:text-slate-300">
            <span className="font-bold">Justification:</span> {request.reason}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Proposed Settings (enforced org-wide on approval)
          </p>
          <PolicySettingsForm
            category={request.category}
            value={request.settings}
            onChange={() => {}}
            disabled
          />
        </div>

        <FormField label="Review Note">
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for the audit trail…"
          />
        </FormField>
      </div>
    </Modal>
  );
};
