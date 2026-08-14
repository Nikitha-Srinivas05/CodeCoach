import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(20, 20, 34, 0.95)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              backdropFilter: 'blur(12px)',
            },
            success: { iconTheme: { primary: '#34d399', secondary: '#0f0f1a' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#0f0f1a' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);