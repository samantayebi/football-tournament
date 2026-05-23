import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';
import api from '../../api';

export default function ResultEntryPage() {
  const { token } = useAuth();
  const { selectedId } = useTournament();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [matches, setMatches] = useState([]);
  const [scores, setScores]   = useState({});
  const [error, setError]     = useState('');

  const fetchMatches = useCallback(() => {
    if (!selectedId) return;
    api.get(`/api/v1/admin/bracket?tournament_id=${selectedId}`, { headers: authHeader })
       .then(r => setMatches(r.data))
       .catch(() => setError('Failed to load matches'));
  }, [selectedId, token]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  function updateScore(matchId, field, value) {
    setScores(s => ({ ...s, [matchId]: { ...s[matchId], [field]: value } }));
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
    } catch {
      setError('Failed to submit result');
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
                      onChange={e => updateScore(match.id, 'score_team1', e.target.value)}
                    />
                    <span>–</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      onChange={e => updateScore(match.id, 'score_team2', e.target.value)}
                    />
                  </div>
                )}
              </td>
              <td>{match.status}</td>
              <td>
                {match.status !== 'completed' && match.team1_id && match.team2_id && (
                  <button className="sm" onClick={() => handleSubmit(match.id)}>
                    Submit
                  </button>
                )}
              </td>
            </tr>
          ))}
          {matches.length === 0 && !error && (
            <tr><td colSpan={6}>No matches found. Generate a bracket first.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
