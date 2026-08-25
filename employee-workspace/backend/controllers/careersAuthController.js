import jwt from "jsonwebtoken";
import CareersAdmin from "../models/CareersAdmin.js";

const generateToken = (adminId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { id: adminId, scope: "careers-admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

export const loginCareersAdmin = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await CareersAdmin.findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive",
      });
    }

    const token = generateToken(admin._id);

    res.cookie("careersAdminToken", token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("CAREERS ADMIN LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to sign in",
    });
  }
};

export const logoutCareersAdmin = async (req, res) => {
  res.clearCookie("careersAdminToken", cookieOptions);

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

export const getCareersAdminMe = async (req, res) => {
  res.status(200).json({
    success: true,
    admin: req.careersAdmin,
  });
};
