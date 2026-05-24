import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';
import api from '../../api';

export default function ResultEntryPage() {
  const { token } = useAuth();
  const { selectedId } = useTournament();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [matches, setMatches]       = useState([]);
  const [scores, setScores]         = useState({});
  const [error, setError]           = useState('');
  const [allTeams, setAllTeams]     = useState([]);
  const [showGoalsFor, setShowGoalsFor] = useState(new Set());
  const [matchGoals, setMatchGoals] = useState({});
  const [goalForms, setGoalForms]   = useState({});

  const fetchMatches = useCallback(() => {
    if (!selectedId) return;
    api.get(`/api/v1/admin/bracket?tournament_id=${selectedId}`, { headers: authHeader })
       .then(r => setMatches(r.data))
       .catch(() => setError('Failed to load matches'));
  }, [selectedId, token]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  useEffect(() => {
    if (!selectedId) return;
    api.get(`/api/v1/admin/enrollment?tournament_id=${selectedId}`, { headers: authHeader })
       .then(r => setAllTeams(r.data))
       .catch(() => {});
  }, [selectedId, token]);

  function fetchGoalsForMatch(matchId) {
    api.get(`/api/v1/admin/matches/${matchId}/goals`, { headers: authHeader })
       .then(r => setMatchGoals(g => ({ ...g, [matchId]: r.data })))
       .catch(() => {});
  }

  function updateScore(matchId, field, value) {
    setScores(s => ({ ...s, [matchId]: { ...s[matchId], [field]: value } }));
  }

  function randomResult(matchId) {
    let s1 = Math.floor(Math.random() * 6);
    let s2 = Math.floor(Math.random() * 6);
    if (s1 === s2) s1 += 1;
    setScores(s => ({ ...s, [matchId]: { score_team1: s1, score_team2: s2 } }));
  }

  async function handleSubmit(matchId) {
    const { score_team1, score_team2 } = scores[matchId] || {};
    try {
      await api.patch(
        `/api/v1/admin/matches/${matchId}/result`,
        { score_team1: Number(score_team1), score_team2: Number(score_team2) },
        { headers: authHeader }
      );
      fetchMatches();
      setShowGoalsFor(s => new Set([...s, matchId]));
      fetchGoalsForMatch(matchId);
    } catch {
      setError('Failed to submit result');
    }
  }

  function toggleGoals(matchId) {
    setShowGoalsFor(s => {
      const next = new Set(s);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
        fetchGoalsForMatch(matchId);
      }
      return next;
    });
  }

  async function handleAddGoal(matchId) {
    const form = goalForms[matchId] || {};
    if (!form.player_id) return;
    try {
      await api.post(
        `/api/v1/admin/matches/${matchId}/goals`,
        {
          player_id: Number(form.player_id),
          team_id:   Number(form.team_id),
          minute:    form.minute ? Number(form.minute) : null,
        },
        { headers: authHeader }
      );
      fetchGoalsForMatch(matchId);
      setGoalForms(f => ({ ...f, [matchId]: { player_id: '', team_id: '', minute: '' } }));
    } catch {
      setError('Failed to add goal');
    }
  }

  return (
    <div className="page">
      <h1>Result Entry</h1>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Round</th>
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Score</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(match => (
            <tr key={match.id}>
              <td>{match.round}</td>
              <td>{match.team1_name || 'TBD'}</td>
              <td>{match.team2_name || 'TBD'}</td>
              <td>
                {match.status === 'completed' ? (
                  <strong>{match.score_team1} – {match.score_team2}</strong>
                ) : (
                  <div className="score-inputs">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={scores[match.id]?.score_team1 ?? ''}
                      onChange={e => updateScore(match.id, 'score_team1', e.target.value)}
                    />
                    <span>–</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={scores[match.id]?.score_team2 ?? ''}
                      onChange={e => updateScore(match.id, 'score_team2', e.target.value)}
                    />
                    <button type="button" className="btn-random" onClick={() => randomResult(match.id)}>🎲 Random</button>
                  </div>
                )}
              </td>
              <td>{match.status}</td>
              <td>
                <div className="actions">
                  {match.status !== 'completed' && match.team1_id && match.team2_id && (
                    <button className="sm" onClick={() => handleSubmit(match.id)}>Submit</button>
                  )}
                  {match.status === 'completed' && (
                    <button className="sm" onClick={() => toggleGoals(match.id)}>
                      {showGoalsFor.has(match.id) ? 'Hide Goals' : 'Add Goals'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {matches.length === 0 && !error && (
            <tr><td colSpan={6}>No matches found. Generate a bracket first.</td></tr>
          )}
        </tbody>
      </table>

      {[...showGoalsFor].map(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return null;
        const matchTeams = allTeams.filter(t => t.id === match.team1_id || t.id === match.team2_id);
        const players    = matchTeams.flatMap(t =>
          (t.players || []).map(p => ({ ...p, teamId: t.id, teamName: t.name }))
        );
        const form  = goalForms[matchId] || {};
        const goals = matchGoals[matchId] || [];

        return (
          <section key={matchId}>
            <h2>Goals — {match.team1_name} vs {match.team2_name}</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={form.player_id || ''}
                onChange={e => {
                  const player = players.find(p => p.id === Number(e.target.value));
                  setGoalForms(f => ({
                    ...f,
                    [matchId]: { ...f[matchId], player_id: e.target.value, team_id: player?.teamId || '' },
                  }));
                }}
                style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14 }}
              >
                <option value="">Select player…</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.teamName})</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                max="90"
                placeholder="Minute (optional)"
                value={form.minute || ''}
                onChange={e => setGoalForms(f => ({ ...f, [matchId]: { ...f[matchId], minute: e.target.value } }))}
                style={{ width: 150 }}
              />
              <button className="sm success" onClick={() => handleAddGoal(matchId)}>+ Add Goal</button>
            </div>

            {goals.length > 0 ? (
              <table style={{ marginTop: 12 }}>
                <thead>
                  <tr><th>Player</th><th>Team</th><th>Minute</th></tr>
                </thead>
                <tbody>
                  {goals.map(g => (
                    <tr key={g.id}>
                      <td>{g.player_name}</td>
                      <td>{g.team_name}</td>
                      <td>{g.minute ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 10 }}>No goals recorded yet.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
