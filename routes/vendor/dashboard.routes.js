const express = require("express");
const router = express.Router();
const vendorDashboardController = require("../../controllers/vendor.dashboard.controller");

router.get("/dashboard", vendorDashboardController.getSummary);

router.get("/recent", vendorDashboardController.getRecentActivity);

module.exports = router;
