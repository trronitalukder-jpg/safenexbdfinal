import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('safnexbd_token') || localStorage.getItem('safnexbd_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to extract data cleanly
api.interceptors.response.use(
  (response) => {
    // If backend returns { success: true, data: ... }
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const message = error.response?.data?.message || error.message || 'An error occurred';

    // Handle 401 token refresh if needed
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (typeof window !== 'undefined') {
        const refreshToken =
          localStorage.getItem('safnexbd_refresh_token') ||
          localStorage.getItem('safnexbd_refresh_token');
        if (refreshToken) {
          try {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
            if (newAccessToken) {
              localStorage.setItem('safnexbd_token', newAccessToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios(originalRequest);
            }
          } catch {
            localStorage.removeItem('safnexbd_token');
            localStorage.removeItem('safnexbd_refresh_token');
            localStorage.removeItem('safnexbd_user');
            localStorage.removeItem('safnexbd_token');
            localStorage.removeItem('safnexbd_refresh_token');
            localStorage.removeItem('safnexbd_user');
          }
        }
      }
    }

    const errObj: any = new Error(Array.isArray(message) ? message[0] : message);
    errObj.response = error.response;
    errObj.status = error.response?.status;
    errObj.config = error.config;
    return Promise.reject(errObj);
  },
);

