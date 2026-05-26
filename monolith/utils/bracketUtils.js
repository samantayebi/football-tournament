function buildBracketPlan(teams) {
  const matches = [];

  for (let i = 0; i < teams.length; i += 2) {
    matches.push({ round: 1, team1_id: teams[i].id, team2_id: teams[i + 1]?.id ?? null });
  }

  let prevCount = Math.ceil(teams.length / 2);
  let round = 2;
  while (prevCount > 1) {
    const nextCount = Math.ceil(prevCount / 2);
    for (let i = 0; i < nextCount; i++) {
      matches.push({ round, team1_id: null, team2_id: null });
    }
    prevCount = nextCount;
    round++;
  }

  return matches;
}

// Standard seeded pairing: seed 1 vs seed N, seed 2 vs seed N-1, etc.
function buildSeededBracket(teams) {
  const matches = [];
  const n = teams.length;

  for (let i = 0; i < Math.ceil(n / 2); i++) {
    const opponentIdx = n - 1 - i;
    const team2_id = opponentIdx > i ? teams[opponentIdx].id : null;
    matches.push({ round: 1, team1_id: teams[i].id, team2_id });
  }

  let prevCount = Math.ceil(n / 2);
  let round = 2;
  while (prevCount > 1) {
    const nextCount = Math.ceil(prevCount / 2);
    for (let i = 0; i < nextCount; i++) {
      matches.push({ round, team1_id: null, team2_id: null });
    }
    prevCount = nextCount;
    round++;
  }

  return matches;
}

module.exports = { buildBracketPlan, buildSeededBracket };
