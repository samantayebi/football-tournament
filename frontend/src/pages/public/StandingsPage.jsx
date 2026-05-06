import { useEffect, useState } from 'react';
import api from '../../api';

export default function StandingsPage() {
  const [standings, setStandings] = useState([]);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get('/api/public/standings')
      .then(r => setStandings(r.data))
      .catch(() => setError('Failed to load standings'));
  }, []);

  return (
    <div className="page">
      <h1>Standings</h1>
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
