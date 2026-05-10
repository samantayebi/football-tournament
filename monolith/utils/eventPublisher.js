const amqp = require('amqplib');

const EXCHANGE = 'tournament_events';
const URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';

let channel = null;

async function connect() {
  try {
    const conn = await amqp.connect(URL);
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });
    console.log('[EventPublisher] Connected to RabbitMQ');
  } catch (err) {
    console.error('[EventPublisher] RabbitMQ unavailable, events will be skipped:', err.message);
    channel = null;
  }
}

connect();

async function publishEvent(eventName, payload) {
  if (!channel) return;
  try {
    const msg = JSON.stringify({ event: eventName, ...payload });
    channel.publish(EXCHANGE, '', Buffer.from(msg));
  } catch (err) {
    console.error('[EventPublisher] Failed to publish event:', err.message);
  }
}

module.exports = { publishEvent, isConnected: () => channel !== null };
