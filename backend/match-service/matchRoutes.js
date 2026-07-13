const express = require('express');
const router = express.Router();
const matchController = require('./matchController');

router.post('/', matchController.createMatch); // Inizia una nuova partita
router.get('/', matchController.getMatches); // Ottieni tutte le partite
router.get('/:id', matchController.getMatchById); // Ottieni una partita specifica
router.post('/event', matchController.addEventToMatch); // Aggiungi un evento manuale
router.post('/end', matchController.endMatch); // Termina una partita

module.exports = router;