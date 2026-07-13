const express = require('express');
const router = express.Router();
const statisticsController = require('./statisticsController');

router.get('/leaderboard', statisticsController.getLeaderboard);
router.get('/user/:userId', statisticsController.getUserStats);
router.post('/update', statisticsController.processMatchResult);

module.exports = router;