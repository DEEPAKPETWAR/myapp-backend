// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: { type: String, unique: true },
    address: String,

    resetOtp: String,
    resetOtpExpiry: Date,
    profileImage: {
  type: String,
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);