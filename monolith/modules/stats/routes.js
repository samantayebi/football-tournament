const router = require('express').Router();
const { addGoal, getMatchGoals } = require('./queries');

router.post('/matches/:matchId/goals', async (req, res) => {
  const { player_id, team_id, minute } = req.body;
  try {
    const goal = await addGoal(req.params.matchId, player_id, team_id, minute ?? null);
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/matches/:matchId/goals', async (req, res) => {
  try {
    res.json(await getMatchGoals(req.params.matchId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
