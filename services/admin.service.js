const Order = require("../models/Order");
const User = require("../models/User");
const { getMonthRanges } = require("../utils/dateRanges");
const { calcChange } = require("../utils/calcPercentage");
const Activity = require("../models/Activity");

exports.getAdminEmails = async () => {
  const admins = await User.find(
    { role: "admin" }
  );

  return admins.map((admin) => admin.email);
};

exports.getAdminDashboardStats = async () => {
  const { startOfCurrentMonth, startOfPreviousMonth, endOfPreviousMonth } =
    getMonthRanges();

  /* ================= TOTAL ORDERS ================= */

  const currentOrders = await Order.countDocuments({
    createdAt: { $gte: startOfCurrentMonth },
  });

  const previousOrders = await Order.countDocuments({
    createdAt: {
      $gte: startOfPreviousMonth,
      $lte: endOfPreviousMonth,
    },
  });

  /* ================= REVENUE ================= */

  const currentRevenueAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: startOfCurrentMonth } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  const previousRevenueAgg = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfPreviousMonth,
          $lte: endOfPreviousMonth,
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);

  const currentRevenue = currentRevenueAgg[0]?.total || 0;
  const previousRevenue = previousRevenueAgg[0]?.total || 0;

  /* ================= USERS ================= */

  const totalVendors = await User.countDocuments({ role: "vendor" });
  const totalCustomers = await User.countDocuments({ role: "customer" });

  return {
    orders: {
      total: currentOrders,
      change: calcChange(currentOrders, previousOrders),
    },
    revenue: {
      total: currentRevenue,
      change: calcChange(currentRevenue, previousRevenue),
    },
    vendors: totalVendors,
    customers: totalCustomers,
  };
};

exports.getAdminRecentActivity = async (limit = 15) => {
  return Activity.find({ role: "admin" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("vendorId", "storeName")
    .populate("userId", "email")
    .lean();
};
