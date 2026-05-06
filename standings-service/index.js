require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');

const app  = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user:     process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
});

app.get('/standings', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        t.id   AS team_id,
        t.name AS team_name,
        COUNT(CASE WHEN m.winner_id = t.id THEN 1 END)::int AS wins,
        COUNT(
          CASE WHEN m.status = 'completed'
                AND m.winner_id IS NOT NULL
                AND m.winner_id != t.id
          THEN 1 END
        )::int AS losses,
        COALESCE(SUM(
          CASE
            WHEN m.team1_id = t.id THEN m.score_team1
            WHEN m.team2_id = t.id THEN m.score_team2
          END
        ), 0)::int AS goals_scored,
        COALESCE(SUM(
          CASE
            WHEN m.team1_id = t.id THEN m.score_team2
            WHEN m.team2_id = t.id THEN m.score_team1
          END
        ), 0)::int AS goals_conceded,
        COALESCE(MAX(
          CASE WHEN m.status = 'completed' THEN m.round END
        ), 0)::int AS current_round
      FROM teams t
      LEFT JOIN matches m
        ON (m.team1_id = t.id OR m.team2_id = t.id)
      GROUP BY t.id, t.name
      ORDER BY wins DESC, goals_scored DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.STANDINGS_PORT || 3001;
app.listen(PORT, () => console.log(`Standings service listening on port ${PORT}`));
