const { calculateStandings } = require('../utils/standingsUtils');

// Two completed matches:
//   Match 1: team 1 beats team 2  (3-1)
//   Match 2: team 2 beats team 3  (2-2, winner_id forced to team 2)
const MATCHES = [
  { status: 'completed', team1_id: 1, team2_id: 2, score_team1: 3, score_team2: 1, winner_id: 1 },
  { status: 'completed', team1_id: 2, team2_id: 3, score_team1: 2, score_team2: 2, winner_id: 2 },
];

describe('calculateStandings', () => {
  let standings;

  beforeEach(() => {
    standings = calculateStandings(MATCHES);
  });

  const find = (s, id) => s.find(row => row.team_id === id);

  it('counts wins correctly', () => {
    expect(find(standings, 1).wins).toBe(1);
    expect(find(standings, 2).wins).toBe(1);
    expect(find(standings, 3).wins).toBe(0);
  });

  it('counts losses correctly', () => {
    expect(find(standings, 1).losses).toBe(0);
    expect(find(standings, 2).losses).toBe(1);
    expect(find(standings, 3).losses).toBe(1);
  });

  it('counts goals_scored correctly', () => {
    expect(find(standings, 1).goals_scored).toBe(3);  // match1 only
    expect(find(standings, 2).goals_scored).toBe(3);  // 1 (match1) + 2 (match2)
    expect(find(standings, 3).goals_scored).toBe(2);  // match2 only
  });

  it('counts goals_conceded correctly', () => {
    expect(find(standings, 1).goals_conceded).toBe(1);  // match1 only
    expect(find(standings, 2).goals_conceded).toBe(5);  // 3 (match1) + 2 (match2)
    expect(find(standings, 3).goals_conceded).toBe(2);  // match2 only
  });

  it('ignores scheduled (non-completed) matches', () => {
    const withScheduled = [
      ...MATCHES,
      { status: 'scheduled', team1_id: 1, team2_id: 3, score_team1: null, score_team2: null, winner_id: null },
    ];
    const s = calculateStandings(withScheduled);
    expect(find(s, 1).wins).toBe(1);
  });
});
