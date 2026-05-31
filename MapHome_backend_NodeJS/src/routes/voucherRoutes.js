const express = require("express");
const router = express.Router();
const {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
} = require("../controllers/voucherController");
const { protect, admin } = require("../middleware/authMiddleware");

// Routes
router.route("/")
  .post(protect, admin, createVoucher)
  .get(protect, admin, getVouchers);

router.post("/validate", protect, validateVoucher);

router.route("/:id")
  .get(protect, admin, getVoucherById)
  .put(protect, admin, updateVoucher)
  .delete(protect, admin, deleteVoucher);

module.exports = router;
