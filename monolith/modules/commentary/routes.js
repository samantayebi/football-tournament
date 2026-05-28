const router = require('express').Router();
const { addComment } = require('./queries');

router.post('/matches/:matchId/commentary', async (req, res) => {
  const { minute, text, type = 'comment' } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });
  try {
    const comment = await addComment(req.params.matchId, minute ?? null, text.trim(), type);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
