function calculateStandings(matches) {
  const map = {};

  for (const match of matches) {
    if (match.status !== 'completed') continue;

    const { team1_id, team2_id, score_team1, score_team2, winner_id } = match;

    for (const id of [team1_id, team2_id]) {
      if (!map[id]) map[id] = { team_id: id, wins: 0, losses: 0, goals_scored: 0, goals_conceded: 0 };
    }

    map[team1_id].goals_scored  += score_team1;
    map[team1_id].goals_conceded += score_team2;
    map[team2_id].goals_scored  += score_team2;
    map[team2_id].goals_conceded += score_team1;

    map[winner_id].wins += 1;
    const loser_id = winner_id === team1_id ? team2_id : team1_id;
    map[loser_id].losses += 1;
  }

  return Object.values(map);
}

module.exports = { calculateStandings };
