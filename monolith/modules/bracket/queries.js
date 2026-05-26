const pool = require('../../db');
const { buildBracketPlan, buildSeededBracket } = require('../../utils/bracketUtils');

async function getApprovedTeams(tournament_id) {
  const { rows } = await pool.query(
    `SELECT * FROM teams WHERE tournament_id = $1 AND status = 'approved'`,
    [tournament_id]
  );
  return rows;
}

async function clearTournamentMatches(tournament_id) {
  await pool.query('DELETE FROM matches WHERE tournament_id = $1', [tournament_id]);
}

async function insertMatch(tournament_id, round, team1_id, team2_id) {
  const { rows } = await pool.query(
    `INSERT INTO matches (tournament_id, round, team1_id, team2_id, status)
     VALUES ($1, $2, $3, $4, 'scheduled') RETURNING *`,
    [tournament_id, round, team1_id ?? null, team2_id ?? null]
  );
  return rows[0];
}

async function getBracket(tournament_id) {
  const { rows } = await pool.query(
    `SELECT m.*,
            t1.name AS team1_name,
            t2.name AS team2_name,
            w.name  AS winner_name
     FROM matches m
     LEFT JOIN teams t1 ON t1.id = m.team1_id
     LEFT JOIN teams t2 ON t2.id = m.team2_id
     LEFT JOIN teams w  ON w.id  = m.winner_id
     WHERE m.tournament_id = $1
     ORDER BY m.round, m.id`,
    [tournament_id]
  );
  return rows;
}

async function scheduleMatch(id, match_date, venue) {
  const { rows } = await pool.query(
    `UPDATE matches SET match_date = $1, venue = $2 WHERE id = $3 RETURNING *`,
    [match_date, venue, id]
  );
  return rows[0] || null;
}

async function generateBracket(tournament_id, seeded = true) {
  const teams = await getApprovedTeams(tournament_id);
  if (teams.length < 2) throw new Error('Need at least 2 approved teams to generate a bracket');

  const seededTeams   = teams.filter(t => t.seed != null);
  const unseededTeams = teams.filter(t => t.seed == null);
  const useSeeding    = seeded && seededTeams.length > 0;

  let orderedTeams;
  if (!useSeeding) {
    // Fisher-Yates shuffle — pure random draw
    orderedTeams = [...teams];
    for (let i = orderedTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [orderedTeams[i], orderedTeams[j]] = [orderedTeams[j], orderedTeams[i]];
    }
  } else if (unseededTeams.length === 0) {
    // All teams seeded: sort by seed ASC
    orderedTeams = [...teams].sort((a, b) => a.seed - b.seed);
  } else {
    // Mixed: seeded first (sorted), unseeded appended in random order
    const sortedSeeded = [...seededTeams].sort((a, b) => a.seed - b.seed);
    const shuffled = [...unseededTeams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    orderedTeams = [...sortedSeeded, ...shuffled];
  }

  await clearTournamentMatches(tournament_id);

  const plan = useSeeding
    ? buildSeededBracket(orderedTeams)
    : buildBracketPlan(orderedTeams);

  const allMatches = [];
  for (const { round, team1_id, team2_id } of plan) {
    allMatches.push(await insertMatch(tournament_id, round, team1_id, team2_id));
  }

  return allMatches;
}

module.exports = { generateBracket, getBracket, scheduleMatch };
