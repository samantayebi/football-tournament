const pool = require('../../db');

async function getReport(match_id) {
  const { rows } = await pool.query(
    'SELECT * FROM reports WHERE match_id = $1',
    [match_id]
  );
  return rows[0] || null;
}

async function upsertReport(match_id, summary) {
  // Try update first; fall back to insert if no existing report
  const { rows: updated } = await pool.query(
    `UPDATE reports SET summary = $1 WHERE match_id = $2 RETURNING *`,
    [summary, match_id]
  );
  if (updated.length > 0) return updated[0];

  const { rows } = await pool.query(
    `INSERT INTO reports (match_id, summary) VALUES ($1, $2) RETURNING *`,
    [match_id, summary]
  );
  return rows[0];
}

module.exports = { getReport, upsertReport };
