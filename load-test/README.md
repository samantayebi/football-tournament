# Load Testing — Football Tournament Manager

Load tests are written with [k6](https://k6.io), an open-source tool that runs JavaScript test scripts and produces detailed performance reports.

## Installation

**macOS**
```bash
brew install k6
```

**Docker (no install required)**
```bash
docker run --rm -i grafana/k6 run - < load-test/load-test.js
```

## Running the tests

**Against localhost (default)**
```bash
k6 run load-test/load-test.js
```

**Against a different host**
```bash
k6 run -e BASE_URL=http://yourdomain.com load-test/load-test.js
```

**With a live web dashboard**
```bash
k6 run --out web-dashboard load-test/load-test.js
```

## Load profile

The script ramps virtual users (VUs) in four stages:

| Stage    | Duration | Target VUs | Purpose              |
|----------|----------|------------|----------------------|
| Ramp-up  | 30 s     | 10         | Warm up the system   |
| Ramp-up  | 1 min    | 50         | Increase load        |
| Steady   | 1 min    | 50         | Sustained peak load  |
| Ramp-down| 30 s     | 0          | Graceful cool-down   |

Total test duration: **~3 minutes**.

Each virtual user runs the default function in a loop: GET `/api/v1/public/bracket` → 0.5 s sleep → GET `/api/v1/public/standings` → 0.5 s sleep → repeat. At 50 VUs this produces roughly **50 req/s** across both endpoints.

## Thresholds

The test fails if any threshold is breached:

| Threshold               | Limit  | Meaning                                              |
|-------------------------|--------|------------------------------------------------------|
| `http_req_duration p95` | < 500 ms | 95 % of all requests must complete within 500 ms   |
| `errors rate`           | < 1 %  | Fewer than 1 in 100 requests may return a non-200  |
| `bracket_duration p95`  | < 500 ms | Same limit scoped to the bracket endpoint          |
| `standings_duration p95`| < 500 ms | Same limit scoped to the standings endpoint        |

A ✓ next to a threshold in the summary means it passed; ✗ means the run should be treated as a failure (useful in CI).

## Reading the output

```
✓ bracket status 200
✓ standings has teams

bracket_duration.........: avg=12ms   p(95)=38ms
standings_duration.......: avg=15ms   p(95)=42ms
errors...................: 0.00%  ✓ 0       ✗ 0
http_req_duration........: avg=13ms   p(95)=41ms  ✓
http_reqs................: 8842   49.1/s
```

Key columns to watch:

- **avg** — mean latency; useful for trends but can be skewed by outliers
- **p(95)** — the threshold value; 95 % of requests were faster than this
- **http_reqs / rate** — total requests and throughput across the test
- **errors rate** — fraction of requests that returned a non-200 status; a spike here usually means the upstream service is overloaded or the Redis cache is not warmed
- **check pass/fail counts** — each `check()` in the script is listed; failures here point to wrong response bodies, not just slow responses

## Tips

- Run the stack with `docker compose up` before starting the test.
- The first few requests after startup will be **cache misses**; latency is higher until Redis is warmed. Wait ~10 s after the stack is healthy before running the test if you want to measure cached performance.
- To isolate cold-cache behaviour, restart the public-service container between runs so Redis keys are evicted.
- To stream results into Prometheus/Grafana during the test, use the experimental Prometheus remote-write output:
  ```bash
  k6 run --out experimental-prometheus-rw load-test/load-test.js
  ```
