import React, { createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

export interface FormValues {
  [key: string]: any;
}

export interface FormContextValue {
  values: FormValues;
  setValue: (name: string, value: any) => void;
  errors: Record<string, string>;
  setError: (name: string, error: string) => void;
  clearErrors: () => void;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  reset: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export const useForm = () => {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useForm must be used within a <Form>');
  return ctx;
};

export interface FormProps {
  initialValues?: FormValues;
  onSubmit: (values: FormValues) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  onChange?: (values: FormValues) => void;
}

export const Form: React.FC<FormProps> = ({ initialValues = {}, onSubmit, children, className, onChange }) => {
  const [values, setValuesState] = React.useState<FormValues>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [dirty, setDirty] = React.useState(false);

  const setValue = (name: string, value: any) => {
    setValuesState((prev) => {
      const next = { ...prev, [name]: value };
      onChange?.(next);
      return next;
    });
    if (!dirty) setDirty(true);
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const setError = (name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const clearErrors = () => setErrors({});

  const reset = () => {
    setValuesState(initialValues);
    setErrors({});
    setDirty(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <FormContext.Provider value={{ values, setValue, errors, setError, clearErrors, dirty, setDirty, reset }}>
      <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4', className)} noValidate>
        {children}
      </form>
    </FormContext.Provider>
  );
};
