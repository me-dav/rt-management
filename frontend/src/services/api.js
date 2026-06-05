import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const login      = (data) => api.post('/login', data);
export const logout     = ()     => api.post('/logout');
export const getMe      = ()     => api.get('/me');

export const getResidents    = (params) => api.get('/residents', { params });
export const getResident     = (id)     => api.get(`/residents/${id}`);
export const createResident  = (data)   => api.post('/residents', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateResident  = (id, data) => api.post(`/residents/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteResident  = (id)     => api.delete(`/residents/${id}`);

export const getHouses      = ()      => api.get('/houses');
export const getHouse       = (id)    => api.get(`/houses/${id}`);
export const createHouse    = (data)  => api.post('/houses', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateHouse    = (id, data) => api.post(`/houses/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteHouse    = (id)    => api.delete(`/houses/${id}`);
export const getHouseHistory= (id)    => api.get(`/houses/${id}/history`);

export const createPayment  = (data)   => api.post('/payments', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getPayments    = (params) => api.get('/payments', { params });
export const getPayment     = (id)     => api.get(`/payments/${id}`);
export const approvePayment = (id)     => api.put(`/payments/${id}/approve`);
export const rejectPayment  = (id, reason) => api.put(`/payments/${id}/reject`, { reason });
export const getPaymentHistory = (params) => api.get('/payments/history', { params });
export const getMyPayments  = (params) => api.get('/payments/my', { params });

export const getExpenses    = (params) => api.get('/expenses', { params });
export const createExpense  = (data)   => api.post('/expenses', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateExpense  = (id, data) => api.post(`/expenses/${id}?_method=PUT`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteExpense  = (id)     => api.delete(`/expenses/${id}`);

export const getSummary     = (params)       => api.get('/reports/summary', { params });
export const getMonthlyReport = (m, y)       => api.get(`/reports/monthly/${m}/${y}`);
export const getYearlyReport  = (params)     => api.get('/reports/yearly', { params });

export default api;