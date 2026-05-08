const pool = require('../../db');
const { determineWinner } = require('../../utils/resultUtils');

async function getMatchById(id) {
  const { rows } = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);
  return rows[0] || null;
}

async function advanceWinner(match) {
  // Determine this match's 0-based position within its round (ordered by id)
  const { rows: roundMatches } = await pool.query(
    `SELECT id FROM matches WHERE tournament_id = $1 AND round = $2 ORDER BY id`,
    [match.tournament_id, match.round]
  );
  const position = roundMatches.findIndex(m => m.id === match.id);

  const { rows: nextRound } = await pool.query(
    `SELECT id FROM matches WHERE tournament_id = $1 AND round = $2 ORDER BY id`,
    [match.tournament_id, match.round + 1]
  );
  if (nextRound.length === 0) return; // final match — no further advancement

  const nextMatch = nextRound[Math.floor(position / 2)];
  if (!nextMatch) return;

  // Even position fills team1_id slot; odd fills team2_id
  const col = position % 2 === 0 ? 'team1_id' : 'team2_id';
  await pool.query(`UPDATE matches SET ${col} = $1 WHERE id = $2`, [match.winner_id, nextMatch.id]);
}

async function setMatchResult(id, score_team1, score_team2) {
  const match = await getMatchById(id);
  if (!match) return null;

  const winner_id = determineWinner(match, score_team1, score_team2);

  const { rows } = await pool.query(
    `UPDATE matches
     SET score_team1 = $1, score_team2 = $2, winner_id = $3, status = 'completed'
     WHERE id = $4 RETURNING *`,
    [score_team1, score_team2, winner_id, id]
  );
  const updated = rows[0];

  await advanceWinner(updated);

  return updated;
}

module.exports = { setMatchResult };
