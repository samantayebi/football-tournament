import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

function groupByRound(matches) {
  return matches.reduce((acc, match) => {
    const key = `round_${match.round}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});
}

export default function BracketAdminPage() {
  const { token } = useAuth();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [bracket, setBracket]           = useState({});
  const [scheduleForm, setScheduleForm] = useState({});
  const [error, setError]               = useState('');

  const fetchBracket = () =>
    api.get('/api/v1/admin/bracket', { headers: authHeader })
       .then(r => setBracket(groupByRound(r.data)))
       .catch(() => setError('Failed to load bracket'));

  useEffect(() => { fetchBracket(); }, []);

  async function handleGenerate() {
    setError('');
    try {
      await api.post('/api/v1/admin/bracket/generate', {}, { headers: authHeader });
      setScheduleForm({});
      fetchBracket();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate bracket');
    }
  }

  async function handleSchedule(matchId) {
    const form = scheduleForm[matchId] || {};
    try {
      await api.patch(`/api/v1/admin/matches/${matchId}/schedule`, form, { headers: authHeader });
      fetchBracket();
    } catch {
      setError('Failed to save schedule');
    }
  }

  function updateForm(matchId, field, value) {
    setScheduleForm(f => ({ ...f, [matchId]: { ...f[matchId], [field]: value } }));
  }

  const rounds = Object.keys(bracket).sort(
    (a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1])
  );

  return (
    <div className="page">
      <h1>Bracket Management</h1>
      {error && <p className="error">{error}</p>}
      <button onClick={handleGenerate}>Generate Bracket</button>

      {rounds.map(round => (
        <section key={round}>
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
              {match.venue     && <div className="venue">{match.venue}</div>}
              {match.match_date && <div className="date">{new Date(match.match_date).toLocaleString()}</div>}

              <div className="schedule-form">
                <input
                  type="datetime-local"
                  onChange={e => updateForm(match.id, 'match_date', e.target.value)}
                />
                <input
                  placeholder="Venue"
                  onChange={e => updateForm(match.id, 'venue', e.target.value)}
                />
                <button className="sm" onClick={() => handleSchedule(match.id)}>
                  Save Schedule
                </button>
              </div>
            </div>
          ))}
        </section>
      ))}

      {rounds.length === 0 && !error && (
        <p style={{ marginTop: 16 }}>No bracket yet. Click <strong>Generate Bracket</strong> to start.</p>
      )}
    </div>
  );
}
