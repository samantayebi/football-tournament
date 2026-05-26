import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useTournament } from '../../context/TournamentContext';

const STATUS_INFO = {
  completed:   { label: 'COMPLETED',   cls: 'status-completed'  },
  in_progress: { label: 'IN PROGRESS', cls: 'status-progress'   },
  enrollment:  { label: 'ENROLLMENT',  cls: 'status-enrollment' },
};

function statusPriority(s) {
  if (s === 'completed')   return 0;
  if (s === 'in_progress') return 1;
  return 2;
}

function StatCell({ value, label, suffix }) {
  return (
    <div>
      <span style={{ fontSize: 22, fontWeight: 700 }}>{value}</span>
      {suffix && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{suffix}</span>}
      <br />
      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  );
}

export default function HistoryPage() {
  const navigate              = useNavigate();
  const { setSelectedId }     = useTournament();
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats]     = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/public/tournaments').then(r => {
      const list = r.data;
      setTournaments(list);
      setLoading(false);
      Promise.all(
        list.map(t =>
          api.get(`/api/v1/public/tournament-stats/${t.id}`)
            .then(r => [t.id, r.data])
            .catch(() => [t.id, null])
        )
      ).then(results => setStats(Object.fromEntries(results)));
    }).catch(() => setLoading(false));
  }, []);

  function handleView(id, path) {
    setSelectedId(id);
    navigate(path);
  }

  const sorted = [...tournaments].sort(
    (a, b) => statusPriority(a.status) - statusPriority(b.status)
  );

  if (loading) return <div className="page"><p>Loading…</p></div>;

  return (
    <div className="page">
      <h1>Tournament History</h1>
      {sorted.length === 0 && <p>No tournaments yet.</p>}
      {sorted.map(t => {
        const s    = stats[t.id];
        const info = STATUS_INFO[t.status] || { label: t.status.toUpperCase(), cls: '' };
        return (
          <div
            key={t.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '20px 24px',
              marginBottom: 16,
              boxShadow: 'var(--shadow)',
              opacity: t.status === 'completed' ? 0.92 : 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>
                  {t.status === 'completed' && <span style={{ marginRight: 8 }}>🏆</span>}
                  {t.name}
                </h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`status-badge ${info.cls}`}>{info.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '2px 9px', borderRadius: 12 }}>
                    {t.format}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="sm" onClick={() => handleView(t.id, '/bracket')}>View Bracket</button>
                <button className="sm" onClick={() => handleView(t.id, '/standings')}>View Standings</button>
              </div>
            </div>

            {s && (
              <div style={{ display: 'flex', gap: 28, marginTop: 18, flexWrap: 'wrap' }}>
                <StatCell value={s.total_teams}    label="Teams" />
                <StatCell value={s.matches_played} label="Matches Played" suffix={`/${s.matches_total}`} />
                <StatCell value={s.goals_scored}   label="Goals Scored" />
                {s.top_scorer_name && (
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{s.top_scorer_name}</span>
                    {' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>({s.top_scorer_goals} goals)</span>
                    <br />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Scorer</span>
                  </div>
                )}
                {t.status === 'completed' && s.tournament_winner && (
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#27ae60' }}>🏆 {s.tournament_winner}</span>
                    <br />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Final Winner</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
