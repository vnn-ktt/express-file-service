const express = require('express');
const UserController = require('../controllers/user');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(AuthMiddleware.verifyToken);
router.get('/info', UserController.getInfo);
router.get('/logout', UserController.logout);
router.get('/logout/all', UserController.logoutAllDevices);

module.exports = router;