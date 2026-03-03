const mongoose = require("mongoose");

const vendorWalletSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      unique: true,
      required: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    totalEarned: {
      type: Number,
      default: 0,
    },

    totalWithdrawn: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VendorWallet", vendorWalletSchema);
