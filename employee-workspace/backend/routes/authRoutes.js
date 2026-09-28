import express from "express";
import {
  loginUser,
  logoutUser,
  getMe,
  changePassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";
import { signInLimiters } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/login", ...signInLimiters, loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);
router.put(
  "/change-password",
  protect,
  changePassword
);
export default router;
