import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import transporter from "../config/mail.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESOURCE_FILES = {
  "offshoring-guide": {
    file: "resources/choose-if-offshoring-fits-your-firm.pdf",
    label: "Choose If Offshoring Fits Your Firm",
  },

  "pilot-playbook": {
    file: "resources/offshore-accounting-pilot-playbook.pdf",
    label: "Offshore Accounting Pilot Playbook",
  },
};

/**
 * Convert user-entered text into safe HTML.
 */
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Validate an email address.
 */
function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

/**
 * Validate a phone number.
 *
 * Allows:
 * Numbers
 * Spaces
 * +
 * -
 * Parentheses
 */
function isValidPhone(phone = "") {
  return /^[0-9+\-() ]{7,25}$/.test(String(phone).trim());
}

/**
 * Return the shared SMTP sender address.
 */
function getSenderAddress() {
  return process.env.SMTP_FROM?.trim();
}

/**
 * Return the internal website notification recipient.
 */
function getNotificationAddress() {
  return process.env.EMAIL_TO?.trim();
}

/**
 * Confirm the required email environment variables exist.
 */
function validateEmailConfiguration() {
  const missingVariables = [];

  if (!getSenderAddress()) {
    missingVariables.push("SMTP_FROM");
  }

  if (!getNotificationAddress()) {
    missingVariables.push("EMAIL_TO");
  }

  if (missingVariables.length > 0) {
    const error = new Error(
      `Missing email environment variables: ${missingVariables.join(", ")}`
    );

    error.code = "EMAIL_CONFIGURATION_ERROR";
    throw error;
  }
}

/**
 * Write detailed email errors to the Render logs.
 */
function logEmailError(label, error) {
  console.error(label, {
    message: error?.message,
    code: error?.code,
    response: error?.response,
    responseCode: error?.responseCode,
    command: error?.command,
  });
}

/**
 * POST /api/contact
 *
 * Receives a company website contact form and sends it to the
 * internal Upsilon notification email address.
 */
