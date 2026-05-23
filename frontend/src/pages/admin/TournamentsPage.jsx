import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';
import api from '../../api';

export default function TournamentsPage() {
  const { token } = useAuth();
  const { setSelectedId } = useTournament();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [tournaments, setTournaments] = useState([]);
  const [form, setForm]   = useState({ name: '' });
  const [error, setError] = useState('');

  const fetchTournaments = () =>
    api.get('/api/v1/public/tournaments')
       .then(r => setTournaments(r.data))
       .catch(() => setError('Failed to load tournaments'));

  useEffect(() => { fetchTournaments(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post(
        '/api/v1/admin/tournaments',
        { name: form.name, format: 'single-elimination' },
        { headers: authHeader }
      );
      setForm({ name: '' });
      await fetchTournaments();
      setSelectedId(data.id);
    } catch {
      setError('Failed to create tournament.');
    }
  }

  return (
    <div className="page">
      <h1>Tournaments</h1>

      <section>
        <h2>Create Tournament</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Tournament name"
            value={form.name}
            onChange={e => setForm({ name: e.target.value })}
            required
          />
          <button type="submit">Create Tournament</button>
        </form>
      </section>

      <section>
        <h2>All Tournaments</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Format</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.name}</td>
                <td>{t.format}</td>
                <td>{t.status}</td>
              </tr>
            ))}
            {tournaments.length === 0 && !error && (
              <tr><td colSpan={4}>No tournaments yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
