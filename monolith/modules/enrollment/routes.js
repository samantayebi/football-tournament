const router = require('express').Router();
const { createTeam, createPlayer, getAllTeams, updateTeamStatus } = require('./queries');

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
  try {
    const teams = await getAllTeams();
    res.json(teams);
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

module.exports = router;
