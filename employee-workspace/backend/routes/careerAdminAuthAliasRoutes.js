import express from "express";

import {
  loginCareersAdmin,
  logoutCareersAdmin,
  getCareersAdminMe,
} from "../controllers/careersAuthController.js";

import {
  protectCareersAdmin,
} from "../middleware/careersAuthMiddleware.js";

const router = express.Router();

// Careers admin login
router.post(
  "/login",
  loginCareersAdmin
);

// Careers admin logout
router.post(
  "/logout",
  logoutCareersAdmin
);

// Check the currently logged-in Careers admin
router.get(
  "/me",
  protectCareersAdmin,
  getCareersAdminMe
);

export default router;