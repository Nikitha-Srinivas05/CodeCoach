import React, { useEffect, useState, useRef } from 'react';
import { sendMessage, getMessages } from '../api';

function ChatWindow({ conversationId, onConversationCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isCode, setIsCode] = useState(true);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await getMessages(conversationId);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await sendMessage(conversationId, input, isCode);
      const data = res.data;
      if (!conversationId) {
        onConversationCreated(data.conversation_id);
      }
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: input },
        { role: 'assistant', content: data.response }
      ]);
      setInput('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.placeholder}>
            Paste your DSA code and get instant feedback!
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.role === 'user' ? '#4CAF50' : '#2a2a2a',
            }}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div style={{ ...styles.message, backgroundColor: '#2a2a2a', alignSelf: 'flex-start' }}>
            Analysing your code...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={styles.inputArea}>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={isCode}
            onChange={(e) => setIsCode(e.target.checked)}
          />
          &nbsp;This is code
        </label>
        <textarea
          style={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your code or ask a question..."
          rows={4}
        />
        <button
          style={styles.sendBtn}
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? 'Analysing...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#121212',
    color: 'white'
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  placeholder: {
    color: '#666',
    textAlign: 'center',
    marginTop: '40px',
    fontSize: '16px'
  },
  message: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.5'
  },
  inputArea: {
    padding: '16px',
    borderTop: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  toggle: {
    color: '#aaa',
    fontSize: '13px',
    cursor: 'pointer'
  },
  textarea: {
    backgroundColor: '#1e1e1e',
    color: 'white',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'monospace'
  },
  sendBtn: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default ChatWindow;