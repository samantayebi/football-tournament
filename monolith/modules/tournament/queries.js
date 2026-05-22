const pool = require('../../db');

async function createTournament(name, format = 'single-elimination') {
  const { rows } = await pool.query(
    `INSERT INTO tournament (name, format) VALUES ($1, $2) RETURNING *`,
    [name, format]
  );
  return rows[0];
}

async function getAllTournaments() {
  const { rows } = await pool.query(`SELECT * FROM tournament ORDER BY id DESC`);
  return rows;
}

async function getTournamentById(id) {
  const { rows } = await pool.query(`SELECT * FROM tournament WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function updateTournamentStatus(id, status) {
  const { rows } = await pool.query(
    `UPDATE tournament SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] || null;
}

module.exports = { createTournament, getAllTournaments, getTournamentById, updateTournamentStatus };
