const pool = require('../../db');

async function addGoal(match_id, player_id, team_id, minute) {
  const { rows } = await pool.query(
    `INSERT INTO match_goals (match_id, player_id, team_id, minute)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [match_id, player_id, team_id, minute ?? null]
  );
  return rows[0];
}

async function getMatchGoals(match_id) {
  const { rows } = await pool.query(`
    SELECT mg.id, mg.match_id, mg.player_id, mg.team_id, mg.minute,
           p.name AS player_name, t.name AS team_name
    FROM match_goals mg
    JOIN players p ON p.id = mg.player_id
    JOIN teams   t ON t.id = mg.team_id
    WHERE mg.match_id = $1
    ORDER BY mg.minute ASC NULLS LAST, mg.id ASC
  `, [match_id]);
  return rows;
}

async function getTopScorers(tournament_id, limit = 10) {
  const { rows } = await pool.query(`
    SELECT p.id AS player_id, p.name AS player_name, t.name AS team_name,
           COUNT(mg.id)::int AS goals
    FROM match_goals mg
    JOIN players p ON p.id = mg.player_id
    JOIN teams   t ON t.id = mg.team_id
    WHERE t.tournament_id = $1
    GROUP BY p.id, p.name, t.name
    ORDER BY goals DESC
    LIMIT $2
  `, [tournament_id, limit]);
  return rows;
}

module.exports = { addGoal, getMatchGoals, getTopScorers };
