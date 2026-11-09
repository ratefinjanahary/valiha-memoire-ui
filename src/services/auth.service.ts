import { api } from '@/lib/api';
import { User } from '@/stores/authStore';
import { UpdateProfilePayload } from '@/lib/validators/profile';

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const { data } = await api.post<{ access_token: string; token?: string; user: User }>('/auth/login', credentials);
    return data;
  },
  
  register: async (userData: any) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  },

  /* Flux par lien */
  forgotPassword: async (email: string) => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (payload: { token: string; newPassword: string }) => {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', payload);
    return data;
  },

  /* Flux par code OTP */
  forgotPasswordOtp: async (email: string) => {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password-otp', { email });
    return data;
  },

  resetPasswordOtp: async (payload: { email: string; code: string; newPassword: string }) => {
    const { data } = await api.post<{ message: string }>('/auth/reset-password-otp', payload);
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

  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await api.patch<{ access_token: string; user: User }>('/users/profile', payload);
    return data;
  },

  deleteUser: async (id: string) => {
    const { data } = await api.delete<{ success: boolean; message: string }>(`/users/${id}`);
    return data;
  }
};
