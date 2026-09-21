/**
 * @ovds/ui/components/FormField — form field wrapper with Zod validation
 *
 * Provides a consistent form field layout with label, error message,
 * and helper text. Works with react-hook-form and the useZodForm hook.
 *
 * Usage:
 *   <FormField
 *     label="Email"
 *     name="email"
 *     control={form}
 *     render={({ field }) => (
 *       <Input {...field} type="email" placeholder="you@example.com" />
 *     )}
 *   />
 *
 * Or simpler:
 *   <FormField
 *     label="Username"
 *     name="username"
 *     control={form}
 *     component={Input}
 *     componentProps={{ placeholder: 'Enter username' }}
 *   />
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { useFormContext, useFormState } from 'react-hook-form';
import type { FieldValues, Path } from 'react-hook-form';

export interface FormFieldProps<T extends FieldValues> {
  label?: string;
  name: keyof T & string;
  control: ReturnType<typeof useFormContext<T>>;
  render?: (props: { field: any; fieldState: any; formState: any }) => React.ReactNode;
  component?: React.ComponentType<any>;
  componentProps?: Record<string, any>;
  helperText?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export function FormField<T extends FieldValues>({
  label,
  name,
  control,
  render,
  component: Component,
  componentProps = {},
  helperText,
  required,
  className,
  labelClassName,
  errorClassName,
}: FormFieldProps<T>) {
  const { formState: { errors } } = control;
  const error = errors[name];

  const field = control.register(name as Path<T>, { required });

  const content = render ? (
    render({ field, fieldState: { error }, formState: { errors } })
  ) : Component ? (
    <Component {...field} {...componentProps} />
  ) : null;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={name}
          className={cn(
            'block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]',
            labelClassName,
          )}
        >
          {label}
          {required && <span className="text-[var(--critical)] ml-1">*</span>}
        </label>
      )}
      {content}
      {error && (
        <p
          className={cn(
            'text-[11px] text-[var(--critical)] flex items-center gap-1',
            errorClassName,
          )}
          role="alert"
        >
          {error.message as string}
        </p>
      )}
      {helperText && !error && (
        <p className="text-[10px] text-[var(--text-muted)]">
          {helperText}
        </p>
      )}
    </div>
  );
}
