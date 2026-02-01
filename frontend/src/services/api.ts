import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  register: (data: { name: string; phone_or_email: string; password: string; role: string }) =>
    api.post('/auth/register', data),
  verifyOTP: (data: { phone_or_email: string; otp: string }) =>
    api.post('/auth/verify-otp', data),
  login: (data: { phone_or_email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Machine API
export const machineAPI = {
  create: (data: any) => api.post('/machines', data),
  getAll: () => api.get('/machines'),
  getAllPublic: () => api.get('/machines/all'),
  getOne: (id: string) => api.get(`/machines/${id}`),
  update: (id: string, data: any) => api.put(`/machines/${id}`, data),
  delete: (id: string) => api.delete(`/machines/${id}`),
};

// Contract API
export const contractAPI = {
  create: (data: any) => api.post('/contracts', data),
  getAll: () => api.get('/contracts'),
  getOne: (id: string) => api.get(`/contracts/${id}`),
  complete: (id: string) => api.put(`/contracts/${id}/complete`),
  delete: (id: string) => api.delete(`/contracts/${id}`),
};

// Daily Log API
export const dailyLogAPI = {
  create: (data: any) => api.post('/daily-logs', data),
  getByContract: (contractId: string) => api.get(`/daily-logs/${contractId}`),
  update: (logId: string, data: any) => api.put(`/daily-logs/${logId}`, data),
  engineTimer: (data: { contract_id: string; day_number: number; action: string }) =>
    api.post('/engine-timer', data),
};

// Fuel Prices API
export const fuelPricesAPI = {
  get: () => api.get('/fuel-prices'),
  update: (data: any) => api.put('/fuel-prices', data),
};

// Notifications API
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Admin API (App Owner Only)
export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getAllUsers: () => api.get('/admin/users'),
  getAllContracts: () => api.get('/admin/all-contracts'),
  getAllMachines: () => api.get('/admin/all-machines'),
  getRunningMachines: () => api.get('/admin/running-machines'),
  getRecentActivity: () => api.get('/admin/recent-activity'),
  getAllDailyLogs: () => api.get('/admin/daily-logs-all'),
};
