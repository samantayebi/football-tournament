const router = require('express').Router();
const { createTeam, createPlayer, getAllTeams, updateTeamStatus, updateTeamSeed, updateTeamLogo } = require('./queries');
const { upload } = require('../../middleware/upload');

router.post('/enrollment', async (req, res) => {
  const { tournament_id = 1, name, contact_email, players = [] } = req.body;
  try {
    const team = await createTeam(tournament_id, name, contact_email);
    const createdPlayers = await Promise.all(
      players.map(p => createPlayer(team.id, p.name, p.shirt_number))
    );
    res.status(201).json({ team, players: createdPlayers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/enrollment', async (req, res) => {
  const tournament_id = req.query.tournament_id || 1;
  try {
    res.json(await getAllTeams(tournament_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/enrollment/:id', async (req, res) => {
  const { status } = req.body;
  try {
    const team = await updateTeamStatus(req.params.id, status);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/enrollment/:id/seed', async (req, res) => {
  const { seed } = req.body;
  try {
    const team = await updateTeamSeed(req.params.id, seed ?? null);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/enrollment/:id/logo', (req, res, next) => {
  upload.single('logo')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const logoUrl = `/uploads/${req.file.filename}`;
  try {
    const team = await updateTeamLogo(req.params.id, logoUrl);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
