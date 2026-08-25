import "./env.js";
import nodemailer from "nodemailer";
export const REQUIRED_SMTP_VARIABLES = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
];

export const validateMailConfiguration = (environment = process.env) => {
  const missingVariables = REQUIRED_SMTP_VARIABLES.filter(
    (variableName) => !environment[variableName]?.trim()
  );
  const port = Number(environment.SMTP_PORT);
  const errors = [...missingVariables.map((name) => `${name} is required`)];

  if (environment.SMTP_PORT?.trim() && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    errors.push("SMTP_PORT must be an integer between 1 and 65535");
  }

  return { valid: errors.length === 0, errors, missingVariables };
};

const mailConfiguration = validateMailConfiguration();

if (!mailConfiguration.valid) {
  console.warn(
    `[email] SMTP configuration invalid: ${mailConfiguration.errors.join("; ")}`
  );
}

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST?.trim(),
  port: smtpPort,
  secure: process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : smtpPort === 465,
  requireTLS: process.env.SMTP_REQUIRE_TLS
    ? process.env.SMTP_REQUIRE_TLS === "true"
    : smtpPort === 587,

  auth: {
    user: process.env.SMTP_USER?.trim(),
    pass: process.env.SMTP_PASS?.trim(),
  },

  tls: {
    minVersion: "TLSv1.2",
  },
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000),
});

export const verifyMailer = async () => {
  if (!mailConfiguration.valid) {
    console.warn("[email] SMTP verification skipped because configuration is invalid.");
    return false;
  }

  try {
    console.info("[email] Verifying SMTP transport", {
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: transporter.options.secure,
      sender: process.env.SMTP_FROM,
    });
    await transporter.verify();
    console.info("[email] SMTP connection verified");
    return true;
  } catch (error) {
    console.error("[email] SMTP connection verification failed", {
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
