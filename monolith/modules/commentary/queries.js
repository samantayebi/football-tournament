const pool = require('../../db');

async function addComment(match_id, minute, text, type = 'comment') {
  const { rows } = await pool.query(
    `INSERT INTO match_commentary (match_id, minute, text, type)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [match_id, minute ?? null, text, type]
  );
  return rows[0];
}

async function getCommentary(match_id) {
  const { rows } = await pool.query(
    `SELECT * FROM match_commentary
     WHERE match_id = $1
     ORDER BY minute ASC NULLS LAST, id ASC`,
    [match_id]
  );
  return rows;
}

module.exports = { addComment, getCommentary };
