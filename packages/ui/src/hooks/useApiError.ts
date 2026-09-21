/**
 * @ovds/ui/hooks/useApiError — React hook for API error handling
 *
 * Provides a typed hook for managing API errors in React components.
 * Works with the standard ApiResponse envelope from @ovds/dto.
 *
 * Usage:
 *   const { error, clearError, handleError, getFieldError } = useApiError();
 *
 *   try {
 *     await api.post('/login', credentials);
 *   } catch (e) {
 *     handleError(e);
 *   }
 *
 *   // Display errors
 *   {error && <Alert variant="error">{error.message}</Alert>}
 *   {getFieldError('email') && <span>{getFieldError('email')}</span>}
 */

import { useState, useCallback } from 'react';
import { ApiError, extractApiError, getFieldError as getFieldErrorUtil, hasFieldError } from '../utils/errors';

export interface UseApiErrorResult {
  error: ApiError | null;
  data: ReturnType<typeof extractApiError>;
  clearError: () => void;
  handleError: (error: unknown) => void;
  getFieldError: (field: string) => string | undefined;
  hasFieldError: (field: string) => boolean;
  isValidationError: boolean;
  isAuthError: boolean;
  isNotFound: boolean;
  isServerError: boolean;
}

export function useApiError(): UseApiErrorResult {
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((e: unknown) => {
    const data = extractApiError(e);
    if (data) {
      setError(new ApiError(data));
    } else {
      setError(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getFieldError = useCallback((field: string) => {
    if (!error) return undefined;
    return getFieldErrorUtil(error.data, field);
  }, [error]);

  const hasField = useCallback((field: string) => {
    if (!error) return false;
    return hasFieldError(error.data, field);
  }, [error]);

  return {
    error,
    data: error?.data || null,
    clearError,
    handleError,
    getFieldError,
    hasFieldError: hasField,
    isValidationError: error?.isValidationError || false,
    isAuthError: error?.isAuthError || false,
    isNotFound: error?.isNotFound || false,
    isServerError: error?.isServerError || false,
  };
}
