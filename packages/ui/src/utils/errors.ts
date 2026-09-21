/**
 * @ovds/ui/utils/errors — typed API error handling utilities
 *
 * Provides types and hooks for handling API errors consistently across the
 * application. Works with the standard ApiResponse envelope from @ovds/dto.
 *
 * Usage:
 *   import { useApiError, ApiErrorToast } from '@ovds/ui';
 *
 *   function MyComponent() {
 *     const { error, clearError, handleError } = useApiError();
 *
 *     const onSubmit = async () => {
 *       try {
 *         await api.post('/endpoint', body);
 *       } catch (e) {
 *         handleError(e);
 *       }
 *     };
 *
 *     return (
 *       <>
 *         {error && <div className="text-critical">{error.message}</div>}
 *         <button onClick={onSubmit}>Submit</button>
 *       </>
 *     );
 *   }
 */

export interface ApiErrorData {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  fields?: Record<string, string>;
  requestId?: string;
  timestamp?: string;
  ms?: string;
  errors?: string[];
}

export class ApiError extends Error {
  constructor(
    public data: ApiErrorData,
    message?: string,
  ) {
    super(message || data.message);
    this.name = 'ApiError';
    this.data = data;
  }

  get statusCode() {
    return this.data.statusCode;
  }

  get fields() {
    return this.data.fields || {};
  }

  get requestId() {
    return this.data.requestId;
  }

  get isValidationError() {
    return this.statusCode === 400 && this.data.fields && Object.keys(this.data.fields).length > 0;
  }

  get isAuthError() {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  get isNotFound() {
    return this.statusCode === 404;
  }

  get isServerError() {
    return this.statusCode >= 500;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function extractApiError(error: unknown): ApiErrorData | null {
  if (isApiError(error)) {
    return error.data;
  }

  if (error && typeof error === 'object') {
    const anyError = error as any;
    if (anyError.data && anyError.data.success === false) {
      return anyError.data as ApiErrorData;
    }
    if (anyError.status && anyError.message) {
      return {
        success: false,
        statusCode: anyError.status,
        message: anyError.message,
        error: anyError.name,
      };
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      statusCode: 500,
      message: error.message,
      error: 'UnknownError',
    };
  }

  return null;
}

export function getFieldError(data: ApiErrorData, field: string): string | undefined {
  return data.fields?.[field];
}

export function hasFieldError(data: ApiErrorData, field: string): boolean {
  return !!data.fields?.[field];
}
