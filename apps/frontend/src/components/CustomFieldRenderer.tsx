/**
 * CustomFieldRenderer
 *
 * Renders a dynamic section of custom fields for any entity.
 * Fetches field definitions + existing values from the backend,
 * and exposes an onChange callback so the parent form can include
 * the values in its save payload via orpc.customFields.values.save.
 *
 * Usage:
 *   <CustomFieldRenderer
 *     feature="invoice"
 *     entityId={invoiceId}          // omit for "create" mode (no saved values yet)
 *     companyId={selectedCompanyId}
 *     onChange={(map) => setCustomValues(map)}
 *   />
 *
 * The onChange map shape: Record<customFieldId, string | null>
 * Save it by calling: orpc.customFields.values.save.mutate({
 *   entityId, feature, companyId, values: customValues
 * })
 */
import React, { useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orpcUtils } from '../lib/orpc';
import { FormField, Input, Textarea, Select } from './ui';
import type { CustomFieldFeature } from '@ovds/contracts/schemas';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CustomFieldWithValue {
  id: string;
  label: string;
  type: string;
  options: string | null;
  isRequired: boolean;
  placeholder: string | null;
  hint: string | null;
  defaultValue: string | null;
  width: string | null;
  value: string | null;
  valueId: string | null;
}

export type CustomFieldValuesMap = Record<string, string | null>;

interface CustomFieldRendererProps {
  feature: CustomFieldFeature;
  entityId?: string;          // present in edit mode; omit for create
  companyId?: string | null;
  /** Called whenever any field value changes */
  onChange?: (values: CustomFieldValuesMap) => void;
  /** Initial values override (useful when you already have the values in state) */
  initialValues?: CustomFieldValuesMap;
  className?: string;
  /** If true, renders a section title above the fields */
  showTitle?: boolean;
}

// ── Option parser ─────────────────────────────────────────────────────────────

function parseOptions(raw: string | null): { label: string; value: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) =>
        typeof item === 'string'
          ? { label: item, value: item }
          : { label: String(item.label ?? item.value), value: String(item.value ?? item.label) },
      );
    }
  } catch {
    // Fallback: comma-separated string
    return raw.split(',').map((s) => ({ label: s.trim(), value: s.trim() }));
  }
  return [];
}

// ── Single field input ────────────────────────────────────────────────────────

interface FieldInputProps {
  field: CustomFieldWithValue;
  value: string;
  onChange: (v: string) => void;
}

const FieldInput: React.FC<FieldInputProps> = ({ field, value, onChange }) => {
  const placeholder = field.placeholder ?? '';

  switch (field.type) {
    case 'TEXTAREA':
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      );

    case 'NUMBER':
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      );

    case 'DATE':
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'TIME':
      return (
        <Input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'DATETIME':
      return (
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'EMAIL':
      return (
        <Input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'user@example.com'}
        />
      );

    case 'PHONE':
      return (
        <Input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '+251 9XX XXX XXX'}
        />
      );

    case 'URL':
      return (
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'https://'}
        />
      );

    case 'CHECKBOX':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            className="accent-emerald-600 w-4 h-4"
          />
          <span className="text-[12px] text-slate-600 dark:text-slate-400">
            {field.label}
          </span>
        </label>
      );

    case 'TOGGLE':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
          </div>
          <span className="text-[12px] text-slate-600 dark:text-slate-400">
            {field.label}
          </span>
        </label>
      );

    case 'SELECT': {
      const opts = parseOptions(field.options);
      return (
        <Select
          options={opts}
          value={value || ''}
          onValueChange={(v) => onChange(v)}
        />
      );
    }

    case 'MULTISELECT': {
      const opts = parseOptions(field.options);
      const selected = value ? value.split(',') : [];
      const toggle = (v: string) => {
        const next = selected.includes(v)
          ? selected.filter((x) => x !== v)
          : [...selected, v];
        onChange(next.join(','));
      };
      return (
        <div className="flex flex-wrap gap-1.5">
          {opts.map((o) => {
            const active = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  active
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }

    default: // TEXT
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      );
  }
};

// ── Main component ────────────────────────────────────────────────────────────

const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  feature,
  entityId,
  companyId,
  onChange,
  initialValues,
  className = '',
  showTitle = true,
}) => {
  // Fetch field definitions + values for this entity
  const { data: fields, isLoading } = useQuery({
    ...orpcUtils.customFields.values.getForEntity.queryOptions({
      input: { entityId: entityId ?? '__none__', feature, companyId: companyId ?? undefined },
    }),
    enabled: !!companyId,
  });

  // Local values state — keyed by customFieldId
  const [values, setValues] = React.useState<CustomFieldValuesMap>(() => {
    if (initialValues) return initialValues;
    return {};
  });

  // Seed from API on first load
  useEffect(() => {
    if (!fields?.length) return;
    setValues((prev) => {
      const seed: CustomFieldValuesMap = {};
      for (const f of fields as CustomFieldWithValue[]) {
        seed[f.id] = f.value ?? f.defaultValue ?? '';
      }
      // initialValues override API seed
      return { ...seed, ...initialValues, ...prev };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  const handleChange = useCallback(
    (fieldId: string, val: string) => {
      setValues((prev) => {
        const next = { ...prev, [fieldId]: val };
        onChange?.(next);
        return next;
      });
    },
    [onChange],
  );

  const visibleFields = useMemo(
    () => (fields ?? []) as CustomFieldWithValue[],
    [fields],
  );

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[1, 2].map((i) => (
          <div key={i} className="h-9 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!visibleFields.length) return null;

  const widthClass = (w: string | null) => {
    switch (w) {
      case 'half': return 'sm:w-1/2';
      case 'third': return 'sm:w-1/3';
      case 'quarter': return 'sm:w-1/4';
      default: return 'sm:w-full';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2">
            Custom Fields
          </span>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
        </div>
      )}

      {visibleFields.map((field) => (
        <div key={field.id} className={widthClass(field.width)}>
          <FormField
            label={field.label}
            required={field.isRequired}
            hint={field.hint ?? undefined}
          >
            {field.type === 'CHECKBOX' ? (
              <FieldInput
                field={field}
                value={values[field.id] ?? ''}
                onChange={(v) => handleChange(field.id, v)}
              />
            ) : (
              <FieldInput
                field={field}
                value={values[field.id] ?? ''}
                onChange={(v) => handleChange(field.id, v)}
              />
            )}
          </FormField>
        </div>
      ))}
    </div>
  );
};

export default CustomFieldRenderer;
