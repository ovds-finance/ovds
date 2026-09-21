import {
  DEVICE_CONTROL_CATEGORIES,
  DEVICE_CONTROL_CATEGORY_META,
  type DeviceControlCategory,
  type DeviceControlSettings,
} from '@ovds/shared';
import { Modal, Btn, Select, Textarea, FormField } from '@ovds/ui';
import React, { useEffect, useState } from 'react';

import { defaultSettingsFor, useCreateChangeRequest } from '../../services/deviceControlApi';

import { PolicySettingsForm } from './PolicySettingsForm';

interface Props {
  open: boolean;
  onClose: () => void;
  initialCategory?: DeviceControlCategory;
  initialSettings?: DeviceControlSettings;
}

export const ChangeRequestDialog: React.FC<Props> = ({
  open,
  onClose,
  initialCategory,
  initialSettings,
}) => {
  const create = useCreateChangeRequest();
  const [category, setCategory] = useState<DeviceControlCategory>(
    initialCategory ?? 'ENCRYPTION',
  );
  const [settings, setSettings] = useState<DeviceControlSettings>(
    initialSettings ?? defaultSettingsFor(initialCategory ?? 'ENCRYPTION'),
  );
  const [reason, setReason] = useState('');
  const [submit, setSubmit] = useState(true);

  useEffect(() => {
    if (open) {
      const cat = initialCategory ?? 'ENCRYPTION';
      setCategory(cat);
      setSettings(initialSettings ?? defaultSettingsFor(cat));
      setReason('');
      setSubmit(true);
    }
  }, [open, initialCategory, initialSettings]);

  const onCategoryChange = (cat: DeviceControlCategory) => {
    setCategory(cat);
    setSettings(defaultSettingsFor(cat));
  };

  const save = async () => {
    await create.mutateAsync({
      category,
      settings,
      reason: reason.trim() || undefined,
      submit,
    });
    onClose();
  };

  const meta = DEVICE_CONTROL_CATEGORY_META[category];

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="max-w-2xl"
      title="Propose Device Control Change"
      subtitle="High-impact changes require a second approver before enforcement."
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={save} loading={create.isPending}>
            {submit ? 'Submit for Review' : 'Save Draft'}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Control Category" required>
          <Select
            value={category}
            onChange={(v) => onCategoryChange(v as DeviceControlCategory)}
          >
            {DEVICE_CONTROL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {DEVICE_CONTROL_CATEGORY_META[c].label}
              </option>
            ))}
          </Select>
        </FormField>

        {meta && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
            <span className="font-bold">Why this needs review:</span> {meta.riskNote}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Proposed Settings
          </p>
          <PolicySettingsForm
            category={category}
            value={settings}
            onChange={setSettings}
          />
        </div>

        <FormField
          label="Business Justification"
          required={submit}
          hint="Recorded in the audit trail for this change request."
        >
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this org-wide change is required…"
          />
        </FormField>

        <label className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={submit}
            onChange={(e) => setSubmit(e.target.checked)}
            className="rounded border-slate-300"
          />
          Submit for review immediately (otherwise saved as draft)
        </label>
      </div>
    </Modal>
  );
};
