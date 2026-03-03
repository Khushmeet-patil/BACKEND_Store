const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // ✅ security best practice
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    place: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["admin", "vendor", "customer"],
      default: "customer",
    },

    /* ================= PASSWORD FLOWS ================= */

    // 🔐 Vendor first-time set password
    setPasswordToken: {
      type: String,
    },

    setPasswordExpire: {
      type: Date,
    },

    // 🔁 Forgot password (all users)
    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema, "users");
