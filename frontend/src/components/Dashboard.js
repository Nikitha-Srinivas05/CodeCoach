import React, { useEffect, useState } from 'react';
import { getStreak, getStats } from '../api';

function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ total_conversations: 0, total_submissions: 0 });

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
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Your Progress</h2>
      <div style={styles.cards}>
        <div style={styles.card}>
          <div style={styles.cardValue}>🔥 {streak}</div>
          <div style={styles.cardLabel}>Day Streak</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardValue}>📝 {stats.total_submissions}</div>
          <div style={styles.cardLabel}>Total Submissions</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardValue}>💬 {stats.total_conversations}</div>
          <div style={styles.cardLabel}>Conversations</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '32px',
    color: 'white',
    flex: 1,
    backgroundColor: '#121212'
  },
  title: {
    fontSize: '24px',
    marginBottom: '24px',
    color: '#4CAF50'
  },
  cards: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '24px',
    minWidth: '150px',
    textAlign: 'center'
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  cardLabel: {
    fontSize: '14px',
    color: '#aaa'
  }
};

export default Dashboard;