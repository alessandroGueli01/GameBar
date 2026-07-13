const express = require('express');
const router = express.Router();
const gameController = require('./gameController');

// Rotte Location
router.post('/locations', gameController.createLocation);
router.get('/locations', gameController.getLocations);

// Rotte Game
router.post('/', gameController.createGame);
router.get('/', gameController.getGames);
router.get('/:id', gameController.getGameById);
router.patch('/:id/status', gameController.updateGameStatus);

module.exports = router;