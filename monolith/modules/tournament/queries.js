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

async function archiveTournament(id) {
  const { rows } = await pool.query(
    `UPDATE tournament SET status = 'completed' WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
}

async function getTournamentStats(tournament_id) {
  const [statsRes, topScorerRes, winnerRes] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM teams  WHERE tournament_id = $1 AND status = 'approved') AS total_teams,
        (SELECT COUNT(*)::int FROM matches WHERE tournament_id = $1 AND status = 'completed') AS matches_played,
        (SELECT COUNT(*)::int FROM matches WHERE tournament_id = $1) AS matches_total,
        (SELECT COALESCE(SUM(score_team1 + score_team2), 0)::int
           FROM matches WHERE tournament_id = $1 AND status = 'completed') AS goals_scored
    `, [tournament_id]),
    pool.query(`
      SELECT p.name AS top_scorer_name, COUNT(mg.id)::int AS top_scorer_goals
      FROM match_goals mg
      JOIN players p ON p.id = mg.player_id
      JOIN teams   t ON t.id = mg.team_id
      WHERE t.tournament_id = $1
      GROUP BY p.id, p.name
      ORDER BY top_scorer_goals DESC
      LIMIT 1
    `, [tournament_id]),
    pool.query(`
      SELECT t.name AS tournament_winner
      FROM matches m
      JOIN teams t ON t.id = m.winner_id
      WHERE m.tournament_id = $1 AND m.status = 'completed'
      ORDER BY m.round DESC
      LIMIT 1
    `, [tournament_id]),
  ]);

  return {
    ...statsRes.rows[0],
    top_scorer_name:   topScorerRes.rows[0]?.top_scorer_name  ?? null,
    top_scorer_goals:  topScorerRes.rows[0]?.top_scorer_goals ?? 0,
    tournament_winner: winnerRes.rows[0]?.tournament_winner   ?? null,
  };
}

module.exports = {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournamentStatus,
  archiveTournament,
  getTournamentStats,
};
