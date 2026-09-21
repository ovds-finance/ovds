import type {} from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    _background?: boolean;
    _retry?: boolean;
    _retryCount?: number;
  }
  interface InternalAxiosRequestConfig {
    _background?: boolean;
    _retry?: boolean;
    _retryCount?: number;
  }
}
