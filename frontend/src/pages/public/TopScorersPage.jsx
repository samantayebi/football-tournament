import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { useTournament } from '../../context/TournamentContext';

const MEDALS = { 1: '🏆', 2: '🥈', 3: '🥉' };

export default function TopScorersPage() {
  const { selectedId, selectedTournament } = useTournament();
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchScorers = useCallback(() => {
    if (!selectedId) return;
    setLoading(true);
    api.get(`/api/v1/public/top-scorers?tournament_id=${selectedId}`)
      .then(r => { setScorers(r.data); setLoading(false); })
      .catch(() => { setError('Failed to load top scorers'); setLoading(false); });
  }, [selectedId]);

  useEffect(() => { fetchScorers(); }, [fetchScorers]);

  if (loading || !selectedId) return <div className="page"><p>Loading…</p></div>;

  return (
    <div className="page">
      <h1>Top Scorers{selectedTournament ? ` — ${selectedTournament.name}` : ''}</h1>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Team</th>
            <th>Goals</th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((s, i) => (
            <tr key={s.player_id}>
              <td>{MEDALS[i + 1] ?? i + 1}</td>
              <td>{s.player_name}</td>
              <td>{s.team_name}</td>
              <td><strong>{s.goals}</strong></td>
            </tr>
          ))}
          {scorers.length === 0 && !error && (
            <tr><td colSpan={4}>No goals recorded yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
