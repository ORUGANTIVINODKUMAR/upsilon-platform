import express from "express";

import {
  createLeaveRequest,
  updateMyLeaveRequest,
  cancelMyLeaveRequest,
  deleteMyLeaveRequest,
  getMyLeaveRequests,

  getPendingTLRequests,
  approveLeaveByTL,
  rejectLeaveByTL,
  getTLApprovalHistory,
  getAllManagerLeaveRequests,
  getManagerApprovalHistory,
  getPendingManagerRequests,
  approveLeaveByManager,
  rejectLeaveByManager,
  changeLeaveStatus,

  getFinanceLeaves,
  getApprovedLeaveCalendar,
  getTodayLeaves,
} from "../controllers/leaveController.js";

import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Employee / Team Leader Own Leave Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/request",
  protect,
  upload.single("proofFile"),
  createLeaveRequest
);
router.get(
  "/manager-all",
  protect,
  getAllManagerLeaveRequests
);
router.put(
  "/request/:id",
  protect,
  upload.single("proofFile"),
  updateMyLeaveRequest
);
router.patch(
  "/request/:id/cancel",
  protect,
  cancelMyLeaveRequest
);
router.delete(
  "/request/:id",
  protect,
  deleteMyLeaveRequest
);

router.get(
  "/my-requests",
  protect,
  getMyLeaveRequests
);

/*
|--------------------------------------------------------------------------
| Team Leader Approval Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/tl-pending",
  protect,
  getPendingTLRequests
);

router.get(
  "/tl/history",
  protect,
  getTLApprovalHistory
);

router.put(
  "/tl-approve/:id",
  protect,
  approveLeaveByTL
);

router.put(
  "/tl-reject/:id",
  protect,
  rejectLeaveByTL
);

/*
|--------------------------------------------------------------------------
| Manager / HR Final Approval Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/manager-pending",
  protect,
  getPendingManagerRequests
);

router.get(
  "/manager-history",
  protect,
  getManagerApprovalHistory
);

router.put(
  "/manager-approve/:id",
  protect,
  approveLeaveByManager
);

router.put(
  "/manager-reject/:id",
  protect,
  rejectLeaveByManager
);

router.put(
  "/status/:id",
  protect,
  changeLeaveStatus
);

/*
|--------------------------------------------------------------------------
| Finance / Calendar / Today Leave Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/finance",
  protect,
  getFinanceLeaves
);

router.get(
  "/calendar",
  protect,
  getApprovedLeaveCalendar
);

router.get(
  "/today-leaves",
  protect,
  getTodayLeaves
);

export default router;
