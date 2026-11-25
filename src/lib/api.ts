import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Routes publiques : un 401 ici ne veut pas dire « session expirée »
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/forgot-password-otp',
  '/auth/verify-otp',
];

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const isPublic = PUBLIC_ROUTES.includes(config.url ?? '');
  if (token && config.headers && !isPublic) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isPublic = PUBLIC_ROUTES.includes(error.config?.url ?? '');

    if (status === 401 && !isPublic) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);
