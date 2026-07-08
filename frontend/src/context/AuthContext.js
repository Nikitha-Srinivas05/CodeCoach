import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as loginRequest, signup as signupRequest } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('codecoach_token'));
  const [email, setEmail] = useState(() => localStorage.getItem('codecoach_email'));

  const login = useCallback(async (emailInput, password) => {
    const response = await loginRequest(emailInput, password);
    const { access_token, email: userEmail } = response.data;
    localStorage.setItem('codecoach_token', access_token);
    localStorage.setItem('codecoach_email', userEmail);
    setToken(access_token);
    setEmail(userEmail);
  }, []);

  const signup = useCallback(async (emailInput, password) => {
    const response = await signupRequest(emailInput, password);
    const { access_token, email: userEmail } = response.data;
    localStorage.setItem('codecoach_token', access_token);
    localStorage.setItem('codecoach_email', userEmail);
    setToken(access_token);
    setEmail(userEmail);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('codecoach_token');
    localStorage.removeItem('codecoach_email');
    setToken(null);
    setEmail(null);
  }, []);

  const value = {
    token,
    email,
    isAuthenticated: !!token,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
