import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Dashboard from './components/Dashboard';

function App() {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [view, setView] = useState('chat'); // 'chat' or 'dashboard'

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
          <button
            style={{
              ...styles.tabBtn,
              borderBottom: view === 'chat' ? '2px solid #4CAF50' : 'none'
            }}
            onClick={() => setView('chat')}
          >
            Chat
          </button>
          <button
            style={{
              ...styles.tabBtn,
              borderBottom: view === 'dashboard' ? '2px solid #4CAF50' : 'none'
            }}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
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
    backgroundColor: '#121212',
    fontFamily: 'sans-serif'
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  topBar: {
    display: 'flex',
    gap: '16px',
    padding: '12px 24px',
    borderBottom: '1px solid #2a2a2a',
    backgroundColor: '#1a1a1a'
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    paddingBottom: '4px'
  }
};

export default App;