import axios from 'axios';
import API_BASE_URL from '../config/api';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request deduplication cache
const pendingRequests = new Map();

// Generate cache key from request config
const getCacheKey = config => {
  return `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(config.params || {})}`;
};

// Request interceptor with deduplication
api.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Deduplicate GET requests (unless explicitly disabled)
    if (config.method === 'get' && config.deduplicate !== false) {
      const cacheKey = getCacheKey(config);
      if (pendingRequests.has(cacheKey)) {
        // Return the existing promise instead of creating a new request
        const existingRequest = pendingRequests.get(cacheKey);
        return Promise.reject({
          __CANCEL__: true,
          message: 'Duplicate request cancelled',
          originalRequest: existingRequest,
        });
      }
      pendingRequests.set(cacheKey, config);
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => {
    // Remove from pending requests
    if (response.config.method === 'get') {
      const cacheKey = getCacheKey(response.config);
      pendingRequests.delete(cacheKey);
    }

    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('auth_token', response.data.token);
    }
    return response;
  },
  error => {
    // Remove from pending requests on error
    if (error.config?.method === 'get') {
      const cacheKey = getCacheKey(error.config);
      pendingRequests.delete(cacheKey);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
