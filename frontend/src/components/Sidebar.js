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
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>CodeCoach</span>
        </div>
        <p style={styles.tagline}>AI-powered DSA reviews</p>
      </div>

      <button style={styles.newChatBtn} onClick={onNewChat}>
        <span style={styles.newChatIcon}>+</span>
        New Chat
      </button>

      <div style={styles.sectionLabel}>Recent Chats</div>

      <div style={styles.conversationList}>
        {conversations.length === 0 && (
          <p style={styles.emptyText}>No conversations yet</p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            style={{
              ...styles.conversationItem,
              ...(conv.id === activeConversationId ? styles.activeItem : {})
            }}
            onClick={() => onSelectConversation(conv.id)}
          >
            <span style={styles.convIcon}>💬</span>
            <span style={styles.convTitle}>{conv.title}</span>
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
    background: 'linear-gradient(180deg, #0d0d1a 0%, #0f0f23 100%)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 16px',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  logoIcon: {
    fontSize: '20px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.3px',
  },
  tagline: {
    fontSize: '11px',
    color: '#6b6b8a',
    letterSpacing: '0.3px',
  },
  newChatBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '24px',
    transition: 'opacity 0.2s',
    fontFamily: 'Inter, sans-serif',
  },
  newChatIcon: {
    fontSize: '16px',
    fontWeight: '400',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#6b6b8a',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    paddingLeft: '8px',
  },
  conversationList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  conversationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    fontSize: '13px',
    color: '#8888aa',
  },
  activeItem: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#a5b4fc',
  },
  convIcon: {
    fontSize: '13px',
    flexShrink: 0,
  },
  convTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyText: {
    fontSize: '12px',
    color: '#3a3a5a',
    paddingLeft: '10px',
    marginTop: '8px',
  }
};

export default Sidebar;