import express from "express";
import {
  cancelAttendanceRecord,
  createUninformedAbsence,
  getAttendanceEmployees,
  getAttendanceRecords,
  getAttendanceCalendar,
  updateUninformedAbsence,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/calendar", protect, getAttendanceCalendar);

router.get("/", protect, getAttendanceRecords);
router.get(
  "/employees",
  protect,
  authorizeRoles("Manager", "HR"),
  getAttendanceEmployees,
);
router.post(
  "/uninformed-absence",
  protect,
  authorizeRoles("Manager", "HR"),
  createUninformedAbsence,
);
router.patch(
  "/uninformed-absence/:id",
  protect,
  authorizeRoles("Manager", "HR"),
  updateUninformedAbsence,
);
router.patch(
  "/uninformed-absence/:id/cancel",
  protect,
  authorizeRoles("Manager", "HR"),
  cancelAttendanceRecord,
);

export default router;
