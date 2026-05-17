const { httpRequestsTotal, httpRequestDuration } = require('../utils/metrics');

module.exports = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [s, ns] = process.hrtime(start);
    const duration = s + ns / 1e9;
    const route = req.route?.path || req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  next();
};
