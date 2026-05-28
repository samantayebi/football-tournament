CREATE TABLE IF NOT EXISTS match_commentary (
  id         SERIAL PRIMARY KEY,
  match_id   INT REFERENCES matches(id),
  minute     INT,
  text       TEXT NOT NULL,
  type       VARCHAR(50) DEFAULT 'comment',
  created_at TIMESTAMP DEFAULT NOW()
);
-- type values: 'comment', 'goal', 'yellow_card', 'red_card', 'substitution', 'info'
