require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');

const pool       = require('./db');
const logger     = require('./utils/logger');
const { register } = require('./utils/metrics');
const metricsMiddleware = require('./middleware/metricsMiddleware');
const { isConnected: rabbitConnected } = require('./utils/eventPublisher');
const auth       = require('./middleware/auth');
const enrollment = require('./modules/enrollment');
const bracket    = require('./modules/bracket');
const results    = require('./modules/results');
const reports    = require('./modules/reports');
const tournament = require('./modules/tournament');
const stats      = require('./modules/stats');
const { getAllTournaments } = require('./modules/tournament/queries');
const { getTopScorers }    = require('./modules/stats/queries');
const { getReport }        = require('./modules/reports/queries');

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  logger.info('incoming request', { method: req.method, url: req.url, ip: req.ip });
  next();
});
app.use(metricsMiddleware);

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', async (req, res) => {
  const deps = { db: 'ok', rabbitmq: 'ok' };

  try {
    await pool.query('SELECT 1');
  } catch {
    deps.db = 'error';
  }

  if (!rabbitConnected()) deps.rabbitmq = 'error';

  const status = Object.values(deps).every(v => v === 'ok') ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({ status, uptime: process.uptime(), dependencies: deps });
});

const ADMIN = { username: 'admin', password: 'admin123' };

app.post('/api/v1/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN.username || password !== ADMIN.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

app.use('/api/v1/admin', auth, enrollment);
app.use('/api/v1/admin', auth, bracket);
app.use('/api/v1/admin', auth, results);
app.use('/api/v1/admin', auth, reports);
app.use('/api/v1/admin', auth, tournament);
app.use('/api/v1/admin', auth, stats);

app.get('/api/v1/public/reports/:matchId', async (req, res) => {
  try {
    const report = await getReport(req.params.matchId);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/public/top-scorers', async (req, res) => {
  const { tournament_id, limit } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  try {
    res.json(await getTopScorers(tournament_id, limit ? Number(limit) : 10));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/public/tournaments', async (_req, res) => {
  try {
    res.json(await getAllTournaments());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;
