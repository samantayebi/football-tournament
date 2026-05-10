require('dotenv').config();
const express = require('express');
const amqp    = require('amqplib');

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
app.listen(HEALTH_PORT, () => console.log(`Notification service health endpoint on port ${HEALTH_PORT}`));

async function start() {
  let conn;
  while (!conn) {
    try {
      conn = await amqp.connect(URL);
    } catch {
      console.log('[NOTIFICATION] Waiting for RabbitMQ...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  rabbitChannel = await conn.createChannel();
  await rabbitChannel.assertExchange(EXCHANGE, 'fanout', { durable: true });
  const { queue } = await rabbitChannel.assertQueue('', { exclusive: true });
  await rabbitChannel.bindQueue(queue, EXCHANGE, '');

  console.log('[NOTIFICATION] Listening for events...');

  rabbitChannel.consume(queue, (msg) => {
    if (!msg) return;
    const data = JSON.parse(msg.content.toString());
    const { event, matchId, winner_id } = data;
    console.log(`[NOTIFICATION] Event received: ${event} - Match ${matchId} won by team ${winner_id}`);
    rabbitChannel.ack(msg);
  });
}

start().catch(console.error);
