import { api } from '@/lib/api';
import { User } from '@/stores/authStore';

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await api.post<{ access_token: string; token?: string; user: User }>('/auth/login', credentials);
    return data;
  },
  
  register: async (userData: any) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get<User>('/auth/profile');
    return data;
  }
};
