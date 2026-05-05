INSERT INTO tournament (name, status)
VALUES ('Test Tournament 2025', 'enrollment');

INSERT INTO teams (tournament_id, name, status)
VALUES
  (1, 'Team Alpha', 'approved'),
  (1, 'Team Beta',  'approved'),
  (1, 'Team Gamma', 'approved'),
  (1, 'Team Delta', 'approved');
