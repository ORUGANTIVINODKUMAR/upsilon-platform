import express from "express";
import { getPublishedJobs } from "../controllers/careersJobController.js";

const router = express.Router();

// Public: visitors on the company website Careers page.
router.get("/jobs", getPublishedJobs);

export default router;
