import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getStreak, getStats, getTopicsBreakdown, getIssuesBreakdown, getTrends } from '../api';

const formatLabel = (text) =>
  text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({ total_conversations: 0, total_submissions: 0 });
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [weeks, setWeeks] = useState([]);

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
      toast.error('Could not load your progress data.');
    }
    try {
      const [topicsRes, issuesRes, trendsRes] = await Promise.all([
        getTopicsBreakdown(),
        getIssuesBreakdown(),
        getTrends(8),
      ]);
      setTopics(topicsRes.data.breakdown);
      setIssueTypes(issuesRes.data.breakdown);
      setWeeks(trendsRes.data.weeks);
    } catch (err) {
      console.error('Failed to fetch pattern data', err);
      toast.error('Could not load your pattern insights.');
    }
    setLoading(false);
  };

  const topIssue = issueTypes[0];
  const mostPractised = topics[0]; // backend sorts by submissions, highest first
  const weakest = topics
    .filter((t) => t.submissions >= 2 && t.avg_issues > 0)
    .sort((a, b) => b.avg_issues - a.avg_issues)[0];

  const maxTopic = Math.max(1, ...topics.map((t) => t.submissions));
  const maxWeekly = Math.max(1, ...weeks.map((w) => w.submissions));

  const activeWeeks = weeks.filter((w) => w.submissions > 0);
  let trendMessage = null;
  if (activeWeeks.length >= 2) {
    const latest = activeWeeks[activeWeeks.length - 1];
    const earlier = activeWeeks.slice(0, -1);
    const earlierSubs = earlier.reduce((n, w) => n + w.submissions, 0);
    const earlierIssues = earlier.reduce((n, w) => n + w.issues, 0);
    const latestAvg = latest.issues / latest.submissions;
    const earlierAvg = earlierIssues / earlierSubs;
    if (latestAvg < earlierAvg) {
      trendMessage = 'Fewer issues per submission than your earlier weeks. Nice progress!';
    } else if (latestAvg > earlierAvg) {
      trendMessage = 'More issues per submission lately. Worth reviewing your recent feedback.';
    } else {
      trendMessage = 'Your issue rate is holding steady.';
    }
  }

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
          <div style={styles.patternsSection}>
            <h3 style={styles.sectionTitle}>Your Patterns</h3>
            {topics.length === 0 ? (
              <p style={styles.loading}>Submit some code to start seeing your patterns.</p>
            ) : (
              <>
                <div style={styles.insightRow}>
                  <div style={styles.insightCard}>
                    <div style={styles.insightLabel}>Most common issue</div>
                    <div style={styles.insightValue}>
                      {topIssue ? formatLabel(topIssue.type) : 'None yet'}
                    </div>
                    {topIssue && (
                      <div style={styles.insightSub}>{topIssue.count} times</div>
                    )}
                  </div>
                  <div style={styles.insightCard}>
                    <div style={styles.insightLabel}>Weakest topic</div>
                    <div style={styles.insightValue}>
                      {weakest ? weakest.topic : 'Not enough data yet'}
                    </div>
                    <div style={styles.insightSub}>
                      {weakest
                        ? `${weakest.avg_issues} issues per submission`
                        : 'Needs 2+ submissions on a topic'}
                    </div>
                  </div>
                  <div style={styles.insightCard}>
                    <div style={styles.insightLabel}>Most practised</div>
                    <div style={styles.insightValue}>{mostPractised.topic}</div>
                    <div style={styles.insightSub}>{mostPractised.submissions} submissions</div>
                  </div>
                </div>

                <div style={styles.panel}>
                  <div style={styles.panelTitle}>Submissions by topic</div>
                  {topics.map((t) => (
                    <div key={t.topic} style={styles.barRow}>
                      <span style={styles.barLabel}>{t.topic}</span>
                      <div style={styles.barTrack}>
                        <div
                          style={{
                            ...styles.barFill,
                            width: `${(t.submissions / maxTopic) * 100}%`,
                          }}
                        />
                      </div>
                      <span style={styles.barValue}>
                        {t.submissions} · {t.avg_issues} avg issues
                      </span>
                    </div>
                  ))}
                </div>

                <div style={styles.panel}>
                  <div style={styles.panelTitle}>Weekly activity</div>
                  <div style={styles.weekChart}>
                    {weeks.map((w) => (
                      <div
                        key={w.week_start}
                        style={styles.weekCol}
                        title={`Week of ${w.week_start}: ${w.submissions} submissions, ${w.issues} issues`}
                      >
                        <div
                          style={{
                            ...styles.weekBar,
                            height: `${Math.max(
                              (w.submissions / maxWeekly) * 80,
                              w.submissions > 0 ? 8 : 2
                            )}px`,
                          }}
                        />
                        <span style={styles.weekLabel}>{w.week_start.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                  {trendMessage && <p style={styles.trendText}>{trendMessage}</p>}
                </div>
              </>
            )}
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
  patternsSection: {
    marginTop: '32px',
  },
  insightRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  insightCard: {
    flex: 1,
    minWidth: '180px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '20px',
  },
  insightLabel: {
    fontSize: '12px',
    color: '#6b6b8a',
  },
  insightValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#e2e8f0',
    marginTop: '6px',
  },
  insightSub: {
    fontSize: '12px',
    color: '#6b6b8a',
    marginTop: '4px',
  },
  panel: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '20px 24px',
    marginBottom: '16px',
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#9494b8',
    marginBottom: '16px',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
  },
  barLabel: {
    width: '120px',
    flexShrink: 0,
    fontSize: '13px',
    color: '#cbd5e1',
  },
  barTrack: {
    flex: 1,
    height: '8px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    borderRadius: '4px',
  },
  barValue: {
    minWidth: '110px',
    textAlign: 'right',
    fontSize: '12px',
    color: '#6b6b8a',
  },
  weekChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    height: '100px',
  },
  weekCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
  },
  weekBar: {
    width: '100%',
    maxWidth: '28px',
    background: 'linear-gradient(180deg, #8b5cf6, #6366f1)',
    borderRadius: '4px',
  },
  weekLabel: {
    fontSize: '10px',
    color: '#6b6b8a',
  },
  trendText: {
    fontSize: '13px',
    color: '#a5b4fc',
    marginTop: '12px',
  },
};

export default Dashboard;