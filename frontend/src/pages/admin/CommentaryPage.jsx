import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../api';
import { useTournament } from '../../context/TournamentContext';
import { useAuth } from '../../context/AuthContext';

const TYPE_EMOJIS = {
  goal:         '⚽',
  yellow_card:  '🟨',
  red_card:     '🟥',
  substitution: '🔄',
  info:         'ℹ️',
  comment:      '💬',
};

const TYPE_OPTIONS = Object.entries(TYPE_EMOJIS).map(([value, emoji]) => ({
  value,
  label: `${emoji} ${value.replace('_', ' ')}`,
}));

const EMPTY_FORM = { minute: '', type: 'comment', text: '' };

export default function CommentaryPage() {
  const { selectedId } = useTournament();
  const { token }      = useAuth();
  const authHeader     = { Authorization: `Bearer ${token}` };
  const [matches, setMatches]           = useState([]);
  const [commentaries, setCommentaries] = useState({});
  const [forms, setForms]               = useState({});
  const [error, setError]               = useState('');
  const intervalRef = useRef(null);

  const fetchMatches = useCallback(() => {
    if (!selectedId) return;
    api.get(`/api/v1/admin/bracket?tournament_id=${selectedId}`, { headers: authHeader })
      .then(r => {
        const flat = Object.values(r.data).flat();
        setMatches(flat);
        flat.forEach(m => {
          setForms(f => ({ ...f, [m.id]: f[m.id] ?? { ...EMPTY_FORM } }));
        });
      })
      .catch(() => setError('Failed to load matches'));
  }, [selectedId, token]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const fetchAll = (matchList) => {
    matchList.forEach(m => {
      api.get(`/api/v1/public/matches/${m.id}/commentary`)
        .then(r => setCommentaries(c => ({ ...c, [m.id]: r.data })))
        .catch(() => {});
    });
  };

  useEffect(() => {
    if (!matches.length) return;
    fetchAll(matches);
    intervalRef.current = setInterval(() => fetchAll(matches), 10000);
    return () => clearInterval(intervalRef.current);
  }, [matches]);

  function setForm(matchId, field, value) {
    setForms(f => ({ ...f, [matchId]: { ...f[matchId], [field]: value } }));
  }

  async function handleSubmit(e, matchId) {
    e.preventDefault();
    const { minute, type, text } = forms[matchId] || EMPTY_FORM;
    if (!text.trim()) return;
    try {
      await api.post(`/api/v1/admin/matches/${matchId}/commentary`, {
        minute: minute !== '' ? Number(minute) : null,
        type,
        text: text.trim(),
      }, { headers: authHeader });
      setForms(f => ({ ...f, [matchId]: { ...EMPTY_FORM } }));
      const r = await api.get(`/api/v1/public/matches/${matchId}/commentary`);
      setCommentaries(c => ({ ...c, [matchId]: r.data }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add comment');
    }
  }

  if (!selectedId) {
    return <div className="page"><p>Select a tournament first.</p></div>;
  }

  return (
    <div className="page">
      <h1>Match Commentary</h1>
      {error && <p className="error">{error}</p>}
      {matches.length === 0 && <p>No matches found. Generate a bracket first.</p>}
      {matches.map(m => {
        const form = forms[m.id] || EMPTY_FORM;
        const feed = commentaries[m.id] || [];
        const t1 = m.team1_name || 'TBD';
        const t2 = m.team2_name || 'TBD';
        const score = m.score_team1 != null
          ? `${m.score_team1}–${m.score_team2}`
          : 'vs';
        return (
          <div key={m.id} className="report-card" style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 8, fontSize: 17 }}>
              {t1} {score} {t2}
              {m.winner_id && <span style={{ marginLeft: 8, fontSize: 12, color: '#27ae60', fontWeight: 700 }}>FT</span>}
            </h2>

            <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              {feed.length === 0
                ? <p style={{ color: '#888', fontSize: 13 }}>No commentary yet.</p>
                : feed.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, alignItems: 'flex-start' }}>
                    <span style={{ minWidth: 32, color: '#888', textAlign: 'right' }}>
                      {c.minute != null ? `${c.minute}'` : '—'}
                    </span>
                    <span style={{ fontSize: 16 }}>{TYPE_EMOJIS[c.type] || '💬'}</span>
                    <span>{c.text}</span>
                  </div>
                ))
              }
            </div>

            <form onSubmit={e => handleSubmit(e, m.id)} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="number"
                min={1}
                max={120}
                placeholder="Min"
                value={form.minute}
                onChange={e => setForm(m.id, 'minute', e.target.value)}
                style={{ width: 64 }}
              />
              <select
                value={form.type}
                onChange={e => setForm(m.id, 'type', e.target.value)}
              >
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Commentary text…"
                value={form.text}
                onChange={e => setForm(m.id, 'text', e.target.value)}
                style={{ flex: 1, minWidth: 160 }}
                required
              />
              <button type="submit" className="btn-primary">Add</button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
