const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");

/* ======================================================
   🔹 SINGLE FILE UPLOAD
====================================================== */
router.post("/single", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const url = `${baseUrl}/api/uploads/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      url,
    });
  } catch (error) {
    console.error("Single upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
});

/* ======================================================
   🔹 MULTIPLE FILE UPLOAD
====================================================== */
router.post("/multiple", upload.array("files", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const urls = req.files.map(
      (file) => `${baseUrl}/api/uploads/${file.filename}`
    );

    return res.status(201).json({
      success: true,
      message: "Files uploaded successfully",
      urls,
    });
  } catch (error) {
    console.error("Multiple upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
});

module.exports = router;
