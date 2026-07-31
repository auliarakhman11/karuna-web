import axios from 'axios';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Request Interceptor: Attach Access Token if available
api.interceptors.request.use(
  (config) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop on auth endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);

        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// --- Named API functions ---

export const updateProfile = (name: string) =>
  api.put('/auth/profile', { name });

export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
  api.put('/auth/change-password', data);

// --- Categories API ---

export const getCategories = () => api.get('/categories');

export const createCategory = (name: string) => api.post('/categories', { name });

export const updateCategory = (id: string, name: string) => api.put(`/categories/${id}`, { name });

export const deleteCategory = (id: string) => api.delete(`/categories/${id}`);

// --- Items API ---

export const getItems = () => api.get('/items');

export const createItem = (data: {
  name: string;
  category_id?: string;
  unit: string;
  price: number;
  stock: number;
  description?: string;
}) => api.post('/items', data);

export const updateItem = (
  id: string,
  data: {
    name: string;
    category_id?: string;
    unit: string;
    price: number;
    stock: number;
    description?: string;
  }
) => api.put(`/items/${id}`, data);

export const deleteItem = (id: string) => api.delete(`/items/${id}`);

// --- Sales API ---

export interface SaleLineItem {
  item_id: string;
  quantity: number;
  price: number;
}

export const createSale = (data: {
  items: SaleLineItem[];
  payment_method: string;
  notes?: string;
}) => api.post('/sales', data);

export const getSales = () => api.get('/sales');

export default api;
