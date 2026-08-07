import express from "express";
import {
  createHrLeaveAdjustment,
  getHrLeaveBalanceHistory,
  getHrLeaveBalances,
  getMyLeaveBalance,
} from "../controllers/leaveBalanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyLeaveBalance);
router.get("/manage", protect, getHrLeaveBalances);
router.get("/manage/:userId/history", protect, getHrLeaveBalanceHistory);
router.post("/manage/:userId/adjustments", protect, createHrLeaveAdjustment);

export default router;
