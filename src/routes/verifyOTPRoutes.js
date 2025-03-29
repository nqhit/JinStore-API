const express = require('express');
const { sendOTPEmail, verifyOTP } = require('../controllers/verifyOTPController');

const router = express.Router();

router.post('/send-otp', sendOTPEmail);
router.post('/verify-otp', verifyOTP);

module.exports = router;
