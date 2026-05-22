const express = require('express');
const { createTournament, getAllTournaments, getTournamentById, updateTournamentStatus } = require('./queries');

const router = express.Router();

router.post('/tournaments', async (req, res) => {
  const { name, format } = req.body;
  try {
    const tournament = await createTournament(name, format);
    res.status(201).json(tournament);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tournaments', async (req, res) => {
  try {
    res.json(await getAllTournaments());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tournaments/:id', async (req, res) => {
  try {
    const tournament = await getTournamentById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/tournaments/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const tournament = await updateTournamentStatus(req.params.id, status);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
