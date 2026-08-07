import express from "express";

import {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
} from "../controllers/teamController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("Admin"),
  createTeam
);

router.get(
  "/",
  protect,
  authorizeRoles("Admin"),
  getTeams
);

router.put(
  "/:id",
  protect,
  authorizeRoles("Admin"),
  updateTeam
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("Admin"),
  deleteTeam
);

export default router;
