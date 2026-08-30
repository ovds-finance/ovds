/**
 * Shared API client for OVDS apps.
 *
 * Both the admin ERP (apps/frontend) and the Client Portal (apps/portal)
 * should import from this file so API contracts stay in one place.
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
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ovds_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
