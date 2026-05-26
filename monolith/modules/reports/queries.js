const pool = require('../../db');

async function getReport(match_id) {
  const { rows } = await pool.query(
    'SELECT * FROM reports WHERE match_id = $1',
    [match_id]
  );
  return rows[0] || null;
}

async function upsertReport(match_id, summary) {
  const { rows } = await pool.query(
    `INSERT INTO reports (match_id, summary)
     VALUES ($1, $2)
     ON CONFLICT (match_id) DO UPDATE SET summary = EXCLUDED.summary
     RETURNING *`,
    [match_id, summary]
  );
  return rows[0];
}

module.exports = { getReport, upsertReport };
