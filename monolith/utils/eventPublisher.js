const amqp   = require('amqplib');
const logger = require('./logger');
const { eventsPublishedTotal } = require('./metrics');

const EXCHANGE = 'tournament_events';
const URL = process.env.RABBITMQ_URL || 'amqp://admin:password@rabbitmq:5672';

let channel = null;

async function connect() {
  try {
    const conn = await amqp.connect(URL);
    channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });
    logger.info('rabbitmq connected');
  } catch (err) {
    logger.error('rabbitmq unavailable, events will be skipped', { error: err.message });
    channel = null;
  }
}

connect();

async function publishEvent(eventName, payload) {
  if (!channel) return;
  try {
    const msg = JSON.stringify({ event: eventName, ...payload });
    channel.publish(EXCHANGE, '', Buffer.from(msg));
    eventsPublishedTotal.inc({ event_name: eventName });
    logger.info('event published', { event: eventName, payload });
  } catch (err) {
    logger.error('rabbitmq publish failed', { error: err.message });
  }
}

module.exports = { publishEvent, isConnected: () => channel !== null };
