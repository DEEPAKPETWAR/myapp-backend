// controllers/authController.js
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utility/generateToken");


exports.register = async (req, res) => {
  try {
    let { name, email, password, phone, address } = req.body;

    // Validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Normalize
    email = email.trim().toLowerCase();
    phone = phone.trim();

    // Check duplicate user
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with email or phone",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      phone,
      address: address?.trim() || "",
    });

    return res.status(201).json({
      success: true,
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

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
//  LOGIN
exports.login = async (req, res) => {
  try {
    let { email, phone, password } = req.body;

    // Validation
    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone and password are required",
      });
    }

    let user;

    // EMAIL LOGIN
    if (email) {
      email = email.trim().toLowerCase();

      user = await User.findOne({ email });
    }

    // PHONE LOGIN
    else {
      phone = phone.trim();

      user = await User.findOne({ phone });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    return res.status(200).json({
      success: true,
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

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
//  VERIFY OTP 
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (Date.now() > user.resetOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
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
// exports.updateProfile = async (req, res) => {
//   try {
//     const { name, phone, address } = req.body;

//     const user = await User.findById(req.userId);

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     // optional phone duplicate check
//     if (phone && phone !== user.phone) {
//       const exists = await User.findOne({
//         phone,
//       });

//       if (exists) {
//         return res.status(400).json({
//           message: "Phone already exists",
//         });
//       }
//     }

//     user.name = name || user.name;
//     user.phone = phone || user.phone;
//     user.address = address || user.address;

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Profile updated successfully",
//       user,
//     });

//   } catch (error) {
//     console.log("UPDATE ERROR:", error);

//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };
// exports.updateProfile = async (req, res) => {
//   try {
//     console.log("BODY:", req.body);
//     console.log("FILE:", req.file);
//     console.log("USER:", req.userId);

//     const user = await User.findById(
//       req.userId
//     );

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//       });
//     }

//     const { name, phone, address } =
//       req.body;

//     if (name) user.name = name;
//     if (phone) user.phone = phone;
//     if (address) user.address = address;

//     if (req.file) {
//       const BASE_URL =
//         `${req.protocol}://${req.get("host")}`;

//       user.profileImage =
//         `${BASE_URL}/uploads/${req.file.filename}`;
//     }

//     await user.save();

//     return res.status(200).json({
//       message: "Profile updated",
//       user,
//     });

//   } catch (error) {
//     console.log(
//       "🔥 UPDATE ERROR:",
//       error
//     );

//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// };
exports.updateProfile = async (
  req,
  res
) => {
  try {

    console.log("FILE:", req.file);

    const user =
      await User.findById(
        req.userId
      );

    if (!user) {
      return res.status(404).json({
        message:"User not found"
      });
    }

    user.name =
      req.body.name || user.name;

    user.phone =
      req.body.phone || user.phone;

    user.address =
      req.body.address || user.address;

    if (req.file) {

      user.profileImage =
      `https://myapp-backend-vtdw.onrender.com/uploads/${req.file.filename}`;

    }

    await user.save();

    res.json({
      success:true,
      user
    });

  } catch(error){

    console.log(error);

    res.status(500).json({
      message:error.message
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Check user
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate random 4-digit OTP
    const otp = Math.floor(
      1000 + Math.random() * 9000
    ).toString();

    // OTP expires in 5 mins
    const expiryTime = Date.now() + 5 * 60 * 1000;

    user.resetOtp = otp;
    user.resetOtpExpiry = expiryTime;

    await user.save();

    

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",

      
      otp,
    });

  } catch (error) {
    console.log("FORGOT PASSWORD ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};