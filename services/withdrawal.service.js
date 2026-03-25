const Withdrawal = require("../models/Withdrawal");
const VendorWallet = require("../models/VendorWallet");
const Vendor = require("../models/Vendor");
const {
  withdrawalRejectedTemplate,
} = require("../utils/email/templates/withdrawalRejectionTemplate");
const {
  withdrawalApprovedTemplate,
} = require("../utils/email/templates/withdrawalApprovalTemplate");
const EMAIL_SUBJECTS = require("../constants/emailSubjects");
const sendEmail = require("../utils/email/sendEmail");
const {
  withdrawalPaidTemplate,
} = require("../utils/email/templates/withdrawalPaidTemplate");

/* ======================================================
   ADMIN FETCH WITHDRAWAL REQUEST
====================================================== */
exports.getAllWithdrawals = async ({
  page = 1,
  limit = 20,
  status = null,
  search = "",
}) => {
  const skip = (page - 1) * limit;

  const match = {};

  // 🔍 Filter by status
  if (status) {
    match.status = status;
  }

  // 🔍 Search vendor (name/email)
  let vendorIds = [];
  if (search) {
    const vendors = await Vendor.find({
      $or: [
        { businessName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    vendorIds = vendors.map((v) => v._id);
    match.vendorId = { $in: vendorIds };
  }

  const [data, total] = await Promise.all([
    Withdrawal.find(match)
      .populate("vendorId", "businessName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Withdrawal.countDocuments(match),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* ======================================================
   VENDOR REQUEST WITHDRAWAL
====================================================== */
exports.requestWithdrawal = async ({ vendorId, amount }) => {
  if (amount <= 0) throw new Error("Invalid withdrawal amount");

  const wallet = await VendorWallet.findOne({ vendorId });
  if (!wallet) throw new Error("Wallet not found");

  if (wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  // 🚫 Check if pending withdrawal already exists
  const existingPending = await Withdrawal.findOne({
    vendorId,
    status: "pending",
  });

  if (existingPending) {
    throw new Error(
      "You already have a pending withdrawal request. Please wait for admin action."
    );
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new Error("Vendor not found");

  const withdrawal = await Withdrawal.create({
    vendorId,
    amount,
    bankDetails: {
      accountHolderName: vendor.bankAccountName,
      accountNumber: vendor.bankAccountNumber,
      ifsc: vendor.bankIFSCCode,
      bankName: vendor.bankName,
    },
    status: "pending",
  });

  return withdrawal;
};

/* ======================================================
   ADMIN APPROVE / REJECT
====================================================== */
exports.updateWithdrawalStatus = async ({
  withdrawalId,
  status,
  adminRemark,
}) => {
  const withdrawal = await Withdrawal.findById(withdrawalId);
  if (!withdrawal) throw new Error("Withdrawal request not found");

  if (!["approved", "rejected"].includes(status)) {
    throw new Error("Invalid status");
  }

  if (status === "rejected" && !adminRemark) {
    throw new Error("Rejection reason is required");
  }

  const vendor = await Vendor.findById(withdrawal.vendorId);
  if (!vendor) throw new Error("Vendor not found");

  // ================= UPDATE STATUS =================
  withdrawal.status = status;
  withdrawal.adminRemark = adminRemark || null;
  withdrawal.approvedAt = status === "approved" ? new Date() : null;

  await withdrawal.save();

  // ================= SEND EMAIL =================
  if (status === "approved") {
    try {
      await sendEmail({
        to: vendor.storeEmail,
        subject: EMAIL_SUBJECTS.VENDOR_WITHDRAWAL_APPROVED,
        html: withdrawalApprovedTemplate({
          vendorName: vendor.storeName,
          amount: withdrawal.amount,
          withdrawalId: withdrawal._id,
          approvedDate: new Date(withdrawal.approvedAt).toDateString(),
          platformName: "Astro Marketplace",
          supportEmail: "support@astromarketplace.com",
          year: new Date().getFullYear(),
        }),
      });
    } catch (emailError) {
      logger.error("Withdrawal approval email failed to send", {
        withdrawalId: withdrawal._id,
        vendorEmail: vendor.storeEmail,
        error: emailError.message,
      });
    }
  }

  if (status === "rejected") {
    try {
      await sendEmail({
        to: vendor.storeEmail,
        subject: EMAIL_SUBJECTS.VENDOR_WITHDRAWAL_REJECTED,
        html: withdrawalRejectedTemplate({
          vendorName: vendor.storeName,
          amount: withdrawal.amount,
          withdrawalId: withdrawal._id,
          adminRemark,
          platformName: "Astro Marketplace",
          supportEmail: "support@astromarketplace.com",
          year: new Date().getFullYear(),
        }),
      });
    } catch (emailError) {
      logger.error("Withdrawal rejection email failed to send", {
        withdrawalId: withdrawal._id,
        vendorEmail: vendor.storeEmail,
        error: emailError.message,
      });
    }
  }

  return withdrawal;
};

/* ======================================================
   ADMIN MARK AS PAID
====================================================== */
exports.markAsPaid = async ({ withdrawalId, paymentProof }) => {
  if (!paymentProof) throw new Error("Payment proof required");

  const withdrawal = await Withdrawal.findById(withdrawalId);
  if (!withdrawal) throw new Error("Withdrawal not found");

  if (withdrawal.status !== "approved") {
    throw new Error("Only approved withdrawals can be paid");
  }

  // ⏱ 24 hours rule
  const hoursDiff =
    (Date.now() - new Date(withdrawal.approvedAt).getTime()) / 36e5;

  if (hoursDiff > 24) {
    throw new Error("Payment window expired (24 hours)");
  }

  const wallet = await VendorWallet.findOne({
    vendorId: withdrawal.vendorId,
  });
  if (!wallet) throw new Error("Vendor wallet not found");

  if (wallet.balance < withdrawal.amount) {
    throw new Error("Insufficient wallet balance");
  }

  const vendor = await Vendor.findById(withdrawal.vendorId);
  if (!vendor) throw new Error("Vendor not found");

  // ================= WALLET UPDATE =================
  wallet.balance -= withdrawal.amount;
  wallet.totalWithdrawn += withdrawal.amount;
  await wallet.save();

  // ================= WITHDRAWAL UPDATE =================
  withdrawal.status = "paid";
  withdrawal.paymentProof = paymentProof;
  withdrawal.paidAt = new Date();
  await withdrawal.save();

  // ================= SEND EMAIL =================
  try {
    await sendEmail({
      to: vendor.storeEmail,
      subject: EMAIL_SUBJECTS.VENDOR_WITHDRAWAL_PAID,
      html: withdrawalPaidTemplate({
        vendorName: vendor.storeName,
        amount: withdrawal.amount,
        withdrawalId: withdrawal._id,
        paidDate: new Date(withdrawal.paidAt).toDateString(),
        platformName: "Astro Marketplace",
        supportEmail: "support@astromarketplace.com",
        year: new Date().getFullYear(),
      }),
    });
  } catch (emailError) {
    logger.error("Withdrawal paid email failed to send", {
      withdrawalId: withdrawal._id,
      vendorEmail: vendor.storeEmail,
      error: emailError.message,
    });
  }

  return withdrawal;
};
