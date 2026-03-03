const { fetchAllWithdrawals, updateWithdrawalStatus, markWithdrawalPaid } = require("../../controllers/withdrawal.controller")

const router = require("express").Router()

router.get("/view", fetchAllWithdrawals)

router.put("/:id/update", updateWithdrawalStatus)

router.post("/:id/paid", markWithdrawalPaid)

module.exports = router