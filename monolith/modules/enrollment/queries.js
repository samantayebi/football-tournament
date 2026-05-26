const pool = require('../../db');

async function createTeam(tournament_id, name, contact_email) {
  const { rows } = await pool.query(
    `INSERT INTO teams (tournament_id, name, contact_email)
     VALUES ($1, $2, $3) RETURNING *`,
    [tournament_id, name, contact_email]
  );
  return rows[0];
}

async function createPlayer(team_id, name, shirt_number) {
  const { rows } = await pool.query(
    `INSERT INTO players (team_id, name, shirt_number)
     VALUES ($1, $2, $3) RETURNING *`,
    [team_id, name, shirt_number]
  );
  return rows[0];
}

async function getAllTeams(tournament_id) {
  const { rows } = await pool.query(`
    SELECT t.*,
           COALESCE(
             json_agg(p.* ORDER BY p.id) FILTER (WHERE p.id IS NOT NULL),
             '[]'
           ) AS players
    FROM teams t
    LEFT JOIN players p ON p.team_id = t.id
    WHERE t.tournament_id = $1
    GROUP BY t.id
    ORDER BY t.id
  `, [tournament_id]);
  return rows;
}

async function updateTeamStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE teams SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] || null;
}

async function updateTeamSeed(teamId, seed) {
  const { rows } = await pool.query(
    `UPDATE teams SET seed = $1 WHERE id = $2 RETURNING *`,
    [seed ?? null, teamId]
  );
  return rows[0] || null;
}

module.exports = { createTeam, createPlayer, getAllTeams, updateTeamStatus, updateTeamSeed };
