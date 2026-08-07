import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('codecoach_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function clearSession() {
  localStorage.removeItem('codecoach_token');
  localStorage.removeItem('codecoach_refresh_token');
  localStorage.removeItem('codecoach_email');
}

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('codecoach_refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken })
      .then((res) => {
        localStorage.setItem('codecoach_token', res.data.access_token);
        localStorage.setItem('codecoach_refresh_token', res.data.refresh_token);
        return res.data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');

    if (
      error.response &&
      error.response.status === 401 &&
      !isAuthEndpoint &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    if (error.response && error.response.status === 401 && isAuthEndpoint) {
      clearSession();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export const signup = (email, password) =>
  api.post('/auth/signup', { email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const logout = (refreshToken) =>
  api.post('/auth/logout', { refresh_token: refreshToken });

export const sendMessage = (conversationId, content, isCode) =>
  api.post('/chat', {
    conversation_id: conversationId,
    content,
    is_code: isCode,
  });

export const getConversations = ({ limit = 20, offset = 0 } = {}) =>
  api.get('/conversations', { params: { limit, offset } });

export const getMessages = (conversationId) =>
  api.get(`/conversations/${conversationId}/messages`);

export const getStreak = () => api.get('/progress/streak');

export const getStats = () => api.get('/progress/stats');

export default api;
