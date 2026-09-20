import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export const TOKEN_KEY = 'safnexbd_mobile_token';
export const REFRESH_TOKEN_KEY = 'safnexbd_mobile_refresh_token';
export const USER_KEY = 'safnexbd_mobile_user';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const apiClient = api;

// Request interceptor to attach JWT token
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Failed to retrieve token from storage:', err);
  }
  return config;
});

// Response interceptor to extract data and handle token refresh
api.interceptors.response.use(
  (response) => {
    // Backend wraps response in { success: true, data: ... }
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const message = error.response?.data?.message || error.message || 'An error occurred';

    // Handle 401 token refresh if needed
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
          if (newAccessToken) {
            await AsyncStorage.setItem(TOKEN_KEY, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          }
        }
      } catch {
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      }
    }

    const errObj = new Error(Array.isArray(message) ? message[0] : message);
    (errObj as any).status = error.response?.status;
    return Promise.reject(errObj);
  }
);
