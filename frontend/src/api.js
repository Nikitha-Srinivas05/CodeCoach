import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach the logged-in user's token to every outgoing request automatically,
// so individual components never have to think about auth headers.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('codecoach_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('codecoach_token');
      localStorage.removeItem('codecoach_email');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const signup = (email, password) =>
  api.post('/auth/signup', { email, password });

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const sendMessage = (conversationId, content, isCode) =>
  api.post('/chat', {
    conversation_id: conversationId,
    content,
    is_code: isCode,
  });

export const getConversations = () => api.get('/conversations');

export const getMessages = (conversationId) =>
  api.get(`/conversations/${conversationId}/messages`);

export const getStreak = () => api.get('/progress/streak');

export const getStats = () => api.get('/progress/stats');

export default api;
