CREATE TABLE tournament (
  id     SERIAL PRIMARY KEY,
  name   VARCHAR(255),
  format VARCHAR(50) DEFAULT 'single-elimination',
  status VARCHAR(50) DEFAULT 'enrollment'
);

CREATE TABLE teams (
  id              SERIAL PRIMARY KEY,
  tournament_id   INT REFERENCES tournament(id),
  name            VARCHAR(255),
  contact_email   VARCHAR(255),
  status          VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE players (
  id           SERIAL PRIMARY KEY,
  team_id      INT REFERENCES teams(id),
  name         VARCHAR(255),
  shirt_number INT
);

CREATE TABLE matches (
  id            SERIAL PRIMARY KEY,
  tournament_id INT REFERENCES tournament(id),
  round         INT,
  team1_id      INT REFERENCES teams(id),
  team2_id      INT REFERENCES teams(id),
  score_team1   INT,
  score_team2   INT,
  winner_id     INT REFERENCES teams(id),
  match_date    TIMESTAMP,
  venue         VARCHAR(255),
  status        VARCHAR(50) DEFAULT 'scheduled'
);

CREATE TABLE reports (
  id         SERIAL PRIMARY KEY,
  match_id   INT REFERENCES matches(id),
  summary    TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
