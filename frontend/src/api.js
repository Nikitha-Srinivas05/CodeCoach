import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

export const sendMessage = (conversationId, content, isCode) =>
  axios.post(`${API_BASE}/chat`, {
    conversation_id: conversationId,
    content,
    is_code: isCode
  });

export const getConversations = () =>
  axios.get(`${API_BASE}/conversations`);

export const getMessages = (conversationId) =>
  axios.get(`${API_BASE}/conversations/${conversationId}/messages`);

export const getStreak = () =>
  axios.get(`${API_BASE}/progress/streak`);

export const getStats = () =>
  axios.get(`${API_BASE}/progress/stats`);