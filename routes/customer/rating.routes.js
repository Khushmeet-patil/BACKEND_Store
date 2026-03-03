const express = require("express");
const router = express.Router();

const ratingController = require("../../controllers/rating.controller");

router.post(
  "/",
  ratingController.addRating
);

module.exports = router;
