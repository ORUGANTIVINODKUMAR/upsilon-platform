import multer from "multer";
import path from "path";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const sanitizeFileName = (originalName) => {
  return path
    .parse(originalName)
    .name.replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const getUploadFolder = (req) => {
  const url = req.originalUrl.toLowerCase();

  if (url.includes("profile-photo") || url.includes("profile/photo")) {
    return "employee-portal/profile-photos";
  }

  if (url.includes("signature")) {
    return "employee-portal/signatures";
  }

  if (url.includes("leave")) {
    return "employee-portal/leave-proofs";
  }

  if (url.includes("reimbursement")) {
    return "employee-portal/reimbursement-receipts";
  }

  return "employee-portal/uploads";
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = getUploadFolder(req);
    const cleanFileName =
      sanitizeFileName(file.originalname) || "uploaded-file";

    const isImage = file.mimetype.startsWith("image/");

    return {
      folder,
      resource_type: isImage ? "image" : "raw",
      allowed_formats: ["pdf", "jpg", "jpeg", "png", "webp"],
      public_id: `${Date.now()}-${cleanFileName}`,
    };
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const validMimeType = allowedMimeTypes.includes(file.mimetype);
  const validExtension = allowedExtensions.includes(extension);

  if (!validMimeType || !validExtension) {
    return cb(
      new Error("Only PDF, JPG, JPEG, PNG, and WebP files are allowed"),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const profilePhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const cleanFileName =
      sanitizeFileName(file.originalname) || "profile-photo";

    return {
      folder: "employee-portal/profile-photos",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: `user-${req.user?._id || req.user?.id || "unknown"}-${Date.now()}-${cleanFileName}`,
      transformation: [
        {
          width: 800,
          height: 800,
          crop: "limit",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    };
  },
});

const profilePhotoFilter = (req, file, cb) => {
  const allowedProfileMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const allowedProfileExtensions = [".jpg", ".jpeg", ".png", ".webp"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    !allowedProfileMimeTypes.includes(file.mimetype) ||
    !allowedProfileExtensions.includes(extension)
  ) {
    return cb(
      new Error("Profile photo must be a JPG, JPEG, PNG, or WebP image"),
      false
    );
  }

  cb(null, true);
};

export const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  fileFilter: profilePhotoFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

export default upload;