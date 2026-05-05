const router = require('express').Router();
const { getReport, upsertReport } = require('./queries');

router.get('/reports/:matchId', async (req, res) => {
  try {
    const report = await getReport(req.params.matchId);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/reports/:matchId', async (req, res) => {
  const { summary } = req.body;
  try {
    const report = await upsertReport(req.params.matchId, summary);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
