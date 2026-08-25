import express from "express";

import {
  createReimbursementRequest,
  getMyReimbursementRequests,
  updateMyReimbursementRequest,
  deleteMyReimbursementRequest,

  getPendingTLReimbursements,
  getTLReimbursementHistory,
  approveReimbursementByTL,
  rejectReimbursementByTL,
  getManagerReimbursementHistory,
  getPendingManagerReimbursements,
  approveReimbursementByManager,
  rejectReimbursementByManager,

  getFinanceReimbursements,
  markReimbursementAsPaid,
} from "../controllers/reimbursementController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/request",
  protect,
  upload.array("receiptFiles", 10),
  createReimbursementRequest
);

router.get(
  "/my-requests",
  protect,
  getMyReimbursementRequests
);
router.put(
  "/request/:id",
  protect,
  upload.array("receiptFiles", 10),
  updateMyReimbursementRequest
);
router.delete(
  "/request/:id",
  protect,
  deleteMyReimbursementRequest
);

/* TL */

router.get(
  "/tl-pending",
  protect,
  getPendingTLReimbursements
);
router.get(
  "/tl/history",
  protect,
  getTLReimbursementHistory
);
router.put(
  "/tl-approve/:id",
  protect,
  approveReimbursementByTL
);

router.put(
  "/tl-reject/:id",
  protect,
  rejectReimbursementByTL
);

/* Manager / HR */

router.get(
  "/manager-pending",
  protect,
  getPendingManagerReimbursements
);
router.get(
  "/manager/history",
  protect,
  getManagerReimbursementHistory
);
router.put(
  "/manager-approve/:id",
  protect,
  approveReimbursementByManager
);

router.put(
  "/manager-reject/:id",
  protect,
  rejectReimbursementByManager
);

/* Finance */

router.get(
  "/finance",
  protect,
  getFinanceReimbursements
);

router.put(
  "/mark-paid/:id",
  protect,
  markReimbursementAsPaid
);

export default router;
