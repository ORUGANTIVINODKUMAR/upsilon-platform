import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDirectory = path.resolve("uploads", "resumes");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const safeFileName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-]/g, "");

    const uniqueFileName = `${Date.now()}-${safeFileName}`;

    callback(null, uniqueFileName);
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const fileFilter = (req, file, callback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
    return;
  }

  callback(
    new Error("Only PDF, DOC, and DOCX resume files are allowed."),
    false
  );
};

const careerResumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default careerResumeUpload;