router.post("/contact", async (req, res) => {
  try {
    validateEmailConfiguration();

    const {
      fullName,
      firmName,
      email,
      phone,
      service,
      country,
      message,
    } = req.body ?? {};

    const cleanFullName = String(fullName ?? "").trim();
    const cleanFirmName = String(firmName ?? "").trim();
    const cleanEmail = String(email ?? "").trim();
    const cleanPhone = String(phone ?? "").trim();
    const cleanService = String(service ?? "").trim();
    const cleanCountry = String(country ?? "").trim();
    const cleanMessage = String(message ?? "").trim();

    if (!cleanFullName || !cleanEmail || !cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (cleanPhone && !isValidPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number.",
      });
    }

    const senderAddress = getSenderAddress();
    const notificationAddress = getNotificationAddress();

    await transporter.sendMail({
      from: {
        name: "Upsilon Website",
        address: senderAddress,
      },

      to: notificationAddress,

      replyTo: {
        name: cleanFullName,
        address: cleanEmail,
      },

      subject: "New Website Inquiry - Upsilon Services",

      text: `
New Website Inquiry

Full Name: ${cleanFullName}
Firm Name: ${cleanFirmName || "Not provided"}
Email: ${cleanEmail}
Phone: ${cleanPhone || "Not provided"}
Service: ${cleanService || "Not selected"}
Country / Region: ${cleanCountry || "Not provided"}

Message:
${cleanMessage}
      `.trim(),

      html: `
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #222222;
          "
        >
          <h2>New Website Inquiry</h2>

          <p>
            <strong>Full Name:</strong>
            ${escapeHtml(cleanFullName)}
          </p>

          <p>
            <strong>Firm Name:</strong>
            ${escapeHtml(cleanFirmName || "Not provided")}
          </p>

          <p>
            <strong>Email:</strong>
            ${escapeHtml(cleanEmail)}
          </p>

          <p>
            <strong>Phone:</strong>
            ${escapeHtml(cleanPhone || "Not provided")}
          </p>

          <p>
            <strong>Service:</strong>
            ${escapeHtml(cleanService || "Not selected")}
          </p>

          <p>
            <strong>Country / Region:</strong>
            ${escapeHtml(cleanCountry || "Not provided")}
          </p>

          <p><strong>Message:</strong></p>

          <p>
            ${escapeHtml(cleanMessage).replaceAll("\n", "<br>")}
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Submitted successfully. We will contact you soon.",
    });
  } catch (error) {
    logEmailError("Contact email error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Your message could not be sent. Please try again in a few minutes.",
    });
  }
});

/**
 * POST /api/download-resource
 *
 * Sends the selected PDF to the visitor and sends a separate
 * lead notification to the Upsilon internal email address.
 */
router.post("/download-resource", async (req, res) => {
  try {
    validateEmailConfiguration();

    const { name, email, company, phone, resource } = req.body ?? {};

    const cleanName = String(name ?? "").trim();
    const cleanEmail = String(email ?? "").trim();
    const cleanCompany = String(company ?? "").trim();
    const cleanPhone = String(phone ?? "").trim();
    const cleanResource = String(resource ?? "").trim();

    if (!cleanName || !cleanEmail || !cleanPhone || !cleanResource) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and resource are required.",
      });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number.",
      });
    }

    const resourceInfo = RESOURCE_FILES[cleanResource];

    if (!resourceInfo) {
      return res.status(400).json({
        success: false,
        message: "Requested resource was not found.",
      });
    }

    /*
      Current route file:
      employee-workspace/backend/routes/websiteRoutes.js

      PDF source:
      company-website/public/resources/...
    */
    const filePath = path.resolve(
      __dirname,
      "../../../company-website/public",
      resourceInfo.file
    );

    if (!fs.existsSync(filePath)) {
      console.error("Resource file not found:", filePath);

      return res.status(404).json({
        success: false,
        message: "The requested resource file is currently unavailable.",
      });
    }

    const senderAddress = getSenderAddress();
    const notificationAddress = getNotificationAddress();

    const visitorEmail = {
      from: {
        name: "Upsilon Services",
        address: senderAddress,
      },

      to: cleanEmail,

      replyTo: notificationAddress,

      subject: `Your requested download: ${resourceInfo.label}`,

      text: `
Hello ${cleanName},

Thank you for your interest.

Your requested resource, "${resourceInfo.label}", is attached to this email.

If you have any questions, reply to this email and our team will help.

Upsilon Services
      `.trim(),

      html: `
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #222222;
          "
        >
          <h2>
            Thanks for your interest, ${escapeHtml(cleanName)}!
          </h2>

          <p>
            Your requested resource,
            <strong>${escapeHtml(resourceInfo.label)}</strong>,
            is attached to this email.
          </p>

          <p>
            If you have any questions, reply to this email and our team
            will help.
          </p>

          <p>
            Regards,<br>
            Upsilon Services
          </p>
        </div>
      `,

      attachments: [
        {
          filename: path.basename(resourceInfo.file),
          path: filePath,
        },
      ],
    };

    const internalNotificationEmail = {
      from: {
        name: "Upsilon Website",
        address: senderAddress,
      },

      to: notificationAddress,

      replyTo: {
        name: cleanName,
        address: cleanEmail,
      },

      subject: `New resource download - ${resourceInfo.label}`,

      text: `
New Resource Download

Resource: ${resourceInfo.label}
Name: ${cleanName}
Company: ${cleanCompany || "Not provided"}
Email: ${cleanEmail}
Phone: ${cleanPhone}
      `.trim(),

      html: `
        <div
          style="
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #222222;
          "
        >
          <h2>New Resource Download</h2>

          <p>
            <strong>Resource:</strong>
            ${escapeHtml(resourceInfo.label)}
          </p>

          <p>
            <strong>Name:</strong>
            ${escapeHtml(cleanName)}
          </p>

          <p>
            <strong>Company:</strong>
            ${escapeHtml(cleanCompany || "Not provided")}
          </p>

          <p>
            <strong>Email:</strong>
            ${escapeHtml(cleanEmail)}
          </p>

          <p>
            <strong>Phone:</strong>
            ${escapeHtml(cleanPhone)}
          </p>
        </div>
      `,
    };

    /*
      Send the visitor email and the internal notification at the same time.
    */
    await Promise.all([
      transporter.sendMail(visitorEmail),
      transporter.sendMail(internalNotificationEmail),
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Submitted successfully. The resource has been sent to your email.",
    });
  } catch (error) {
    logEmailError("Resource download email error:", error);

    return res.status(500).json({
      success: false,
      message:
        "We could not send the resource. Please try again in a few minutes.",
    });
  }
});

/**
 * GET /api/health
 */
router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Upsilon platform server is running.",
  });
});

export default router;