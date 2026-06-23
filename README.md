# Football Tournament Manager

Software Architectures — Ca' Foscari University of Venice   
Live: http://tournament.samyland.com

---

A web platform for organizing single-elimination football tournaments. The organizer manages enrollment, generates the bracket, and enters results. The public can follow the tournament in real time without logging in.

---

## Architecture

The system uses three architectural styles combined:

The write side is a modular monolith. All admin operations (enrollment, bracket generation, result entry, reports) run in one Node.js process organized into 7 domain modules. Each module owns its own routes and database queries. A change to one feature touches only that module.

The read side uses service-based architecture. Two separate services (standings-service and public-service) handle read requests. They share the same PostgreSQL database as the monolith — no distributed transactions needed.

Async communication between the monolith and the services goes through RabbitMQ. When a result is entered, the monolith publishes a match.completed event to a fanout exchange. Three consumers react independently: public-service invalidates the Redis cache and notifies browsers via SSE, standings-service logs a recalculation trigger, and notification-service logs the event.

### Components

The system runs 11 Docker containers:

- monolith (`monolith/`) — 7 domain modules, JWT auth, RabbitMQ publishing
- standings-service (`standings-service/`) — team statistics, RabbitMQ consumer
- public-service (`public-service/`) — public bracket and standings, Redis cache, SSE
- notification-service (`notification-service/`) — event logging
- gateway (`gateway/nginx.conf`) — Nginx, routes all traffic, rate limiting
- db (`monolith/db/schema.sql`) — PostgreSQL 16, shared by all backend services
- rabbitmq — fanout exchange `tournament_events`
- redis — read-through cache for bracket and standings
- prometheus (`monitoring/prometheus.yml`) — scrapes /metrics from 3 services
- grafana (`monitoring/grafana-dashboard.json`) — 10-panel live dashboard
- frontend (`frontend/src/`) — React 18 single-page app

### Domain modules inside the monolith

- enrollment (`monolith/modules/enrollment/`) — team registration, approval, roster, seed, logo
- bracket (`monolith/modules/bracket/`) — bracket generation, match scheduling
- results (`monolith/modules/results/`) — score entry, winner determination, bracket advancement
- reports (`monolith/modules/reports/`) — auto-generated match reports
- tournament (`monolith/modules/tournament/`) — tournament CRUD, stats, archive
- stats (`monolith/modules/stats/`) — goal tracking, top scorers leaderboard
- commentary (`monolith/modules/commentary/`) — live match commentary

### Database

8 tables in `monolith/db/schema.sql`: tournament, teams, players, matches, reports, match_goals, match_commentary.

Every table is scoped by tournament_id so multiple tournaments can coexist.

---

## How to run

You need Docker Desktop, Node.js 20 or newer, and Git installed.

```bash
git clone https://github.com/samantayebi/football-tournament.git
cd football-tournament
cp .env.example .env
cd frontend && npm install && npm run build && cd ..
docker compose up --build
```

Wait until you see `Monolith listening on port 3000` and `Configuration complete; ready for start up` in the logs, then open http://localhost.

Admin login: username `admin`, password `admin123`.

### Other URLs

- http://localhost/api-docs — interactive API documentation (16 endpoints)
- http://localhost:3100 — Grafana dashboard (admin / admin123)
- http://localhost:9090 — Prometheus
- http://localhost:15672 — RabbitMQ management (admin / password)
- http://localhost/health/monolith/ — health check (also /health/standings/, /health/public/, /health/notification/)

---

## Tests

```bash
# Unit tests
cd monolith && npm install && npm test
# 12 tests, 100% line coverage on bracketUtils.js, resultUtils.js, standingsUtils.js

# Load test (requires k6 — brew install k6 on macOS)
k6 run load-test/load-test.js
# Result: p95 = 16.27ms at 50 concurrent users, 0% error rate
```

---

## Architecture characteristics

9 characteristics were defined in Task 2, each with a measurable target:

- Simplicity — max 2 architectural layers. Verified: monolith (write) + services (read).
- Maintainability — a feature change touches at most 1 module. Verified across 15 feature additions.
- Deployability — 1-command start. Verified: `docker compose up --build` on macOS and Ubuntu.
- Modularity — zero cyclic dependencies. Verified: ESLint passes on all modules.
- Testability — at least 60% coverage on core logic. Result: 100% on 3 modules.
- Scalability — p95 under 500ms at 50 concurrent users. Result: p95 = 16.27ms.
- Fault tolerance — monolith survives service crash. Verified: restart:unless-stopped, health endpoints.
- Observability — all services expose /metrics, Grafana shows live data. Verified.
- Security — JWT on admin routes, rate limiting on all routes. Verified.

---

## Reports

All task reports are included in the `project/` folder inside the project.

---

## Project structure

```
football-tournament/
├── monolith/
│   ├── modules/          7 domain modules
│   ├── middleware/        auth, upload, metrics
│   ├── utils/             logger, metrics, eventPublisher, bracketUtils
│   └── db/                schema.sql, migrations/
├── standings-service/
├── public-service/
├── notification-service/
├── frontend/src/
│   ├── pages/admin/       Tournaments, Enrollment, BracketAdmin, Results, Commentary
│   ├── pages/public/      Landing, Bracket, Standings, TopScorers, History, Report
│   └── context/           AuthContext, TournamentContext
├── gateway/nginx.conf
├── monitoring/            prometheus.yml, grafana configs
├── load-test/load-test.js
├── docs/                  all task reports and the final report (PDF)
├── docker-compose.yml
└── .env.example
```
