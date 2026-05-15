import { useEffect, useState } from 'react';
import api from '../../api';

export default function BracketPage() {
  const [bracket, setBracket] = useState({});
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/api/v1/public/bracket')
      .then(r => setBracket(r.data))
      .catch(() => setError('Failed to load bracket'));
  }, []);

  const rounds = Object.keys(bracket).sort(
    (a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1])
  );

  return (
    <div className="page">
      <h1>Tournament Bracket</h1>
      {error && <p className="error">{error}</p>}
      <div className="bracket">
        {rounds.map(round => (
          <div key={round} className="round">
            <h2>{round.replace('_', ' ').toUpperCase()}</h2>
            {bracket[round].map(match => (
              <div key={match.id} className="match-card">
                <div className={`team-row ${match.winner_id === match.team1_id && match.winner_id ? 'winner' : ''}`}>
                  {match.team1_name || 'TBD'}
                </div>
                <div className="vs">vs</div>
                <div className={`team-row ${match.winner_id === match.team2_id && match.winner_id ? 'winner' : ''}`}>
                  {match.team2_name || 'TBD'}
                </div>
                {match.score_team1 != null && (
                  <div className="score">{match.score_team1} – {match.score_team2}</div>
                )}
                {match.venue    && <div className="venue">{match.venue}</div>}
                {match.match_date && (
                  <div className="date">{new Date(match.match_date).toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
        ))}
        {rounds.length === 0 && !error && <p>No bracket generated yet.</p>}
      </div>
    </div>
  );
}
