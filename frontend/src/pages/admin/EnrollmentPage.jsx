import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function EnrollmentPage() {
  const { token } = useAuth();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [teams, setTeams]   = useState([]);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState({ name: '', contact_email: '', players: '' });

  const fetchTeams = () =>
    api.get('/api/v1/admin/enrollment', { headers: authHeader })
       .then(r => setTeams(r.data))
       .catch(() => setError('Failed to load teams'));

  useEffect(() => { fetchTeams(); }, []);

  async function handleStatusChange(id, status) {
    await api.patch(`/api/v1/admin/enrollment/${id}`, { status }, { headers: authHeader });
    fetchTeams();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const players = form.players
      .split(',')
      .map((name, i) => ({ name: name.trim(), shirt_number: i + 1 }))
      .filter(p => p.name);
    try {
      await api.post('/api/v1/admin/enrollment',
        { name: form.name, contact_email: form.contact_email, players },
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
      <h1>Team Enrollment</h1>

      <section>
        <h2>Add Team</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Team name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Contact email"
            value={form.contact_email}
            onChange={e => setForm({ ...form, contact_email: e.target.value })}
          />
          <input
            placeholder="Players — comma-separated names"
            value={form.players}
            onChange={e => setForm({ ...form, players: e.target.value })}
          />
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
