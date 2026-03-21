const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

/* ================= ADD TO WISHLIST ================= */
exports.addToWishlist = async (userId, productId) => {
  // check product visibility
  const product = await Product.findOne({
    _id: productId,
    status: true,
    "approval.status": "approved",
  });

  if (!product) {
    throw new Error("Product not available");
  }

  return await Wishlist.create({
    userId,
    productId,
  });
};

/* ================= REMOVE FROM WISHLIST ================= */
exports.removeFromWishlist = async (userId, productId) => {
  return await Wishlist.findOneAndDelete({
    userId,
    productId,
  });
};

/* ================= TOGGLE WISHLIST ================= */
exports.toggleWishlist = async (userId, productId) => {
  const exists = await Wishlist.findOne({ userId, productId });

  if (exists) {
    await exists.deleteOne();
    return { isWishlisted: false };
  }

  await Wishlist.create({ userId, productId });
  return { isWishlisted: true };
};

/* ================= GET USER WISHLIST ================= */
exports.getWishlist = async (userId) => {
  return await Wishlist.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },

    /* 🔗 Join products */
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "productId",
      },
    },
    { $unwind: "$productId" },

    /* 🔐 Only visible products */
    {
      $match: {
        "productId.status": true,
        "productId.approval.status": "approved",
      },
    },

    /* ⭐ Ratings */
    {
      $lookup: {
        from: "ratings",
        localField: "productId._id",
        foreignField: "productId",
        as: "ratings",
      },
    },

    {
      $addFields: {
        "productId.averageRating": { $avg: "$ratings.rating" },
        "productId.ratingCount": { $size: "$ratings" },
      },
    },

    {
      $project: {
        ratings: 0,
      },
    },

    { $sort: { createdAt: -1 } },
  ]);
};
