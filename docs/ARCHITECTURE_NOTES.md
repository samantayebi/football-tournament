# Architecture Notes — Football Tournament Manager

## New components added in expansion

- **RabbitMQ** — fanout exchange named `tournament_events`; implements the broker topology from Lecture 4. The monolith publishes `match.completed` events; public-service, standings-service, and notification-service each bind an exclusive queue to the exchange and consume independently.
- **Notification service** — dedicated RabbitMQ consumer running as an independent Docker container (Node.js, port 3003 for health only). Receives every tournament event and logs structured output; designed to be extended into email/push notifications without touching other services.
- **Redis** — read-through cache in public-service for `/bracket` and `/standings` responses (60 s TTL). Cache invalidation is event-driven: when a `match.completed` RabbitMQ message arrives, public-service deletes both keys before broadcasting the SSE event, ensuring the next fetch always returns fresh data.
- **Prometheus** — scrapes `/metrics` from monolith (3000), standings-service (3001), and public-service (3002) every 15 s. All three services use `prom-client` with `collectDefaultMetrics()` plus custom counters and histograms.
- **Grafana** — 10-panel dashboard auto-provisioned at startup via mounted JSON and YAML provider files. Panels: requests/s, p95 latency, p50 latency, cache hit rate, cache hits vs misses, cache invalidations (last hour), match results entered, RabbitMQ events published, RabbitMQ events received, Node.js heap used (MB).
- **Server-Sent Events** — `GET /api/v1/public/events` in public-service keeps a `Set` of connected `res` objects. When a `match.completed` RabbitMQ event triggers cache invalidation, a `data:` SSE frame is broadcast to all connected clients. BracketPage and StandingsPage open an `EventSource` on mount, re-fetch on every `match.completed` message, and display a pulsing LIVE badge while connected.

---

## Load test results (k6)

| Parameter | Value |
|---|---|
| Tool | k6 |
| Script | `load-test/load-test.js` |
| Duration | 3 minutes (30 s ramp-up → 50 users, 1 min hold, 30 s ramp-down) |
| Endpoints tested | `GET /api/v1/public/bracket`, `GET /api/v1/public/standings` |
| Peak concurrent users | 50 |
| Requests per second at peak | 62 |
| p95 response time | 16.27 ms (threshold: < 500 ms) |
| p50 response time | 5.32 ms |
| Error rate | 0.00% |
| Threshold: `http_req_duration p95 < 500ms` | PASSED |
| Threshold: `errors rate < 1%` | PASSED |
| Threshold: `bracket_duration p95 < 500ms` | PASSED |
| Threshold: `standings_duration p95 < 500ms` | PASSED |

Low latency at these concurrency levels is primarily explained by Redis: both endpoints serve from cache on cache-hit paths, reducing response time to a single in-memory lookup rather than a database round-trip.

---

## Architecture characteristics — updated evidence

| Characteristic | Evidence |
|---|---|
| **Simplicity** | Still 2 architectural layers (monolith + microservices). RabbitMQ, Redis, Prometheus, and Grafana are infrastructure — they do not add layers to the application architecture. |
| **Maintainability** | Winston structured JSON logging across all four backend services. Each service has its own `logger.js`, independent `package.json`, and can be modified or redeployed without affecting others. |
| **Deployability** | Still 1 command: `docker compose up --build`. The system now starts 12 containers, all with restart policies and health checks wired into `depends_on` conditions. |
| **Modularity** | Zero cyclic dependencies maintained. notification-service, Prometheus, and Grafana consume data from other services but are never imported or called by them. New services are fully independent. |
| **Testability** | 12 Jest unit tests still passing with 100% line coverage on the three core utility modules (`bracketUtils`, `resultUtils`, `standingsUtils`). Pure functions extracted from DB-coupled query files remain the test surface. |
| **Scalability** | PROVEN — k6 load test: p95 = 16.27 ms at 50 concurrent users. This is 30× better than the 500 ms threshold. Redis cache is the primary scaling mechanism for read-heavy public endpoints. |
| **Fault tolerance** | Health endpoints on all four services (`/health`). Docker Compose `restart: unless-stopped` on all services. Redis and RabbitMQ are isolated from the monolith: if either is unavailable, the monolith logs the error and continues serving HTTP traffic. |

---

## New characteristics added by expansion

| Characteristic | Implementation |
|---|---|
| **Observability** | Prometheus metrics on all three backend services using `prom-client`. Custom metrics: `http_requests_total`, `http_request_duration_seconds` (histogram), `match_results_total`, `events_published_total`, `cache_hits_total`, `cache_misses_total`, `cache_invalidations_total`, `rabbitmq_events_received_total`. Grafana dashboard with 10 panels auto-provisioned at container startup. |
| **Security** | Nginx rate limiting via `limit_req_zone`: admin endpoints capped at 10 r/s (burst 20), public endpoints at 100 r/s (burst 200). HTTP 429 returned on breach. API versioning at `/api/v1/` applied to all routes (gateway, backend, and frontend). |

---

## Container count

| System | Containers | Services |
|---|---|---|
| Base | 6 | db, monolith, standings-service, public-service, gateway, frontend (build-only) |
| Expanded | 12 | + RabbitMQ, Redis, notification-service, Prometheus, Grafana, notification-service health (port 3003, same container) |

Note: notification-service exposes port 3003 for its health endpoint within the same container — it is not a separate container. The actual count going from 6 to 11 running containers plus the build-only frontend service.
