import axios from 'axios';

import { useAuthStore } from '@/stores/auth';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
