import express from "express";

import {
  getCareerDashboardStats,
  getRecentCareerApplicants,
  getCareerDashboardCharts,
} from "../controllers/careerDashboardController.js";

import {
  protectCareersAdmin,
} from "../middleware/careersAuthMiddleware.js";

const router = express.Router();

// All dashboard routes require Careers admin login
router.get(
  "/stats",
  protectCareersAdmin,
  getCareerDashboardStats
);

router.get(
  "/recent-applicants",
  protectCareersAdmin,
  getRecentCareerApplicants
);

router.get(
  "/charts",
  protectCareersAdmin,
  getCareerDashboardCharts
);

export default router;