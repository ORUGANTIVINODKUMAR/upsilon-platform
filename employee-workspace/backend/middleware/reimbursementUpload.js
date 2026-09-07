import upload from "./uploadMiddleware.js";
import cloudinary from "../config/cloudinary.js";

const receiptUpload = upload.array("receiptFiles", 10);

export const createReimbursementUpload = ({
  receiveFiles = receiptUpload,
  getConfig = () => cloudinary.config(),
  logError = (details) => console.error("[reimbursement-upload]", details),
} = {}) => (req, res, next) => {
  const handleUploadResult = (error) => {
    if (!error) return next();

    const clientErrors = {
      LIMIT_FILE_SIZE: "Each receipt must be 10 MB or smaller.",
      LIMIT_UNEXPECTED_FILE: "Upload no more than 10 receipts using the receipt file field.",
      LIMIT_FILE_COUNT: "You can upload up to 10 receipts per request.",
      INVALID_FILE_TYPE: "Receipt files must be PDF, JPG, JPEG, PNG, or WebP.",
    };
    if (clientErrors[error.code]) {
      return res.status(400).json({ success: false, code: error.code, message: clientErrors[error.code] });
    }

    const { cloud_name, api_key, api_secret } = getConfig();
    if (![cloud_name, api_key, api_secret].every((value) => String(value || "").trim())) {
      logError({ code: "UPLOAD_NOT_CONFIGURED", message: "Cloudinary upload configuration is incomplete." });
      return res.status(503).json({
        success: false,
        code: "UPLOAD_NOT_CONFIGURED",
        message: "Receipt uploads are not configured on the server. Please contact your administrator.",
      });
    }

    logError({
      code: error.code || "RECEIPT_UPLOAD_FAILED",
      providerStatus: error.http_code,
      message: error.message || "Receipt upload failed",
    });
    return res.status(502).json({
      success: false,
      code: "RECEIPT_UPLOAD_FAILED",
      message: "The receipt could not be uploaded. Please try again or contact your administrator if this continues.",
    });
  };

  try {
    receiveFiles(req, res, handleUploadResult);
  } catch (error) {
    handleUploadResult(error);
  }
};

export default createReimbursementUpload();
