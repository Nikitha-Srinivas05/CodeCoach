import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>CodeCoach</div>
        <p style={styles.tagline}>Welcome back — log in to continue</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{' '}
          <Link to="/signup" style={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0f1a',
    fontFamily: 'Inter, sans-serif',
  },
  card: {
    width: '360px',
    padding: '32px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '4px',
  },
  tagline: {
    fontSize: '13px',
    color: '#6b6b8a',
    marginBottom: '28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '12px',
    color: '#9494b8',
    marginBottom: '6px',
    marginTop: '14px',
  },
  input: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '10px 12px',
    color: '#e5e5f0',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
  },
  error: {
    marginTop: '14px',
    fontSize: '13px',
    color: '#f87171',
    background: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  submitBtn: {
    marginTop: '24px',
    padding: '11px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  footerText: {
    marginTop: '20px',
    fontSize: '13px',
    color: '#6b6b8a',
    textAlign: 'center',
  },
  link: {
    color: '#a5b4fc',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Login;
