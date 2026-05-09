require('dotenv').config();
const amqp = require('amqplib');

const EXCHANGE = 'tournament_events';
const URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';

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

  const ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, 'fanout', { durable: true });
  const { queue } = await ch.assertQueue('', { exclusive: true });
  await ch.bindQueue(queue, EXCHANGE, '');

  console.log('[NOTIFICATION] Listening for events...');

  ch.consume(queue, (msg) => {
    if (!msg) return;
    const data = JSON.parse(msg.content.toString());
    const { event, matchId, winner_id } = data;
    console.log(`[NOTIFICATION] Event received: ${event} - Match ${matchId} won by team ${winner_id}`);
    ch.ack(msg);
  });
}

start().catch(console.error);
