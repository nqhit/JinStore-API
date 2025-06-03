const express = require('express');
const router = express.Router();
const mobileController = require('../../controllers/Mobile/auth.controller');

router.post('/register', mobileController.register);
router.post('/login', mobileController.login);
router.post('/refresh', mobileController.refresh);
router.post('/logout', mobileController.logout);
router.post('/google-login', mobileController.loginWithGoogle);

module.exports = router;
