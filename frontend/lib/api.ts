import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor — attach token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — auto refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as any;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const userId = localStorage.getItem('userId');
        if (!refreshToken || !userId) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
          userId,
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

// API helpers
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  setup2FA: () => api.get('/auth/2fa/setup'),
  verify2FA: (code: string) => api.post('/auth/2fa/verify', { code }),
  disable2FA: (code: string) => api.post('/auth/2fa/disable', { code }),
};

export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.patch('/users/me', data),
  deleteMe: () => api.delete('/users/me'),
};

export const doctorsApi = {
  getAll: (params?: any) => api.get('/doctors', { params }),
  getOne: (id: string) => api.get(`/doctors/${id}`),
  getSlots: (id: string, date: string) =>
    api.get(`/appointments/doctor/${id}/slots`, { params: { date } }),
  getProfile: () => api.get('/doctors/me/profile'),
  updateProfile: (data: any) => api.patch('/doctors/me/profile', data),
  setAvailability: (slots: any[]) => api.post('/doctors/me/availability', { slots }),
};

export const appointmentsApi = {
  create: (data: any) => api.post('/appointments', data),
  getAll: (params?: any) => api.get('/appointments', { params }),
  getOne: (id: string) => api.get(`/appointments/${id}`),
  update: (id: string, data: any) => api.patch(`/appointments/${id}`, data),
  getJoinToken: (id: string) => api.get(`/appointments/${id}/join`),
};

export const medicalRecordsApi = {
  getAll: () => api.get('/medical-records'),
  getOne: (id: string) => api.get(`/medical-records/${id}`),
  create: (data: any) => api.post('/medical-records', data),
  update: (id: string, data: any) => api.patch(`/medical-records/${id}`, data),
};

export const prescriptionsApi = {
  getAll: () => api.get('/prescriptions'),
  getOne: (id: string) => api.get(`/prescriptions/${id}`),
  create: (data: any) => api.post('/prescriptions', data),
  downloadPdf: (id: string) =>
    api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' }),
};

export const paymentsApi = {
  createIntent: (appointmentId: string) =>
    api.post(`/payments/intent/${appointmentId}`),
  confirm: (paymentIntentId: string) =>
    api.post('/payments/confirm', { paymentIntentId }),
  getHistory: () => api.get('/payments/history'),
};

export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  getThread: (partnerId: string) => api.get(`/messages/thread/${partnerId}`),
  send: (data: any) => api.post('/messages', data),
};

export const specialitiesApi = {
  getAll: () => api.get('/specialities'),
};

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingDoctors: () => api.get('/admin/doctors/pending'),
  verifyDoctor: (id: string) => api.patch(`/admin/doctors/${id}/verify`),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getPayments: (params?: any) => api.get('/admin/payments', { params }),
};
