import express from "express";

import {
  createSubcategory,
  getSubcategories,
  createTeam,
  getTeams,
  deleteTeam,
  updateTeam,
  createUser,
  getUsers,
  deleteUser,
  updateUser,
  resetUserPassword,
  deleteSubcategory,
  getAllLeaveReports,
  getAllReimbursementReports,
} from "../controllers/adminController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Department routes
|--------------------------------------------------------------------------
*/

router.post(
  "/subcategories",
  protect,
  authorizeRoles("Admin"),
  createSubcategory
);
router.put(
  "/users/:id/reset-password",
  protect,
  authorizeRoles("Admin"),
  resetUserPassword
);
router.get(
  "/subcategories",
  protect,
  authorizeRoles("Admin"),
  getSubcategories
);

router.delete(
  "/subcategories/:id",
  protect,
  authorizeRoles("Admin"),
  deleteSubcategory
);

/*
|--------------------------------------------------------------------------
| Team routes
|--------------------------------------------------------------------------
*/

router.post(
  "/teams",
  protect,
  authorizeRoles("Admin"),
  createTeam
);

router.get(
  "/teams",
  protect,
  authorizeRoles("Admin"),
  getTeams
);

router.put(
  "/teams/:id",
  protect,
  authorizeRoles("Admin"),
  updateTeam
);

router.patch(
  "/teams/:id",
  protect,
  authorizeRoles("Admin"),
  updateTeam
);

router.delete(
  "/teams/:id",
  protect,
  authorizeRoles("Admin"),
  deleteTeam
);

/*
|--------------------------------------------------------------------------
| User routes
|--------------------------------------------------------------------------
*/

router.post(
  "/users",
  protect,
  authorizeRoles("Admin"),
  createUser
);

router.get(
  "/users",
  protect,
  authorizeRoles("Admin"),
  getUsers
);

router.put(
  "/users/:id",
  protect,
  authorizeRoles("Admin"),
  updateUser
);

router.patch(
  "/users/:id",
  protect,
  authorizeRoles("Admin"),
  updateUser
);

router.delete(
  "/users/:id",
  protect,
  authorizeRoles("Admin"),
  deleteUser
);

/*
|--------------------------------------------------------------------------
| Admin report routes
|--------------------------------------------------------------------------
*/

router.get(
  "/leave-reports",
  protect,
  authorizeRoles("Admin"),
  getAllLeaveReports
);

router.get(
  "/reimbursement-reports",
  protect,
  authorizeRoles("Admin"),
  getAllReimbursementReports
);

export default router;