import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function MainApp() {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [view, setView] = useState('chat');
  const { email, logout } = useAuth();

  const handleNewChat = () => {
    setActiveConversationId(null);
    setView('chat');
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setView('chat');
  };

  const handleConversationCreated = (id) => {
    setActiveConversationId(id);
  };

  return (
    <div style={styles.app}>
      <Sidebar
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
      />
      <div style={styles.main}>
        <div style={styles.topBar}>
          <div style={styles.tabGroup}>
            <button
              style={{
                ...styles.tabBtn,
                ...(view === 'chat' ? styles.activeTab : {}),
              }}
              onClick={() => setView('chat')}
            >
              Chat
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(view === 'dashboard' ? styles.activeTab : {}),
              }}
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </button>
          </div>
          <div style={styles.topBarRight}>
            <div style={styles.statusDot} />
            <span style={styles.statusText}>API Connected</span>
            <span style={styles.divider} />
            <span style={styles.emailText}>{email}</span>
            <button style={styles.logoutBtn} onClick={logout}>
              Log out
            </button>
          </div>
        </div>
        {view === 'chat' ? (
          <ChatWindow
            conversationId={activeConversationId}
            onConversationCreated={handleConversationCreated}
          />
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    background: '#0f0f1a',
    fontFamily: 'Inter, sans-serif',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(12px)',
  },
  tabGroup: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '3px',
  },
  tabBtn: {
    background: 'transparent',
    border: 'none',
    color: '#6b6b8a',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '6px 14px',
    borderRadius: '8px',
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.15s',
  },
  activeTab: {
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#a5b4fc',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#34d399',
  },
  statusText: {
    fontSize: '11px',
    color: '#3a3a5a',
  },
  divider: {
    width: '1px',
    height: '14px',
    background: 'rgba(255,255,255,0.08)',
    margin: '0 4px',
  },
  emailText: {
    fontSize: '12px',
    color: '#9494b8',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '5px 10px',
    color: '#a5b4fc',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
};

export default App;
