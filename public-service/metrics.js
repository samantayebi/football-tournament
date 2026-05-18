const client = require('prom-client');

client.register.setDefaultLabels({ service: 'public-service' });
client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const cacheHitsTotal = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total Redis cache hits',
  labelNames: ['key'],
});

const cacheMissesTotal = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total Redis cache misses',
  labelNames: ['key'],
});

const cacheInvalidationsTotal = new client.Counter({
  name: 'cache_invalidations_total',
  help: 'Total cache invalidations',
});

const rabbitmqEventsReceivedTotal = new client.Counter({
  name: 'rabbitmq_events_received_total',
  help: 'Total RabbitMQ events received',
  labelNames: ['event_name'],
});

module.exports = {
  register: client.register,
  httpRequestsTotal,
  httpRequestDuration,
  cacheHitsTotal,
  cacheMissesTotal,
  cacheInvalidationsTotal,
  rabbitmqEventsReceivedTotal,
};
