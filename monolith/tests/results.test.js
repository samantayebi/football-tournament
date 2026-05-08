const { determineWinner } = require('../utils/resultUtils');

describe('determineWinner', () => {
  const match = { team1_id: 10, team2_id: 20 };

  it('returns team1_id when score_team1 > score_team2', () => {
    expect(determineWinner(match, 3, 1)).toBe(10);
  });

  it('returns team2_id when score_team2 > score_team1', () => {
    expect(determineWinner(match, 0, 2)).toBe(20);
  });

  it('returns team1_id on a draw (tie goes to team1)', () => {
    expect(determineWinner(match, 1, 1)).toBe(10);
  });
});
