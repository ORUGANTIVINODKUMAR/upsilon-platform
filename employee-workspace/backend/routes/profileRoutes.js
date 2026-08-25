import express from "express";

import {
  getMyProfile,
  updateMyMobile,
  changeMyPassword,
  uploadSignature,
  uploadProfilePhoto,
  removeProfilePhoto,
} from "../controllers/profileController.js";

import { protect } from "../middleware/authMiddleware.js";

import {
  uploadProfilePhoto as profilePhotoUpload,
  uploadSignatureFile,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get(
  "/me",
  protect,
  getMyProfile
);

router.put(
  "/mobile",
  protect,
  updateMyMobile
);

router.put(
  "/password",
  protect,
  changeMyPassword
);

router.post(
  "/signature",
  protect,
  uploadSignatureFile.single("signatureFile"),
  uploadSignature
);

router.post(
  "/photo",
  protect,
  profilePhotoUpload.single("profilePhoto"),
  uploadProfilePhoto
);

router.delete(
  "/photo",
  protect,
  removeProfilePhoto
);

export default router;
