// Ties go to team1 (consistent with setMatchResult using >=)
function determineWinner(match, score_team1, score_team2) {
  return score_team1 >= score_team2 ? match.team1_id : match.team2_id;
}

module.exports = { determineWinner };
