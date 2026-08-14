import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { sendMessage, getMessages } from '../api';

// Custom renderers so markdown output matches the app's dark/glass theme
// instead of falling back to default browser styles.
const markdownComponents = {
  p: ({ children }) => <p style={markdownStyles.p}>{children}</p>,
  strong: ({ children }) => <strong style={markdownStyles.strong}>{children}</strong>,
  em: ({ children }) => <em style={markdownStyles.em}>{children}</em>,
  ul: ({ children }) => <ul style={markdownStyles.list}>{children}</ul>,
  ol: ({ children }) => <ol style={markdownStyles.list}>{children}</ol>,
  li: ({ children }) => <li style={markdownStyles.listItem}>{children}</li>,
  code: ({ inline, children }) =>
    inline ? (
      <code style={markdownStyles.inlineCode}>{children}</code>
    ) : (
      <code style={markdownStyles.blockCode}>{children}</code>
    ),
  pre: ({ children }) => <pre style={markdownStyles.pre}>{children}</pre>,
  h1: ({ children }) => <h3 style={markdownStyles.heading}>{children}</h3>,
  h2: ({ children }) => <h3 style={markdownStyles.heading}>{children}</h3>,
  h3: ({ children }) => <h3 style={markdownStyles.heading}>{children}</h3>,
};

const markdownStyles = {
  p: { margin: '0 0 10px 0', lineHeight: '1.6' },
  strong: { color: '#e2e8f0', fontWeight: '700' },
  em: { color: '#cbd5e1' },
  list: { margin: '0 0 10px 0', paddingLeft: '20px' },
  listItem: { marginBottom: '4px', lineHeight: '1.6' },
  inlineCode: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '13px',
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#a5b4fc',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  blockCode: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '13px',
    color: '#a5b4fc',
  },
  pre: {
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '12px',
    overflowX: 'auto',
    margin: '8px 0',
  },
  heading: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#e2e8f0',
    margin: '4px 0 8px 0',
  },
};

function ChatWindow({ conversationId, onConversationCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isCode, setIsCode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState([]);
  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await getMessages(conversationId);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
      toast.error('Could not load this conversation. Try refreshing.');
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, analysisSteps]);

  const simulateAnalysisSteps = () => {
    const steps = [
      'Parsing syntax...',
      'Checking complexity...',
      'Detecting recursion...',
      'Generating feedback...',
    ];
    setAnalysisSteps([]);
    steps.forEach((step, i) => {
      setTimeout(() => {
        setAnalysisSteps((prev) => [...prev, step]);
      }, i * 600);
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    if (isCode) simulateAnalysisSteps();
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
      setAnalysisSteps([]);
    } catch (err) {
      console.error('Failed to send message', err);
      toast.error(
        err.response?.data?.detail || 'Failed to get feedback. Please try again.'
      );
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSend();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.messages}>
        {messages.length === 0 && !loading && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⚡</div>
            <h2 style={styles.emptyTitle}>Ready to review your code</h2>
            <p style={styles.emptySubtitle}>Paste your DSA solution and get instant AI-powered feedback</p>
            <div style={styles.hints}>
              <div style={styles.hint}> Complexity analysis</div>
              <div style={styles.hint}> Issue detection</div>
              <div style={styles.hint}> Improvement tips</div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.messageWrapper,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeSlideIn 0.3s ease'
            }}
          >
            {msg.role === 'assistant' && (
              <div style={styles.avatar}>AI</div>
            )}
            <div style={{
              ...styles.message,
              ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage)
            }}>
              {msg.role === 'user' ? (
                <pre style={styles.codeContent}>{msg.content}</pre>
              ) : (
                <div style={styles.textContent}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={styles.messageWrapper}>
            <div style={styles.avatar}>AI</div>
            <div style={{ ...styles.message, ...styles.assistantMessage }}>
              {analysisSteps.map((step, i) => (
                <div key={i} style={styles.analysisStep}>
                  <span style={styles.checkmark}>✓</span> {step}
                </div>
              ))}
              {analysisSteps.length < 4 && (
                <div style={styles.typingDots}>
                  <span>●</span><span>●</span><span>●</span>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputArea}>
        <div style={styles.inputContainer}>
          <textarea
            style={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your code here..."
            rows={4}
          />
          <div style={styles.inputFooter}>
            <label style={styles.toggle}>
              <div style={{
                ...styles.toggleSwitch,
                background: isCode ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#2a2a3a'
              }}
                onClick={() => setIsCode(!isCode)}
              >
                <div style={{
                  ...styles.toggleKnob,
                  transform: isCode ? 'translateX(16px)' : 'translateX(2px)'
                }} />
              </div>
              <span style={styles.toggleLabel}>Code mode</span>
            </label>
            <div style={styles.rightControls}>
              <span style={styles.hint2}>Ctrl+Enter to send</span>
              <button
                style={{
                  ...styles.sendBtn,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onClick={handleSend}
                disabled={loading}
              >
                {loading ? 'Analysing...' : 'Send ↑'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
      textarea::placeholder { color: #6b6b8a; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        .typing-dot:nth-child(1) { animation: blink 1s infinite 0s; }
        .typing-dot:nth-child(2) { animation: blink 1s infinite 0.2s; }
        .typing-dot:nth-child(3) { animation: blink 1s infinite 0.4s; }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0f0f1a',
    overflow: 'hidden',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '8px',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#4a4a6a',
    marginBottom: '24px',
    maxWidth: '340px',
    lineHeight: '1.6',
  },
  hints: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hint: {
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '12px',
    color: '#a5b4fc',
  },
  messageWrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '700',
    color: 'white',
    flexShrink: 0,
    marginTop: '4px',
  },
  message: {
    maxWidth: '75%',
    borderRadius: '12px',
    padding: '12px 16px',
    lineHeight: '1.6',
  },
  userMessage: {
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.25)',
    borderRadius: '12px 12px 2px 12px',
  },
  assistantMessage: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
    borderRadius: '2px 12px 12px 12px',
  },
  codeContent: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '13px',
    color: '#a5b4fc',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  textContent: {
    fontSize: '14px',
    color: '#cbd5e1',
  },
  analysisStep: {
    fontSize: '13px',
    color: '#6ee7b7',
    marginBottom: '4px',
    animation: 'fadeSlideIn 0.3s ease',
  },
  checkmark: {
    color: '#34d399',
    fontWeight: '700',
  },
  typingDots: {
    display: 'flex',
    gap: '4px',
    marginTop: '4px',
    fontSize: '8px',
    color: '#6366f1',
  },
  inputArea: {
    padding: '16px 24px 24px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  inputContainer: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    overflow: 'hidden',
    backdropFilter: 'blur(12px)',
  },
  textarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#e2e8f0','::placeholder': { color: '#6b6b8a' },
    fontSize: '13px',
    fontFamily: 'JetBrains Mono, monospace',
    padding: '16px',
    resize: 'none',
    lineHeight: '1.6',
  },
  inputFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  toggleSwitch: {
    width: '36px',
    height: '20px',
    borderRadius: '10px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  toggleKnob: {
    position: 'absolute',
    top: '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'white',
    transition: 'transform 0.2s',
  },
  toggleLabel: {
    fontSize: '12px',
    color: '#6b6b8a',
  },
  rightControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  hint2: {
    fontSize: '11px',
    color: '#3a3a5a',
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    transition: 'opacity 0.2s',
  },
};

export default ChatWindow;