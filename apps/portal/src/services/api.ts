/**
 * Shared API client for the OVDS Client Portal (apps/portal).
 *
 * Aligned with the main frontend client (apps/frontend/src/services/api.ts):
 *  - JWT bearer token attachment (localStorage)
 *  - x-company-id tenant header injection
 *  - 401 → dispatches ovds:session-expired (same event the main app listens to)
 *    instead of hard-navigating, so React Router handles the redirect cleanly
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ovds_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Forward the active company so backend tenant-scoped queries resolve
  // the correct company even when the JWT embeds a different one (e.g. after
  // an admin switches companies without a new login).
  const selectedCompanyId = localStorage.getItem('selectedCompanyId');
  if (selectedCompanyId) {
    config.headers['x-company-id'] = selectedCompanyId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove the stale token so the next request doesn't retry with it.
      localStorage.removeItem('ovds_token');
      // Dispatch the same event the main app uses — any component listening
      // (e.g. an AuthContext equivalent) can handle the redirect without
      // this service layer needing to know the routing structure.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ovds:session-expired'));
      }
    }
    return Promise.reject(error);
  },
);

export default api;
