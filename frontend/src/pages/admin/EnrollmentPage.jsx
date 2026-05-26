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

  const [teams, setTeams]           = useState([]);
  const [error, setError]           = useState('');
  const [form, setForm]             = useState({ name: '', contact_email: '', players: '' });
  const [seedInputs, setSeedInputs] = useState({});

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

  async function handleSetSeed(teamId) {
    const seed = seedInputs[teamId];
    try {
      await api.patch(
        `/api/v1/admin/enrollment/${teamId}/seed`,
        { seed: seed !== '' && seed != null ? Number(seed) : null },
        { headers: authHeader }
      );
      setSeedInputs(s => ({ ...s, [teamId]: '' }));
      fetchTeams();
    } catch {
      setError('Failed to set seed');
    }
  }

  async function handleClearAllSeeds() {
    const approved = teams.filter(t => t.status === 'approved' && t.seed != null);
    try {
      await Promise.all(
        approved.map(t =>
          api.patch(`/api/v1/admin/enrollment/${t.id}/seed`, { seed: null }, { headers: authHeader })
        )
      );
      fetchTeams();
    } catch {
      setError('Failed to clear seeds');
    }
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

  const approvedCount = teams.filter(t => t.status === 'approved').length;
  const hasAnySeeds   = teams.some(t => t.seed != null);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ margin: 0 }}>Enrollment Requests</h2>
          {hasAnySeeds && (
            <button className="sm danger" onClick={handleClearAllSeeds}>Clear All Seeds</button>
          )}
        </div>
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
                <td>
                  {team.seed != null && (
                    <strong style={{ color: '#4a9eff', marginRight: 5 }}>#{team.seed}</strong>
                  )}
                  {team.name}
                </td>
                <td>{team.contact_email}</td>
                <td>{team.players?.length ?? 0}</td>
                <td>{team.status}</td>
                <td>
                  <div className="actions" style={{ flexWrap: 'wrap' }}>
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
                    {team.status === 'approved' && (
                      <>
                        <input
                          type="number"
                          min="1"
                          max={approvedCount}
                          placeholder="Seed"
                          value={seedInputs[team.id] ?? ''}
                          onChange={e => setSeedInputs(s => ({ ...s, [team.id]: e.target.value }))}
                          style={{ width: 64, padding: '4px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                        />
                        <button className="sm" onClick={() => handleSetSeed(team.id)}>
                          Set Seed
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
