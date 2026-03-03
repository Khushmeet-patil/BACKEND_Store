const Order = require("../models/Order");
const Product = require("../models/Product");
const Activity = require("../models/Activity");

exports.getVendorDashboardSummary = async (vendorId) => {
  const [totalOrders, pendingOrders, totalProducts, revenue] =
    await Promise.all([
      Order.countDocuments({ vendorId }),
      Order.countDocuments({ vendorId, status: "pending" }),
      Product.countDocuments({ vendorId }),
      Order.aggregate([
        { $match: { vendorId, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),
    ]);

  return {
    totalRevenue: revenue[0]?.total || 0,
    totalOrders,
    totalProducts,
    pendingOrders,
  };
};

exports.getVendorRevenueByMonth = async (vendorId, year) => {
  return Order.aggregate([
    {
      $match: {
        vendorId,
        status: "completed",
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$finalAmount" },
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

