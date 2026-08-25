import express from "express";

import {
  loginCareersAdmin,
  logoutCareersAdmin,
  getCareersAdminMe,
} from "../controllers/careersAuthController.js";

import {
  getAllJobsAdmin,
  createJob,
  updateJob,
  deleteJob,
} from "../controllers/careersJobController.js";

import { protectCareersAdmin } from "../middleware/careersAuthMiddleware.js";

const router = express.Router();

router.post("/login", loginCareersAdmin);
router.post("/logout", logoutCareersAdmin);
router.get("/me", protectCareersAdmin, getCareersAdminMe);

router.get("/jobs", protectCareersAdmin, getAllJobsAdmin);
router.post("/jobs", protectCareersAdmin, createJob);
router.put("/jobs/:id", protectCareersAdmin, updateJob);
router.delete("/jobs/:id", protectCareersAdmin, deleteJob);

export default router;
