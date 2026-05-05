const router = require('express').Router();
const { setMatchResult } = require('./queries');

router.patch('/matches/:id/result', async (req, res) => {
  const { score_team1, score_team2 } = req.body;
  try {
    const match = await setMatchResult(req.params.id, score_team1, score_team2);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
