import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const bracketDuration = new Trend('bracket_duration');
const standingsDuration = new Trend('standings_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up to 10 users
    { duration: '1m',  target: 50 },   // ramp up to 50 users
    { duration: '1m',  target: 50 },   // stay at 50 users
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // p95 must be under 500ms
    errors: ['rate<0.01'],             // error rate must be under 1%
    bracket_duration: ['p(95)<500'],
    standings_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost';

export default function () {
  // Test public bracket endpoint
  const bracketRes = http.get(`${BASE_URL}/api/v1/public/bracket`);
  bracketDuration.add(bracketRes.timings.duration);
  check(bracketRes, {
    'bracket status 200': (r) => r.status === 200,
    'bracket has data': (r) => r.body.length > 2,
  });
  errorRate.add(bracketRes.status !== 200);

  sleep(0.5);

  // Test public standings endpoint
  const standingsRes = http.get(`${BASE_URL}/api/v1/public/standings`);
  standingsDuration.add(standingsRes.timings.duration);
  check(standingsRes, {
    'standings status 200': (r) => r.status === 200,
    'standings has teams': (r) => r.body.includes('team_name'),
  });
  errorRate.add(standingsRes.status !== 200);

  sleep(0.5);
}
