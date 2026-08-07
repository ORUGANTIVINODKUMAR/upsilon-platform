import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import leaveBalanceRoutes from "./routes/leaveBalanceRoutes.js";
import websiteRoutes from "./routes/websiteRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reimbursementRoutes from "./routes/reimbursementRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import holidayRoutes from "./routes/holidayRoutes.js";

import careersRoutes from "./routes/careersRoutes.js";
import careersAdminRoutes from "./routes/careersAdminRoutes.js";

import careerJobRoutes from "./routes/careerJobRoutes.js";
import careerApplicationRoutes from "./routes/careerApplicationRoutes.js";
import careerDashboardRoutes from "./routes/careerDashboardRoutes.js";
import careerAdminAuthAliasRoutes from "./routes/careerAdminAuthAliasRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "https://upsilonservices.com",
  "https://www.upsilonservices.com",
  "https://workspace.upsilonservices.com",
  "https://upsilon-platform1.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
];
/* =========================
   CORS
========================= */

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin not allowed by CORS: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* =========================
   GLOBAL MIDDLEWARE
========================= */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

/* =========================
   UPLOADED FILES
========================= */

app.use(
  "/uploads",
  (req, res, next) => {
    if (req.path.startsWith("/resumes/")) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    return next();
  },
  express.static("uploads")
);

/* =========================
   EMPLOYEE WORKSPACE APIs
========================= */

app.use("/api/auth", authRoutes);

/*
 * Keep this before /api/admin.
 * It allows the Careers admin panel to reuse the
 * existing CareersAdmin login system.
 */
app.use(
  "/api/admin/auth",
  careerAdminAuthAliasRoutes
);

app.use("/api/admin", adminRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/leave-balance", leaveBalanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reimbursements", reimbursementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/teams", teamRoutes);

/* =========================
   WEBSITE APIs
========================= */

app.use("/api", websiteRoutes);

/* =========================
   EXISTING CAREERS APIs
========================= */

app.use("/api/careers", careersRoutes);

app.use(
  "/api/careers-admin",
  careersAdminRoutes
);

/* =========================
   NEW CAREERS MANAGEMENT APIs
========================= */

app.use(
  "/api/jobs",
  careerJobRoutes
);

app.use(
  "/api/applications",
  careerApplicationRoutes
);

app.use(
  "/api/careers-dashboard",
  careerDashboardRoutes
);

/* =========================
   PRODUCTION FRONTENDS
========================= */

const companyFrontendPath = path.resolve(
  __dirname,
  "../../company-website/dist"
);

const workspaceFrontendPath = path.resolve(
  __dirname,
  "../frontend/dist"
);

const companyStatic = express.static(
  companyFrontendPath
);

const workspaceStatic = express.static(
  workspaceFrontendPath
);

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (
      req.path.startsWith("/api/") ||
      req.path.startsWith("/uploads/")
    ) {
      return next();
    }

    const hostname = req.hostname.toLowerCase();

    const isWorkspaceDomain =
      hostname === "workspace.upsilonservices.com" ||
      hostname.includes("workspace");

    if (isWorkspaceDomain) {
      return workspaceStatic(req, res, next);
    }

    return companyStatic(req, res, next);
  });

  app.get(/.*/, (req, res, next) => {
    if (
      req.path.startsWith("/api/") ||
      req.path.startsWith("/uploads/")
    ) {
      return next();
    }

    const hostname = req.hostname.toLowerCase();

    const isWorkspaceDomain =
      hostname === "workspace.upsilonservices.com" ||
      hostname.includes("workspace");

    const indexFile = isWorkspaceDomain
      ? path.join(
          workspaceFrontendPath,
          "index.html"
        )
      : path.join(
          companyFrontendPath,
          "index.html"
        );

    res.sendFile(indexFile, (error) => {
      if (error) {
        next(error);
      }
    });
  });
} else {
  app.get("/", (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Upsilon Platform API Running",
    });
  });
}

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  const status = err.status || 500;
  const message =
    status >= 500 &&
    process.env.NODE_ENV === "production"
      ? "Server Error"
      : err.message || "Server Error";

  return res.status(status).json({
    success: false,
    message,
  });
});

export default app;
