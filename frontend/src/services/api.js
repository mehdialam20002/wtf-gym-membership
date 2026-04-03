import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Helper: check if URL is an admin-side route
function isAdminRoute(url) {
  if (!url) return false;
  if (url.startsWith('/admin')) return true;
  if (url.startsWith('/plans')) return true;
  if (url.startsWith('/gyms')) return true;
  // Admin membership/freeze routes
  if (url.startsWith('/memberships/all')) return true;
  if (url.startsWith('/memberships/admin')) return true;
  return false;
}

// Request interceptor
api.interceptors.request.use(
  config => {
    const userToken = localStorage.getItem('gym_user_token');
    const adminToken = localStorage.getItem('gym_admin_token');

    if (isAdminRoute(config.url)) {
      if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
    } else {
      // User routes: /user/*, /memberships/my, /memberships/purchase, /memberships/:id/freeze, etc.
      if (userToken) config.headers.Authorization = `Bearer ${userToken}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (isAdminRoute(url)) {
        localStorage.removeItem('gym_admin_token');
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } else {
        localStorage.removeItem('gym_user_token');
        if (window.location.pathname.startsWith('/dashboard')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
