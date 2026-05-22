require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');
const amqp    = require('amqplib');
const logger  = require('./logger');
const { register, standingsQueriesTotal, rabbitmqEventsReceivedTotal } = require('./metrics');
const metricsMiddleware = require('./metricsMiddleware');

const app  = express();
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  logger.info('incoming request', { method: req.method, url: req.url, ip: req.ip });
  next();
});
app.use(metricsMiddleware);

const pool = new Pool({
  user:     process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
});

let rabbitChannel = null;

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

  if (!rabbitChannel) deps.rabbitmq = 'error';

  const status = Object.values(deps).every(v => v === 'ok') ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({ status, uptime: process.uptime(), dependencies: deps });
});

app.get('/api/v1/standings', async (req, res) => {
  const tournament_id = parseInt(req.query.tournament_id || '1', 10);
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
        AND m.tournament_id = $1
      WHERE t.tournament_id = $1
      GROUP BY t.id, t.name
      ORDER BY wins DESC, goals_scored DESC
    `, [tournament_id]);
    standingsQueriesTotal.inc();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.STANDINGS_PORT || 3001;
app.listen(PORT, () => logger.info('standings service started', { port: PORT }));

const EXCHANGE = 'tournament_events';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';

async function connectRabbitMQ() {
  let conn;
  while (!conn) {
    try {
      conn = await amqp.connect(RABBITMQ_URL);
    } catch {
      logger.warn('waiting for rabbitmq', { retryIn: '3s' });
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  rabbitChannel = await conn.createChannel();
  await rabbitChannel.assertExchange(EXCHANGE, 'fanout', { durable: true });
  const { queue } = await rabbitChannel.assertQueue('', { exclusive: true });
  await rabbitChannel.bindQueue(queue, EXCHANGE, '');

  logger.info('rabbitmq connected');
  logger.info('listening for tournament events');

  rabbitChannel.consume(queue, (msg) => {
    if (!msg) return;
    const { event, matchId } = JSON.parse(msg.content.toString());
    if (event === 'match.completed') {
      rabbitmqEventsReceivedTotal.inc({ event_name: 'match.completed' });
      logger.info('standings recalculation triggered', { matchId });
    }
    rabbitChannel.ack(msg);
  });
}

connectRabbitMQ().catch(console.error);
