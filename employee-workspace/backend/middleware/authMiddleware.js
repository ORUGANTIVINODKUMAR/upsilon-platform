import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  isAllowedDuringPasswordChange,
  PASSWORD_CHANGE_REQUIRED_CODE,
} from "../services/passwordChangePolicy.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId || decoded.id;

    req.user = await User.findById(userId).select("-passwordHash");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    if (
      req.user.mustChangePassword &&
      !isAllowedDuringPasswordChange({
        method: req.method,
        path: `${req.baseUrl}${req.path}`,
      })
    ) {
      return res.status(403).json({
        success: false,
        code: PASSWORD_CHANGE_REQUIRED_CODE,
        message: "Please change your temporary password before continuing.",
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
