const express = require('express');
const router = express.Router();
const tournamentController = require('./tournamentController');

router.post('/', tournamentController.createTournament);
router.get('/', tournamentController.getTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.put('/:id', tournamentController.updateTournament);
router.delete('/:id', tournamentController.deleteTournament);

router.post('/:id/join', tournamentController.joinTournament);
router.post('/:id/leave', tournamentController.leaveTournament); // Cancellazione da torneo
router.post('/:id/end', tournamentController.endTournament); // Per finalizzare e calcolare la classifica

module.exports = router;