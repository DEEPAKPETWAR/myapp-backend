// controllers/authController.js
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utility/generateToken");


exports.register = async (req, res) => {
  try {
    let { name, email, password, phone, address } =
      req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    // Normalize values
    email = email.trim().toLowerCase();
    phone = phone.trim();

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "User already exists with email or phone",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
    });

    res.status(201).json({
      message: "Registration successful",
      token: generateToken(user._id),

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      },
    });

  } catch (error) {
    console.log("REGISTER ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
//  LOGIN
exports.login = async (req, res) => {
  try {
    let { email, phone, password } = req.body;

    let user = null;

    // Login with email
    if (email) {
      email = email.trim().toLowerCase();

      user = await User.findOne({
        email,
      });
    }

    // Login with phone
    else if (phone) {
      phone = phone.trim();

      user = await User.findOne({
        phone,
      });
    }

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
      },
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error);

    res.status(500).json({
      message: "Server error",
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
// 
exports.updateProfile = async (
  req,
  res
) => {
  try {

    const {
      name,
      phone,
      address
    } = req.body;

    const user =
      await User.findById(
        req.userId
      );

    if (!user) {
      return res
        .status(404)
        .json({
          message:
            "User not found"
        });
    }

    user.name =
      name || user.name;

    user.phone =
      phone || user.phone;

    user.address =
      address ||
      user.address;

    // save image url
    if (req.file) {
  user.profileImage = `https://myapp-backend-vtdw.onrender.com/uploads/${req.file.filename}`;
}

    await user.save();

    res.json({
      success:true,
      user
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message:
      "Update failed"
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