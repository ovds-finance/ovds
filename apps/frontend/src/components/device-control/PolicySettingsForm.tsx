import {
  DEVICE_CONTROL_ENUM_FIELDS,
  type DeviceControlCategory,
  type DeviceControlSettings,
} from '@ovds/shared';
import { Input, Select, Textarea, FormField } from '@ovds/ui';
import React from 'react';

interface Props {
  category: DeviceControlCategory;
  value: DeviceControlSettings;
  onChange: (next: DeviceControlSettings) => void;
  disabled?: boolean;
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export const PolicySettingsForm: React.FC<Props> = ({
  category,
  value,
  onChange,
  disabled,
}) => {
  const enumFields = DEVICE_CONTROL_ENUM_FIELDS[category] ?? {};

  const update = (key: string, v: unknown) => {
    onChange({ ...value, [key]: v });
  };

  const renderField = (key: string, val: unknown) => {
    const enumOptions = enumFields[key];

    if (Array.isArray(val)) {
      return (
        <FormField key={key} label={humanize(key)} hint="One value per line">
          <Textarea
            rows={3}
            disabled={disabled}
            value={(val as unknown[]).join('\n')}
            onChange={(e) =>
              update(
                key,
                e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </FormField>
      );
    }

    if (typeof val === 'boolean') {
      return (
        <FormField key={key} label={humanize(key)}>
          <Select
            disabled={disabled}
            value={val ? 'true' : 'false'}
            onChange={(v) => update(key, v === 'true')}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </Select>
        </FormField>
      );
    }

    if (typeof val === 'number') {
      return (
        <FormField key={key} label={humanize(key)}>
          <Input
            type="number"
            disabled={disabled}
            value={val}
            onChange={(e) => update(key, Number(e.target.value))}
          />
        </FormField>
      );
    }

    if (enumOptions) {
      return (
        <FormField key={key} label={humanize(key)}>
          <Select
            disabled={disabled}
            value={String(val)}
            onChange={(v) => update(key, v)}
          >
            {enumOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </FormField>
      );
    }

    return (
      <FormField key={key} label={humanize(key)}>
        <Input
          disabled={disabled}
          value={String(val ?? '')}
          onChange={(e) => update(key, e.target.value)}
        />
      </FormField>
    );
  };

  return (
    <div className="space-y-3">
      {Object.keys(value).map((k) => renderField(k, value[k]))}
    </div>
  );
};
