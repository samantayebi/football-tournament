const pool   = require('../../db');
const logger = require('../../utils/logger');
const { matchResultsTotal } = require('../../utils/metrics');
const { determineWinner } = require('../../utils/resultUtils');
const { publishEvent }    = require('../../utils/eventPublisher');
const { upsertReport }    = require('../reports/queries');

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

  // Auto-generate match report
  try {
    const { rows: teams } = await pool.query(
      `SELECT id, name FROM teams WHERE id = ANY($1::int[])`,
      [[updated.team1_id, updated.team2_id]]
    );
    const teamMap    = Object.fromEntries(teams.map(t => [t.id, t.name]));
    const team1Name  = teamMap[updated.team1_id]  || 'Team 1';
    const team2Name  = teamMap[updated.team2_id]  || 'Team 2';
    const winnerName = teamMap[updated.winner_id] || 'Unknown';

    const { rows: goals } = await pool.query(
      `SELECT p.name AS player_name, mg.minute
       FROM match_goals mg
       JOIN players p ON p.id = mg.player_id
       WHERE mg.match_id = $1
       ORDER BY mg.minute ASC NULLS LAST, mg.id ASC`,
      [updated.id]
    );

    let summary = `Match completed. Final score: ${team1Name} ${updated.score_team1} - ${updated.score_team2} ${team2Name}. Winner: ${winnerName}.`;
    if (goals.length > 0) {
      const goalStr = goals.map(g => g.minute ? `${g.player_name} (${g.minute}')` : g.player_name).join(', ');
      summary += ` Goals: ${goalStr}.`;
    }

    await upsertReport(updated.id, summary);
  } catch (err) {
    logger.warn('failed to auto-generate match report', { matchId: updated.id, err: err.message });
  }

  await publishEvent('match.completed', {
    matchId:      updated.id,
    score_team1:  updated.score_team1,
    score_team2:  updated.score_team2,
    winner_id:    updated.winner_id,
    tournament_id: updated.tournament_id,
  });

  matchResultsTotal.inc({ tournament_id: updated.tournament_id });
  logger.info('match result saved', {
    matchId:     updated.id,
    score_team1: updated.score_team1,
    score_team2: updated.score_team2,
    winner_id:   updated.winner_id,
  });

  return updated;
}

module.exports = { setMatchResult };
