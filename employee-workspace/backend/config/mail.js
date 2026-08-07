import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();
const requiredVariables = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
];

const missingVariables = requiredVariables.filter(
  (variableName) => !process.env[variableName]?.trim()
);

if (missingVariables.length > 0) {
  console.warn(
    `SMTP environment variables missing: ${missingVariables.join(", ")}`
  );
}

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST?.trim(),
  port: smtpPort,
  secure: smtpPort === 465,
  requireTLS: smtpPort === 587,

  auth: {
    user: process.env.SMTP_USER?.trim(),
    pass: process.env.SMTP_PASS?.trim(),
  },

  tls: {
    minVersion: "TLSv1.2",
  },
});

export const verifyMailer = async () => {
  if (missingVariables.length > 0) {
    console.warn("SMTP verification skipped because variables are missing.");
    return false;
  }

  try {
    await transporter.verify();
    console.log("Brevo SMTP connection successful");
    return true;
  } catch (error) {
    console.error("Brevo SMTP connection failed:", {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
    });

    return false;
  }
};

export default transporter;
