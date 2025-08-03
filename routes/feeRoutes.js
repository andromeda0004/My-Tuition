const express = require("express");
const {
  recordPayment,
  getPaymentsByStudent,
  getPendingFees,
  getFeesSummary,
  deletePayment
} = require("../controllers/feeController");

const router = express.Router();

// Main fee routes
router.route("/")
  .post(recordPayment);

// Student-specific payments
router.route("/student/:id")
  .get(getPaymentsByStudent);

// Fee analytics
router.route("/pending")
  .get(getPendingFees);

router.route("/summary")
  .get(getFeesSummary);

// Individual payment operations
router.route("/:id")
  .delete(deletePayment);

module.exports = router;
