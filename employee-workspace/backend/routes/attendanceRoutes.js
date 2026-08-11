import express from "express";
import {
  createUninformedAbsence,
  getAttendanceEmployees,
  getAttendanceRecords,
  updateUninformedAbsence,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

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

export default router;
