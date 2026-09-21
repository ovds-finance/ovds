/**
 * @ovds/ui/hooks/useZodForm — React Hook Form + shared Zod schema bridge
 *
 * Wraps react-hook-form's useForm with a resolver created from any Zod schema
 * exported by @ovds/dto or @ovds/contracts. This guarantees that the frontend
 * enforces the exact same validation rules as the NestJS backend.
 *
 * Usage:
 *   import { useZodForm } from '@ovds/ui';
 *   import { LoginSchema } from '@ovds/dto';
 *
 *   const { register, handleSubmit, formState: { errors } } = useZodForm({ schema: LoginSchema });
 *
 * NOTE: This hook requires react-hook-form as a peer dependency.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from 'react-hook-form';
import type { DefaultValues, FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';

export type UseZodFormOptions<T extends FieldValues> = {
  schema: ZodType<T>;
  defaultValues?: Partial<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onChange' | 'onBlur';
  shouldUnregister?: boolean;
  shouldFocusError?: boolean;
  criteriaMode?: 'firstError' | 'all';
};

export function useZodForm<T extends FieldValues>(options: UseZodFormOptions<T>) {
  const { schema, defaultValues, ...rest } = options;

  return useForm<T>({
    resolver: async (values: T) => {
      const result = await schema.safeParseAsync(values);
      if (result.success) {
        return { values: result.data, errors: {} };
      }
      const errors: Record<string, { type: string; message: string }> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (path && !errors[path]) {
          errors[path] = { type: issue.code, message: issue.message };
        }
      }
      return { values: {}, errors } as any;
    },
    defaultValues: defaultValues as DefaultValues<T>,
    mode: options.mode ?? 'onSubmit',
    ...rest,
  });
}
