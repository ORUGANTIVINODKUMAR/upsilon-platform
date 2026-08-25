import jwt from "jsonwebtoken";
import CareersAdmin from "../models/CareersAdmin.js";

export const protectCareersAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.careersAdminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.scope !== "careers-admin") {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    req.careersAdmin = await CareersAdmin.findById(decoded.id).select(
      "-passwordHash"
    );

    if (!req.careersAdmin || !req.careersAdmin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token failed",
    });
  }
};
