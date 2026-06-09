// controllers/otpController.js

const axios = require("axios");
const Otp = require("../model/Otp");

// SEND OTP
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // save OTP in MongoDB (5 min expiry)
    await Otp.findOneAndUpdate(
      { phone },
      {
        phone,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    console.log("OTP:", otp);

    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: `Your OTP is ${otp}`,
        language: "english",
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      success: true,
      message: "OTP sent",
      data: response.data,
    });

  } catch (err) {
    console.log("Send OTP Error:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: err.response?.data || err.message,
    });
  }
};



// VERIFY OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP required",
      });
    }

    const record = await Otp.findOne({ phone });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }

    // check expiry
    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ phone });

      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // check OTP match
    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // success → delete OTP
    await Otp.deleteOne({ phone });

    return res.json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (err) {
    console.log("Verify OTP Error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};