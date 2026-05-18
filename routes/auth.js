const express = require("express");
const router = express.Router();

const authController = require("../controllers/authControllers");

const {
  getProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/authControllers");
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authController.register);

router.post("/login", authController.login);

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

router.put("/update-profile", upload.single("profileImage"), updateProfile);

router.delete(
  "/delete-profile",
  authMiddleware,
  deleteProfile
);

router.post(
  "/forgot-password",
  authController.forgotPassword
);

router.post(
  "/verify-otp",
  authController.verifyOtp
);

router.post(
  "/reset-password",
  authController.resetPassword
);

module.exports = router;