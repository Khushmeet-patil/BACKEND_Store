const Order = require("../models/Order");
const Product = require("../models/Product");
const Activity = require("../models/Activity");
const mongoose = require("mongoose");

exports.getVendorDashboardSummary = async (vendorId) => {
  const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

  const [totalOrders, pendingOrders, totalProducts, revenue] =
    await Promise.all([
      Order.countDocuments({ "items.vendorId": vendorObjectId }),
      Order.countDocuments({ 
        "items.vendorId": vendorObjectId, 
        orderStatus: "pending" 
      }),
      Product.countDocuments({ vendorId: vendorObjectId }),
      Order.aggregate([
        { $unwind: "$items" },
        { 
          $match: { 
            "items.vendorId": vendorObjectId, 
            orderStatus: "completed" 
          } 
        },
        { $group: { _id: null, total: { $sum: "$items.totalPrice" } } },
      ]),
    ]);

  return {
    revenue: {
      total: revenue[0]?.total || 0,
      change: 0, // Placeholder for future trend logic
    },
    orders: {
      total: totalOrders,
      change: 0, // Placeholder
    },
    products: {
      total: totalProducts,
    },
    pendingOrders,
    rating: 4.5, // Placeholder
  };
};

exports.getVendorRevenueByMonth = async (vendorId, year) => {
  const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

  return Order.aggregate([
    { $unwind: "$items" },
    {
      $match: {
        "items.vendorId": vendorObjectId,
        orderStatus: "completed",
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$items.totalPrice" },
      },
    },
    { $sort: { "_id": 1 } },
  ]);
};

exports.getVendorRecentActivity = async (vendorId, limit = 10) => {
  if (!vendorId) throw new Error("Vendor ID required");

  return Activity.find({
    role: "vendor",
    vendorId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

