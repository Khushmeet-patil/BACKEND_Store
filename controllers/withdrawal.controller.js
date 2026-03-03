const withdrawalService = require("../services/withdrawal.service");

/* ======================================================
   FETCH WITHDRAWAL REQUEST
====================================================== */
exports.fetchAllWithdrawals = async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;

    const result = await withdrawalService.getAllWithdrawals({
      page: Number(page),
      limit: Number(limit),
      status,
      search,
    });

    res.status(200).json({
      success: true,
      message: "Withdrawals fetched successfully",
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   VENDOR CREATE REQUEST
====================================================== */
exports.requestWithdrawal = async (req, res) => {
  try {
    const vendorId = req.user.vendorId;
    const { amount } = req.body;

    const withdrawal = await withdrawalService.requestWithdrawal({
      vendorId,
      amount,
    });

    res.json({
      success: true,
      message: "Withdrawal request submitted",
      withdrawal,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   ADMIN APPROVE / REJECT
====================================================== */
exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const withdrawalId = req.params.id;
    const { status, adminRemark } = req.body;
    
    const result = await withdrawalService.updateWithdrawalStatus({
      withdrawalId,
      status,
      adminRemark,
    });

    res.json({
      success: true,
      message: `Withdrawal ${status}`,
      withdrawal: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   ADMIN MARK AS PAID
====================================================== */
exports.markWithdrawalPaid = async (req, res) => {
  try {
    const withdrawalId = req.params.id;
    const { paymentProof } = req.body;

    const result = await withdrawalService.markAsPaid({
      withdrawalId,
      paymentProof,
    });

    res.json({
      success: true,
      message: "Payment marked as successful",
      withdrawal: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
