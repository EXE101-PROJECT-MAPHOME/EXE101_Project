const express = require("express");
const router = express.Router();
const {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
  getPromotedVouchers,
} = require("../controllers/voucherController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const protect = authMiddleware;
const admin = requireRole("admin");

// Routes
router.route("/")
  .post(protect, admin, createVoucher)
  .get(protect, admin, getVouchers);

router.get("/promoted", getPromotedVouchers);

router.post("/validate", protect, validateVoucher);

router.route("/:id")
  .get(protect, admin, getVoucherById)
  .put(protect, admin, updateVoucher)
  .delete(protect, admin, deleteVoucher);

module.exports = router;
