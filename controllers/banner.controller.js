const bannerService = require("../services/banner.service");

/* ================= CREATE ================= */
exports.createBanner = async (req, res) => {
  try {
    const banner = await bannerService.createBanner(req.body);
    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET ALL (Admin) ================= */
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await bannerService.getAllBanners();
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch banners",
    });
  }
};

/* ================= GET ACTIVE (Public) ================= */
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await bannerService.getActiveBanners();
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active banners",
    });
  }
};

/* ================= UPDATE ================= */
exports.updateBanner = async (req, res) => {
  try {
    const banner = await bannerService.updateBanner(
      req.params.id,
      req.body
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= DELETE ================= */
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await bannerService.deleteBanner(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete banner",
    });
  }
};
