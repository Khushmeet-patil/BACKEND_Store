const express = require("express");
const router = express.Router();
const { submitReturnRequest, submitReportIssue } = require("../../controllers/customer.support.controller");

router.post("/return", submitReturnRequest);
router.post("/report", submitReportIssue);

module.exports = router;
