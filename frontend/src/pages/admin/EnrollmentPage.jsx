import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';
import api from '../../api';

const CLUB_NAMES = [
  'FC Thunder', 'Athletic Eagles', 'Real Lions', 'Sporting Wolves',
  'United Bears', 'City Panthers', 'Racing Tigers', 'Dynamic Hawks',
  'Premier Bulls', 'Elite Falcons', 'Royal Sharks', 'Classic Foxes',
  'Victory Vipers', 'Champion Cobras', 'Golden Stallions', 'Iron Phoenix',
  'Storm United', 'Blaze FC', 'Titan Rangers', 'Apex Rovers',
];

const PLAYER_NAMES = [
  'Marco Rossi', 'Luca Ferrari', 'Giovanni Russo', 'Antonio Esposito',
  'Francesco Romano', 'Alessandro Colombo', 'Stefano Ricci', 'Andrea Marino',
  'Roberto Greco', 'Davide Bruno', 'Matteo Gallo', 'Lorenzo Conti',
  'Simone Mancini', 'Daniele Costa', 'Fabio Giordano', 'Emanuele Rizzo',
  'Cristiano Villa', 'Massimo Serra', 'Claudio Fontana', 'Giorgio Barbieri',
];

export default function EnrollmentPage() {
  const { token } = useAuth();
  const { selectedId, selectedTournament } = useTournament();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [teams, setTeams]   = useState([]);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({ name: '', contact_email: '', players: '' });

  const fetchTeams = useCallback(() => {
    if (!selectedId) return;
    api.get(`/api/v1/admin/enrollment?tournament_id=${selectedId}`, { headers: authHeader })
       .then(r => setTeams(r.data))
       .catch(() => setError('Failed to load teams'));
  }, [selectedId, token]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  async function handleStatusChange(id, status) {
    await api.patch(`/api/v1/admin/enrollment/${id}`, { status }, { headers: authHeader });
    fetchTeams();
  }

  function randomName() {
    setForm(f => ({ ...f, name: CLUB_NAMES[Math.floor(Math.random() * CLUB_NAMES.length)] }));
  }

  function randomPlayers() {
    const shuffled = [...PLAYER_NAMES].sort(() => Math.random() - 0.5);
    setForm(f => ({ ...f, players: shuffled.slice(0, 5).join('\n') }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const players = form.players
      .split(/[\n,]/)
      .map((name, i) => ({ name: name.trim(), shirt_number: i + 1 }))
      .filter(p => p.name);
    try {
      await api.post(
        '/api/v1/admin/enrollment',
        { tournament_id: selectedId, name: form.name, contact_email: form.contact_email, players },
        { headers: authHeader }
      );
      setForm({ name: '', contact_email: '', players: '' });
      fetchTeams();
    } catch {
      setError('Failed to create team.');
    }
  }

  return (
    <div className="page">
      <h1>Team Enrollment{selectedTournament ? ` — ${selectedTournament.name}` : ''}</h1>

      <section>
        <h2>Add Team</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              placeholder="Team name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <button type="button" className="btn-random" onClick={randomName}>🎲 Random</button>
          </div>
          <input
            type="email"
            placeholder="Contact email"
            value={form.contact_email}
            onChange={e => setForm({ ...form, contact_email: e.target.value })}
          />
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <textarea
              placeholder="Players — one per line or comma-separated"
              value={form.players}
              onChange={e => setForm({ ...form, players: e.target.value })}
              rows={5}
              style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', resize: 'vertical' }}
            />
            <button type="button" className="btn-random" onClick={randomPlayers}>🎲 Random Players</button>
          </div>
          <button type="submit">Submit Enrollment</button>
        </form>
      </section>

      <section>
        <h2>Enrollment Requests</h2>
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Email</th>
              <th>Players</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id}>
                <td>{team.name}</td>
                <td>{team.contact_email}</td>
                <td>{team.players?.length ?? 0}</td>
                <td>{team.status}</td>
                <td>
                  <div className="actions">
                    {team.status === 'pending' && (
                      <>
                        <button className="success sm" onClick={() => handleStatusChange(team.id, 'approved')}>
                          Approve
                        </button>
                        <button className="danger sm" onClick={() => handleStatusChange(team.id, 'rejected')}>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr><td colSpan={5}>No enrollment requests yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
