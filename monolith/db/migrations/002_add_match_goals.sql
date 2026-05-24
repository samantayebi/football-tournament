CREATE TABLE IF NOT EXISTS match_goals (
  id         SERIAL PRIMARY KEY,
  match_id   INT REFERENCES matches(id),
  player_id  INT REFERENCES players(id),
  team_id    INT REFERENCES teams(id),
  minute     INT,
  created_at TIMESTAMP DEFAULT NOW()
);
