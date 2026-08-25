import express from "express";

import {
  getPublishedCareerJobs,
  getPublishedCareerJobById,
  getAllCareerJobs,
  getCareerJobForAdmin,
  createCareerJob,
  updateCareerJob,
  deleteCareerJob,
} from "../controllers/careerJobController.js";

import {
  protectCareersAdmin,
} from "../middleware/careersAuthMiddleware.js";

const router = express.Router();

// Public: list active jobs
router.get("/", getPublishedCareerJobs);

// Admin: list all Active, Draft, and Closed jobs
router.get(
  "/admin/all",
  protectCareersAdmin,
  getAllCareerJobs
);

// Admin: get any job by ID
router.get(
  "/admin/:id",
  protectCareersAdmin,
  getCareerJobForAdmin
);

// Public: get one active job
router.get("/:id", getPublishedCareerJobById);

// Admin: create a job
router.post(
  "/",
  protectCareersAdmin,
  createCareerJob
);

// Admin: update a job
router.put(
  "/:id",
  protectCareersAdmin,
  updateCareerJob
);

// Admin: delete a job
router.delete(
  "/:id",
  protectCareersAdmin,
  deleteCareerJob
);

export default router;