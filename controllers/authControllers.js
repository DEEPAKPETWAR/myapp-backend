// controllers/authController.js
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utility/generateToken");


// REGISTER 
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
     email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone,
      address,
    });

    res.json({
      message: "Registered successfully",
      token: generateToken(user._id),
    });

  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


//  LOGIN
exports.login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    console.log("BODY:", req.body);

    let user = null;

    // LOGIN WITH EMAIL
    if (email) {
      user = await User.findOne({
        email: email.trim().toLowerCase(),
      });
    }

    // LOGIN WITH PHONE
    else if (phone) {
      user = await User.findOne({
        phone: phone.trim(),
      });
    }

    // USER NOT FOUND
    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // PASSWORD CHECK
    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    // SUCCESS
    res.json({
      message: "Login success",
      token: generateToken(user._id),

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};


//  VERIFY OTP 
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });

    if (!user || user.resetOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({ message: "OTP verified" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//  RESET PASSWORD 
exports.resetPassword = async (req, res) => {
  try {
    const { phone, newPassword } = req.body;

    if (!phone || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// DELETE PROFILE 
exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.userId);

    res.json({ message: "User deleted successfully" });

  } catch (error) {
    console.log("DELETE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//  UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    console.log("USER ID:", req.userId);

    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, phone, address } = req.body;

    user.name = name;
    user.phone = phone;
    user.address = address;

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.log("UPDATE ERROR:", err);
    return res.status(500).json({
      message: err.message || "Something went wrong",
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Example OTP
    const otp = "1234";

    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    res.json({
      message: "OTP sent successfully",
      otp,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};