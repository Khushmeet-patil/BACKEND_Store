const { requestWithdrawal } = require("../../controllers/withdrawal.controller");

const router = require("express").Router();

router.post("/request", requestWithdrawal);

router.get("/view", requestWithdrawal);

module.exports = router;
