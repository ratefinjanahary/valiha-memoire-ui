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
  },

  getUsers: async (page: number = 1, limit: number = 10, search?: string) => {
    const { data } = await api.get<{ items: User[]; total: number; page: number; limit: number; totalPages: number }>('/users', {
      params: { page, limit, search }
    });
    return data;
  },

  updateRole: async (id: string, role: string) => {
    const { data } = await api.put<User>(`/users/${id}/role`, { role });
    return data;
  },

  deleteUser: async (id: string) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/users/${id}`);
    return data;
  }
};
