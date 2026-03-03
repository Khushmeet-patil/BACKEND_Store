const { default: mongoose } = require("mongoose");
const Product = require("../models/Product");

exports.searchProducts = async ({
  keyword,
  categoryId,
  minPrice,
  maxPrice,
  page = 1,
  limit = 12,
}) => {
  const matchQuery = {
    status: true,
    "approval.status": "approved",
  };

  if (keyword && keyword.trim()) {
    matchQuery.$text = { $search: keyword.trim() };
  }

  if (categoryId) {
    matchQuery.category = new mongoose.Types.ObjectId(categoryId);
  }

  if (minPrice || maxPrice) {
    matchQuery["pricing.finalPrice"] = {};
    if (minPrice) matchQuery["pricing.finalPrice"].$gte = Number(minPrice);
    if (maxPrice) matchQuery["pricing.finalPrice"].$lte = Number(maxPrice);
  }

  const skip = (page - 1) * limit;

  const products = await Product.aggregate([
    { $match: matchQuery },

    ...(keyword
      ? [{ $addFields: { score: { $meta: "textScore" } } }]
      : []),

    ...(keyword
      ? [{ $sort: { score: -1 } }]
      : [{ $sort: { createdAt: -1 } }]),

    { $skip: skip },
    { $limit: limit },

    {
      $lookup: {
        from: "ratings",
        localField: "_id",
        foreignField: "productId",
        as: "ratings",
      },
    },

    {
      $addFields: {
        averageRating: { $avg: "$ratings.rating" },
        ratingCount: { $size: "$ratings" },
      },
    },

    { $project: { ratings: 0 } },
  ]);

  const countAgg = await Product.aggregate([
    { $match: matchQuery },
    { $count: "total" },
  ]);

  const total = countAgg[0]?.total || 0;

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};


exports.searchSuggestions = async (keyword) => {
  if (!keyword || keyword.length < 2) return [];

  return await Product.find({
    status: true,
    "approval.status": "approved",
    name: { $regex: keyword, $options: "i" },
  })
    .select("name slug images pricing.finalPrice")
    .limit(8);
};
