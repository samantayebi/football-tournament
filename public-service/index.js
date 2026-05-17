require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');
const axios   = require('axios');
const Redis   = require('ioredis');
const amqp    = require('amqplib');
const logger  = require('./logger');

const app  = express();
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  logger.info('incoming request', { method: req.method, url: req.url, ip: req.ip });
  next();
});

const pool = new Pool({
  user:     process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
});

const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

let rabbitChannel = null;

const CACHE_TTL = 60;

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
  try {
    const cached = await redis.get('bracket');
    if (cached) {
      logger.info('cache hit', { key: 'bracket' });
      return res.json(JSON.parse(cached));
    }

    logger.info('cache miss', { key: 'bracket' });
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

    await redis.set('bracket', JSON.stringify(bracket), 'EX', CACHE_TTL);
    res.json(bracket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/public/standings', async (req, res) => {
  try {
    const cached = await redis.get('standings');
    if (cached) {
      logger.info('cache hit', { key: 'standings' });
      return res.json(JSON.parse(cached));
    }

    logger.info('cache miss', { key: 'standings' });
    const { data } = await axios.get(`${process.env.STANDINGS_URL}/api/v1/standings`);
    await redis.set('standings', JSON.stringify(data), 'EX', CACHE_TTL);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach standings service' });
  }
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
      await redis.del('bracket', 'standings');
      logger.info('cache invalidated', { keys: ['bracket', 'standings'] });
    }
    rabbitChannel.ack(msg);
  });
}

connectRabbitMQ().catch(console.error);
