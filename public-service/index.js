require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');
const axios   = require('axios');
const Redis   = require('ioredis');
const amqp    = require('amqplib');
const logger  = require('./logger');
const { register, cacheHitsTotal, cacheMissesTotal, cacheInvalidationsTotal, rabbitmqEventsReceivedTotal } = require('./metrics');
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

const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

let rabbitChannel = null;
const sseClients  = new Set();

const CACHE_TTL = 60;

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', async (req, res) => {
  const deps = { db: 'ok', redis: 'ok', rabbitmq: 'ok' };

  try {
    await pool.query('SELECT 1');
  } catch {
    deps.db = 'error';
  }

  try {
    await redis.ping();
  } catch {
    deps.redis = 'error';
  }

  if (!rabbitChannel) deps.rabbitmq = 'error';

  const status = Object.values(deps).every(v => v === 'ok') ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({ status, uptime: process.uptime(), dependencies: deps });
});

app.get('/api/v1/public/bracket', async (req, res) => {
  const tournament_id = req.query.tournament_id || 1;
  const cacheKey = `bracket:${tournament_id}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      cacheHitsTotal.inc({ key: 'bracket' });
      logger.info('cache hit', { key: cacheKey });
      return res.json(JSON.parse(cached));
    }

    cacheMissesTotal.inc({ key: 'bracket' });
    logger.info('cache miss', { key: cacheKey });
    const { rows } = await pool.query(`
      SELECT m.*,
             t1.name     AS team1_name,
             t1.logo_url AS team1_logo,
             t2.name     AS team2_name,
             t2.logo_url AS team2_logo,
             w.name      AS winner_name
      FROM matches m
      LEFT JOIN teams t1 ON t1.id = m.team1_id
      LEFT JOIN teams t2 ON t2.id = m.team2_id
      LEFT JOIN teams w  ON w.id  = m.winner_id
      WHERE m.tournament_id = $1
      ORDER BY m.round, m.id
    `, [tournament_id]);

    const bracket = rows.reduce((acc, match) => {
      const key = `round_${match.round}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    }, {});

    await redis.set(cacheKey, JSON.stringify(bracket), 'EX', CACHE_TTL);
    res.json(bracket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/public/standings', async (req, res) => {
  const tournament_id = req.query.tournament_id || 1;
  const cacheKey = `standings:${tournament_id}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      cacheHitsTotal.inc({ key: 'standings' });
      logger.info('cache hit', { key: cacheKey });
      return res.json(JSON.parse(cached));
    }

    cacheMissesTotal.inc({ key: 'standings' });
    logger.info('cache miss', { key: cacheKey });
    const { data } = await axios.get(`${process.env.STANDINGS_URL}/api/v1/standings`, {
      params: { tournament_id },
    });
    await redis.set(cacheKey, JSON.stringify(data), 'EX', CACHE_TTL);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach standings service' });
  }
});

app.get('/api/v1/public/events', (req, res) => {
  res.set({
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
  });
  res.flushHeaders();
  res.write(': ping\n\n');

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 30000);
  sseClients.add(res);
  logger.info('sse client connected', { total: sseClients.size });

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
    logger.info('sse client disconnected', { remaining: sseClients.size });
  });
});

const PORT = process.env.PUBLIC_PORT || 3002;
app.listen(PORT, () => logger.info('public service started', { port: PORT }));

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

  logger.info('listening for cache invalidation events');

  rabbitChannel.consume(queue, async (msg) => {
    if (!msg) return;
    const { event } = JSON.parse(msg.content.toString());
    if (event === 'match.completed') {
      const [bracketKeys, standingsKeys] = await Promise.all([
        redis.keys('bracket:*'),
        redis.keys('standings:*'),
      ]);
      const allKeys = [...bracketKeys, ...standingsKeys];
      if (allKeys.length) await redis.del(...allKeys);
      cacheInvalidationsTotal.inc();
      rabbitmqEventsReceivedTotal.inc({ event_name: 'match.completed' });
      logger.info('cache invalidated', { keys: allKeys });

      const ssePayload = `data: ${JSON.stringify({ type: 'match.completed', timestamp: new Date().toISOString() })}\n\n`;
      for (const client of sseClients) client.write(ssePayload);
      logger.info('sse event broadcast', { event: 'match.completed', clients: sseClients.size });
    }
    rabbitChannel.ack(msg);
  });
}

connectRabbitMQ().catch(console.error);
