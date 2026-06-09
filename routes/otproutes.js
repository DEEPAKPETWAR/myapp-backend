// routes/otpRoutes.js

const express = require("express");
const router = express.Router();
const otpController = require("../controllers/otpControllers");

router.post("/send-otp", otpController.sendOTP);

router.post("/verify-otp", otpController.verifyOTP);

module.exports = router;