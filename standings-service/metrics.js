const client = require('prom-client');

client.register.setDefaultLabels({ service: 'standings-service' });
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

const standingsQueriesTotal = new client.Counter({
  name: 'standings_queries_total',
  help: 'Total standings DB queries',
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
  standingsQueriesTotal,
  rabbitmqEventsReceivedTotal,
};
