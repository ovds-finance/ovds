import api from './api';

export const treasuryApi = {
  // Cash Forecasting
  generateForecast: () => api.post('/ovds/treasury/forecast'),

  getForecasts: () => api.get('/ovds/treasury/forecasts'),

  // Payment Batches
  createBatch: (data: any) => api.post('/ovds/treasury/batches', data),

  getBatches: (params: any) => api.get('/ovds/treasury/batches', { params }),

  updateBatch: (id: string, data: any) => api.patch(`/ovds/treasury/batches/${id}`, data),

  // Export
  exportBatch: (id: string) => api.get(`/ovds/treasury/batches/${id}/export`, { responseType: 'blob' }),
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
