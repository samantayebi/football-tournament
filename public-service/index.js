require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');
const axios   = require('axios');

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

app.get('/public/bracket', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*,
             t1.name AS team1_name,
             t2.name AS team2_name,
             w.name  AS winner_name
      FROM matches m
      LEFT JOIN teams t1 ON t1.id = m.team1_id
      LEFT JOIN teams t2 ON t2.id = m.team2_id
      LEFT JOIN teams w  ON w.id  = m.winner_id
      ORDER BY m.round, m.id
    `);

    const bracket = rows.reduce((acc, match) => {
      const key = `round_${match.round}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    }, {});

    res.json(bracket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/public/standings', async (req, res) => {
  try {
    const { data } = await axios.get(`${process.env.STANDINGS_URL}/standings`);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach standings service' });
  }
});

const PORT = process.env.PUBLIC_PORT || 3002;
app.listen(PORT, () => console.log(`Public service listening on port ${PORT}`));
