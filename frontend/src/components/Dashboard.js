import React, { useEffect, useState } from 'react';
import { getStreak, getStats } from '../api';

function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ total_conversations: 0, total_submissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const streakRes = await getStreak();
      const statsRes = await getStats();
      setStreak(streakRes.data.current_streak);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    }
    setLoading(false);
  };

  const cards = [
    {
      icon: null,
      value: streak,
      label: 'Day Streak',
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.1)',
      border: 'rgba(249, 115, 22, 0.2)',
    },
    {
      icon: null,
      value: stats.total_submissions,
      label: 'Total Submissions',
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      border: 'rgba(99, 102, 241, 0.2)',
    },
    {
      icon: null,
      value: stats.total_conversations,
      label: 'Conversations',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.2)',
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Your Progress</h2>
        <p style={styles.subtitle}>Track your DSA practice journey</p>
      </div>

      {loading ? (
        <p style={styles.loading}>Loading...</p>
      ) : (
        <>
          <div style={styles.cards}>
            {cards.map((card, i) => (
              <div key={i} style={{
                ...styles.card,
                background: card.bg,
                border: `1px solid ${card.border}`,
              }}>
                <div style={styles.cardIcon}>{card.icon}</div>
                <div style={{ ...styles.cardValue, color: card.color }}>
                  {card.value}
                </div>
                <div style={styles.cardLabel}>{card.label}</div>
              </div>
            ))}
          </div>

          <div style={styles.streakSection}>
            <h3 style={styles.sectionTitle}>Streak Status</h3>
            <div style={styles.streakCard}>
              <div style={styles.streakInfo}>
                <div>
                  <div style={styles.streakNumber}>{streak} day{streak !== 1 ? 's' : ''}</div>
                  <div style={styles.streakDesc}>
                    {streak === 0
                      ? 'Submit code today to start your streak!'
                      : streak < 3
                      ? 'Great start! Keep going!'
                      : streak < 7
                      ? 'You\'re on a roll!'
                      : 'Incredible consistency! '}
                  </div>
                </div>
              </div>
              <div style={styles.streakBar}>
                <div style={{
                  ...styles.streakFill,
                  width: `${Math.min((streak / 7) * 100, 100)}%`
                }} />
              </div>
              <div style={styles.streakBarLabel}>Goal: 7 day streak</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    padding: '40px 32px',
    background: '#0f0f1a',
    overflowY: 'auto',
    color: '#e2e8f0',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#4a4a6a',
  },
  loading: {
    color: '#4a4a6a',
    fontSize: '14px',
  },
  cards: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '32px',
  },
  card: {
    borderRadius: '16px',
    padding: '24px',
    minWidth: '160px',
    flex: 1,
    backdropFilter: 'blur(12px)',
    animation: 'fadeSlideIn 0.4s ease',
  },
  cardIcon: {
    fontSize: '28px',
    marginBottom: '12px',
  },
  cardValue: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '4px',
    lineHeight: '1',
  },
  cardLabel: {
    fontSize: '13px',
    color: '#6b6b8a',
    marginTop: '4px',
  },
  streakSection: {
    marginTop: '8px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '16px',
  },
  streakCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
    backdropFilter: 'blur(12px)',
  },
  streakInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  streakFire: {
    fontSize: '40px',
  },
  streakNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#f97316',
    lineHeight: '1',
    marginBottom: '4px',
  },
  streakDesc: {
    fontSize: '13px',
    color: '#6b6b8a',
  },
  streakBar: {
    height: '6px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  streakFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #f97316, #fb923c)',
    borderRadius: '3px',
    transition: 'width 0.6s ease',
  },
  streakBarLabel: {
    fontSize: '11px',
    color: '#6b6b8a',
  },
};

export default Dashboard;