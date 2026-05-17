require('dotenv').config();
const express = require('express');
const amqp    = require('amqplib');
const logger  = require('./logger');

const EXCHANGE = 'tournament_events';
const URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';

let rabbitChannel = null;

const app = express();

app.get('/health', (req, res) => {
  const deps = { rabbitmq: rabbitChannel ? 'ok' : 'error' };
  const status = deps.rabbitmq === 'ok' ? 'ok' : 'degraded';
  res.status(status === 'ok' ? 200 : 503).json({ status, uptime: process.uptime(), dependencies: deps });
});

const HEALTH_PORT = 3003;
app.listen(HEALTH_PORT, () => logger.info('notification service health endpoint started', { port: HEALTH_PORT }));

async function start() {
  let conn;
  while (!conn) {
    try {
      conn = await amqp.connect(URL);
    } catch {
      logger.warn('waiting for rabbitmq', { retryIn: '3s' });
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  rabbitChannel = await conn.createChannel();
  await rabbitChannel.assertExchange(EXCHANGE, 'fanout', { durable: true });
  const { queue } = await rabbitChannel.assertQueue('', { exclusive: true });
  await rabbitChannel.bindQueue(queue, EXCHANGE, '');

  logger.info('listening for tournament events');

  rabbitChannel.consume(queue, (msg) => {
    if (!msg) return;
    const data = JSON.parse(msg.content.toString());
    const { event, matchId, winner_id } = data;
    logger.info('event received', { event, matchId, winner_id });
    rabbitChannel.ack(msg);
  });
}

start().catch(console.error);
