const client = require('prom-client');

client.register.setDefaultLabels({ service: 'monolith' });
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

const matchResultsTotal = new client.Counter({
  name: 'match_results_total',
  help: 'Total number of match results entered',
  labelNames: ['tournament_id'],
});

const eventsPublishedTotal = new client.Counter({
  name: 'events_published_total',
  help: 'Total number of RabbitMQ events published',
  labelNames: ['event_name'],
});

module.exports = {
  register: client.register,
  httpRequestsTotal,
  httpRequestDuration,
  matchResultsTotal,
  eventsPublishedTotal,
};
