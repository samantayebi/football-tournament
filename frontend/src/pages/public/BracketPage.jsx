import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useTournament } from '../../context/TournamentContext';

const CW = 200;
const CH = 72;
const RG = 80;
const MG = 40;
const PT = 40;
const PL = 40;
const LH = 28;

function roundLabel(r, total) {
  const fromEnd = total - 1 - r;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semi-Final';
  if (fromEnd === 2) return 'Quarter-Final';
  return `Round ${r + 1}`;
}

function buildPositions(rounds) {
  const pos = [];
  for (let r = 0; r < rounds.length; r++) {
    pos[r] = [];
    for (let i = 0; i < rounds[r].length; i++) {
      if (r === 0) {
        pos[r][i] = PT + LH + i * (CH + MG);
      } else {
        const p1y = pos[r - 1][i * 2];
        const p2y = pos[r - 1][i * 2 + 1] ?? p1y;
        pos[r][i] = (p1y + CH / 2 + p2y + CH / 2) / 2 - CH / 2;
      }
    }
  }
  return pos;
}

function colX(r) {
  return PL + r * (CW + RG);
}

export default function BracketPage() {
  const { selectedId } = useTournament();
  const [bracket, setBracket]     = useState({});
  const [error, setError]         = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [live, setLive]           = useState(false);

  const fetchBracket = useCallback(() => {
    if (!selectedId) return;
    api.get(`/api/v1/public/bracket?tournament_id=${selectedId}`)
      .then(r => { setBracket(r.data); setUpdatedAt(new Date()); })
      .catch(() => setError('Failed to load bracket'));
  }, [selectedId]);

  useEffect(() => { fetchBracket(); }, [fetchBracket]);

  useEffect(() => {
    const es = new EventSource('/api/v1/public/events');
    es.onopen    = () => setLive(true);
    es.onerror   = () => setLive(false);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'match.completed') fetchBracket();
    };
    return () => es.close();
  }, [fetchBracket]);

  const keys   = Object.keys(bracket).sort((a, b) => +a.split('_')[1] - +b.split('_')[1]);
  const rounds = keys.map(k => bracket[k]);
  const numR   = rounds.length;

  if (!numR) {
    return (
      <div className="page">
        <h1>Tournament Bracket {live && <span className="live-badge">LIVE</span>}</h1>
        {error ? <p className="error">{error}</p> : <p>No bracket generated yet.</p>}
      </div>
    );
  }

  const pos    = buildPositions(rounds);
  const r1n    = rounds[0].length;
  const final  = rounds[numR - 1][0];
  const champion = final?.winner_id
    ? (final.winner_id === final.team1_id ? final.team1_name : final.team2_name)
    : null;

  const champBoxX = colX(numR - 1) + CW + RG / 2;
  const champCY   = pos[numR - 1][0] + CH / 2;

  const svgW = PL + numR * CW + (numR - 1) * RG + (champion ? RG + 120 : 0) + PL;
  const svgH = PT + LH + r1n * CH + (r1n - 1) * MG + 40 + PT;

  return (
    <div className="page">
      <h1>Tournament Bracket {live && <span className="live-badge">LIVE</span>}</h1>
      {error && <p className="error">{error}</p>}
      <div className="bracket-container">
        <svg className="bracket-svg" width={svgW} height={svgH} xmlns="http://www.w3.org/2000/svg">
          {/* Round labels */}
          {rounds.map((_, r) => (
            <text key={`lbl-${r}`}
              x={colX(r) + CW / 2} y={PT + LH - 8}
              textAnchor="middle" className="round-label"
            >
              {roundLabel(r, numR)}
            </text>
          ))}
          {champion && (
            <text x={champBoxX + 60} y={PT + LH - 8} textAnchor="middle" className="round-label">
              Champion
            </text>
          )}

          {/* Connector lines */}
          {rounds.map((matches, r) =>
            r === 0 ? null : matches.map((_, i) => {
              const p1y  = pos[r - 1][i * 2];
              const p2y  = pos[r - 1][i * 2 + 1];
              const p1c  = p1y + CH / 2;
              const p2c  = p2y != null ? p2y + CH / 2 : p1c;
              const midX = colX(r) - RG / 2;
              const cc   = pos[r][i] + CH / 2;
              return (
                <g key={`conn-${r}-${i}`}>
                  <line className="connector" x1={colX(r-1)+CW} y1={p1c} x2={midX} y2={p1c} />
                  {p2y != null && <>
                    <line className="connector" x1={colX(r-1)+CW} y1={p2c} x2={midX} y2={p2c} />
                    <line className="connector" x1={midX} y1={p1c} x2={midX} y2={p2c} />
                  </>}
                  <line className="connector" x1={midX} y1={cc} x2={colX(r)} y2={cc} />
                </g>
              );
            })
          )}

          {/* Champion box */}
          {champion && (
            <g>
              <line className="connector"
                x1={colX(numR-1)+CW} y1={champCY} x2={champBoxX} y2={champCY} />
              <rect x={champBoxX} y={champCY-16} width={120} height={32} rx={6} fill="#27ae60" />
              <text x={champBoxX+60} y={champCY} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: 12, fontWeight: 700, fill: '#fff', fontFamily: 'system-ui' }}>
                {champion}
              </text>
            </g>
          )}

          {/* Match cards */}
          {rounds.map((matches, r) =>
            matches.map((m, i) => {
              const x   = colX(r);
              const y   = pos[r][i];
              const won = m.winner_id != null;
              const t1w = won && m.winner_id === m.team1_id;
              const t2w = won && m.winner_id === m.team2_id;
              const t1cls = !m.team1_name ? 'team-tbd' : t1w ? 'team-winner' : t2w ? 'team-loser' : '';
              const t2cls = !m.team2_name ? 'team-tbd' : t2w ? 'team-winner' : t1w ? 'team-loser' : '';
              return (
                <g key={`match-${r}-${i}`}>
                  <rect x={x} y={y} width={CW} height={CH} rx={6}
                    className={won ? 'match-card-winner' : 'match-card-normal'} strokeWidth={1.5} />
                  <line x1={x} y1={y+CH/2} x2={x+CW} y2={y+CH/2} stroke="#dde2ec" strokeWidth={1} />
                  <text x={x+12} y={y+CH/4} dominantBaseline="middle" className={`team-name ${t1cls}`}>
                    {m.team1_name || 'TBD'}
                  </text>
                  <text x={x+12} y={y+CH*3/4} dominantBaseline="middle" className={`team-name ${t2cls}`}>
                    {m.team2_name || 'TBD'}
                  </text>
                  {m.score_team1 != null && <>
                    <text x={x+CW-12} y={y+CH/4} textAnchor="end" dominantBaseline="middle"
                      className={`team-name ${t1w ? 'team-winner' : 'team-loser'}`}>
                      {m.score_team1}
                    </text>
                    <text x={x+CW-12} y={y+CH*3/4} textAnchor="end" dominantBaseline="middle"
                      className={`team-name ${t2w ? 'team-winner' : 'team-loser'}`}>
                      {m.score_team2}
                    </text>
                  </>}
                  {m.match_date && (
                    <text x={x} y={y+CH+14} className="round-label" style={{ fontSize: 10 }}>
                      {new Date(m.match_date).toLocaleString()}
                    </text>
                  )}
                  {m.venue && (
                    <text x={x} y={y+CH+(m.match_date ? 26 : 14)} className="round-label" style={{ fontSize: 10 }}>
                      {m.venue}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>
      {updatedAt && (
        <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
          Last updated: {updatedAt.toLocaleTimeString()}
        </p>
      )}

      {(() => {
        const completed = rounds.flat().filter(m => m.winner_id != null);
        if (completed.length === 0) return null;
        return (
          <div style={{ marginTop: 32 }}>
            <h2>Match Reports</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {completed.map(m => (
                <Link
                  key={m.id}
                  to={`/report/${m.id}`}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: 13,
                  }}
                >
                  📋 {m.team1_name} {m.score_team1}–{m.score_team2} {m.team2_name}
                </Link>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
