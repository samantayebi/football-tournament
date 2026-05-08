const { buildBracketPlan } = require('../utils/bracketUtils');

const FOUR_TEAMS = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

describe('buildBracketPlan – 4 teams', () => {
  let matches;

  beforeEach(() => {
    matches = buildBracketPlan(FOUR_TEAMS);
  });

  it('creates 3 matches in total', () => {
    expect(matches).toHaveLength(3);
  });

  it('creates 2 matches in round 1', () => {
    expect(matches.filter(m => m.round === 1)).toHaveLength(2);
  });

  it('assigns two teams to every round-1 match', () => {
    for (const m of matches.filter(m => m.round === 1)) {
      expect(m.team1_id).not.toBeNull();
      expect(m.team2_id).not.toBeNull();
    }
  });

  it('creates 1 match in round 2 with no teams assigned yet', () => {
    const round2 = matches.filter(m => m.round === 2);
    expect(round2).toHaveLength(1);
    expect(round2[0].team1_id).toBeNull();
    expect(round2[0].team2_id).toBeNull();
  });
});
