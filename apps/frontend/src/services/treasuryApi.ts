import api from './api';

export const treasuryApi = {
  // Cash Forecasting
  generateForecast: () => api.post('/treasury/forecast'),

  getForecasts: () => api.get('/treasury/forecasts'),

  // Payment Batches
  createBatch: (data: any) => api.post('/treasury/batches', data),

  getBatches: (params: any) => api.get('/treasury/batches', { params }),

  updateBatch: (id: string, data: any) => api.patch(`/treasury/batches/${id}`, data),

  // Export
  exportBatch: (id: string) => api.get(`/treasury/batches/${id}/export`, { responseType: 'blob' }),
};

export const useForecasts = () => ({
  generateForecast: treasuryApi.generateForecast,
  getForecasts: treasuryApi.getForecasts,
});

export const usePaymentBatches = () => ({
  createBatch: treasuryApi.createBatch,
  getBatches: treasuryApi.getBatches,
  updateBatch: treasuryApi.updateBatch,
});
