const dashboardService = require("../services/vendor.dashboard.service");

exports.getSummary = async (req, res) => {
  const data = await dashboardService.getVendorDashboardSummary(
    req.user.vendorId
  );
  res.json(data);
};

exports.getRevenue = async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const data = await dashboardService.getVendorRevenueByMonth(
    req.user.vendorId,
    year
  );
  res.json(data);
};

exports.getRecentActivity = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;

    const activity = await dashboardService.getVendorRecentActivity(vendorId);

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activity",
    });
  }
};
