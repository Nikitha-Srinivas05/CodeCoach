import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Dashboard from './components/Dashboard';

function App() {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [view, setView] = useState('chat');

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
                ...(view === 'chat' ? styles.activeTab : {})
              }}
              onClick={() => setView('chat')}
            >
              Chat
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(view === 'dashboard' ? styles.activeTab : {})
              }}
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </button>
          </div>
          <div style={styles.topBarRight}>
            <div style={styles.statusDot} />
            <span style={styles.statusText}>API Connected</span>
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
    gap: '6px',
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
};

export default App;