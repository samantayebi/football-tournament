import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

function computeStats(bracket) {
  const all = Object.values(bracket).flat();
  const teams = new Set();
  for (const m of all) {
    if (m.team1_id) teams.add(m.team1_id);
    if (m.team2_id) teams.add(m.team2_id);
  }
  const completed = all.filter(m => m.status === 'completed');
  const goalsScored = completed.reduce(
    (sum, m) => sum + (m.score_team1 || 0) + (m.score_team2 || 0), 0
  );
  const currentRound = completed.length
    ? Math.max(...completed.map(m => m.round))
    : 0;
  return { totalTeams: teams.size, matchesPlayed: completed.length, goalsScored, currentRound };
}

function computeStatus(bracket) {
  const all = Object.values(bracket).flat();
  if (!all.length) return 'ENROLLMENT';
  return all.every(m => m.status === 'completed') ? 'COMPLETED' : 'IN PROGRESS';
}

function getRecentResults(bracket) {
  return Object.values(bracket)
    .flat()
    .filter(m => m.status === 'completed')
    .sort((a, b) => b.round - a.round || b.id - a.id)
    .slice(0, 3);
}

const STATUS_CLASS = {
  'ENROLLMENT':  'status-enrollment',
  'IN PROGRESS': 'status-progress',
  'COMPLETED':   'status-completed',
};

export default function LandingPage() {
  const [bracket, setBracket]     = useState({});
  const [live, setLive]           = useState(false);

  const fetchAll = useCallback(() => {
    api.get('/api/v1/public/bracket').then(r => setBracket(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const es = new EventSource('/api/v1/public/events');
    es.onopen    = () => setLive(true);
    es.onerror   = () => setLive(false);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'match.completed') fetchAll();
    };
    return () => es.close();
  }, [fetchAll]);

  const stats   = computeStats(bracket);
  const status  = computeStatus(bracket);
  const recent  = getRecentResults(bracket);

  return (
    <div>
      <div className="hero">
        <h1 className="hero-title">
          Football Tournament 2026
          {live && <span className="live-badge">LIVE</span>}
        </h1>
        <p className="hero-sub">Single-elimination tournament</p>
        <div>
          <span className={`status-badge ${STATUS_CLASS[status]}`}>{status}</span>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <p className="stat-number">{stats.totalTeams}</p>
            <p className="stat-label">Total Teams</p>
          </div>
          <div className="stat-card">
            <p className="stat-number">{stats.matchesPlayed}</p>
            <p className="stat-label">Matches Played</p>
          </div>
          <div className="stat-card">
            <p className="stat-number">{stats.goalsScored}</p>
            <p className="stat-label">Goals Scored</p>
          </div>
          <div className="stat-card">
            <p className="stat-number">{stats.currentRound || '—'}</p>
            <p className="stat-label">Current Round</p>
          </div>
        </div>

        <div className="hero-actions">
          <Link to="/bracket"   className="btn-primary">View Bracket</Link>
          <Link to="/standings" className="btn-secondary">View Standings</Link>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="page recent-results">
          <h2>Recent Results</h2>
          {recent.map(m => (
            <div key={m.id} className="result-row">
              <div>
                <div className="result-teams">{m.team1_name} vs {m.team2_name}</div>
                <div className="result-round">Round {m.round}</div>
              </div>
              <div className="result-score">{m.score_team1} – {m.score_team2}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
