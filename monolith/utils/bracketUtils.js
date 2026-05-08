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

module.exports = { buildBracketPlan };
