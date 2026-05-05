const router = require('express').Router();
const { generateBracket, getBracket, scheduleMatch } = require('./queries');

router.post('/bracket/generate', async (req, res) => {
  const { tournament_id = 1 } = req.body;
  try {
    const matches = await generateBracket(tournament_id);
    res.status(201).json({ matches });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/bracket', async (req, res) => {
  const tournament_id = req.query.tournament_id || 1;
  try {
    const matches = await getBracket(tournament_id);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/matches/:id/schedule', async (req, res) => {
  const { match_date, venue } = req.body;
  try {
    const match = await scheduleMatch(req.params.id, match_date, venue);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
