const express = require('express');
const AuthController = require('../controllers/auth');

const router = express.Router();

router.post('/signup', AuthController.signUp);
router.post('/signin', AuthController.signIn);

module.exports = router;