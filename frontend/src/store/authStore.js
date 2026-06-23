import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,

  // Backend returns { success, token, user }
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data; // { success, token, user }
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  // Backend returns { success, message }
  register: async (formData) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      set({ loading: false });
      return data; // { success, message }
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  // Backend returns { success, user }
  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      const user = data.user || data; // handle both shapes
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch {
      // token expired or invalid — clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null });
    }
  },

  updateUser: (updates) => {
    const updated = { ...get().user, ...updates };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  }
}));

export default useAuthStore;
