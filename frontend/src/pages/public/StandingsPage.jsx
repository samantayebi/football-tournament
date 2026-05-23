import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import { useTournament } from '../../context/TournamentContext';

export default function StandingsPage() {
  const { selectedId } = useTournament();
  const [standings, setStandings] = useState([]);
  const [error, setError]         = useState('');
  const [live, setLive]           = useState(false);

  const fetchStandings = useCallback(() => {
    if (!selectedId) return;
    api.get(`/api/v1/public/standings?tournament_id=${selectedId}`)
      .then(r => setStandings(r.data))
      .catch(() => setError('Failed to load standings'));
  }, [selectedId]);

  useEffect(() => { fetchStandings(); }, [fetchStandings]);

  useEffect(() => {
    const es = new EventSource('/api/v1/public/events');
    es.onopen    = () => setLive(true);
    es.onerror   = () => setLive(false);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'match.completed') fetchStandings();
    };
    return () => es.close();
  }, [fetchStandings]);

  return (
    <div className="page">
      <h1>Standings {live && <span className="live-badge">LIVE</span>}</h1>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>W</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>Round</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr key={s.team_id}>
              <td>{i + 1}</td>
              <td>{s.team_name}</td>
              <td>{s.wins}</td>
              <td>{s.losses}</td>
              <td>{s.goals_scored}</td>
              <td>{s.goals_conceded}</td>
              <td>{s.current_round || '—'}</td>
            </tr>
          ))}
          {standings.length === 0 && !error && (
            <tr><td colSpan={7}>No data available.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
