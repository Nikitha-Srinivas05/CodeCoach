import React, { useEffect, useState } from 'react';
import { getConversations } from '../api';

function Sidebar({ activeConversationId, onSelectConversation, onNewChat }) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  return (
    <div style={styles.sidebar}>
      <h2 style={styles.title}>CodeCoach</h2>
      <button style={styles.newChatBtn} onClick={onNewChat}>
        + New Chat
      </button>
      <div style={styles.conversationList}>
        {conversations.map((conv) => (
          <div
            key={conv.id}
            style={{
              ...styles.conversationItem,
              backgroundColor: conv.id === activeConversationId ? '#2a2a2a' : 'transparent'
            }}
            onClick={() => onSelectConversation(conv.id)}
          >
            💬 {conv.title}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    height: '100vh',
    backgroundColor: '#1a1a1a',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    boxSizing: 'border-box'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#4CAF50'
  },
  newChatBtn: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    cursor: 'pointer',
    marginBottom: '16px',
    fontSize: '14px'
  },
  conversationList: {
    overflowY: 'auto',
    flex: 1
  },
  conversationItem: {
    padding: '10px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '4px',
    fontSize: '14px'
  }
};

export default Sidebar;