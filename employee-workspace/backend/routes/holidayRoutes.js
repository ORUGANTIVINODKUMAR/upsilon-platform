import express from "express";

import {
  createHoliday,
  getHolidays,
  deleteHoliday,
} from "../controllers/holidayController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createHoliday);
router.get("/", protect, getHolidays);
router.delete("/:id", protect, deleteHoliday);

export default router;