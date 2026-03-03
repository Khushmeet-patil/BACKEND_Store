const express = require("express");
const router = express.Router();
const productController = require("../../controllers/product.controller");

router.get(
  "/all",
  productController.getProducts
);

// Approve product
router.post(
  "/:id/approve",
  productController.approveProduct
);

// Reject product
router.post(
  "/:id/reject",
  productController.rejectProduct
);

module.exports = router;