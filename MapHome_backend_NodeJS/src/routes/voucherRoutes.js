const express = require("express");
const router = express.Router();
const {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
  getPromotedVouchers,
  saveVoucher,
  unsaveVoucher,
  getSavedVouchers,
  bulkCreateVouchers,
} = require("../controllers/voucherController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const protect = authMiddleware;
const admin = requireRole("admin");

// Routes
router.post("/bulk", protect, admin, bulkCreateVouchers);

router.route("/")
  .post(protect, admin, createVoucher)
  .get(protect, admin, getVouchers);

router.get("/promoted", getPromotedVouchers);

router.post("/validate", protect, validateVoucher);

// Wallet routes (placed before /:id to avoid param conflicts)
router.get("/me/saved", protect, getSavedVouchers);
router.post("/:id/save", protect, saveVoucher);
router.post("/:id/unsave", protect, unsaveVoucher);

router.route("/:id")
  .get(protect, admin, getVoucherById)
  .put(protect, admin, updateVoucher)
  .delete(protect, admin, deleteVoucher);

module.exports = router;
