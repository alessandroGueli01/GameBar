const express = require('express');
const router = express.Router();
const userController = require('./userController');
const auth = require('./auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/me', auth, userController.getMe);

module.exports = router;