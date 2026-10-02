import { apiClient } from '@/lib/api-client';
import { User } from '@/stores/authStore';

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await apiClient.post<{ access_token: string; token?: string; user: User }>('/auth/login', credentials);
    return data;
  },
  
  register: async (userData: any) => {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },

  getProfile: async () => {
    const { data } = await apiClient.get<User>('/auth/profile');
    return data;
  }
};
