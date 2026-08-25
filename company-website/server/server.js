const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();
 
const app = express();
 
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
 
app.use(express.json({ limit: "1mb" }));
 
// Validate required environment variables
const requiredEnvVariables = [
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
  "EMAIL_FROM",
  "EMAIL_TO",
];
 
const missingEnvVariables = requiredEnvVariables.filter(
  (variableName) => !process.env[variableName]
);
 
if (missingEnvVariables.length > 0) {
  console.error(
    `Missing environment variables: ${missingEnvVariables.join(", ")}`
  );
} 
 
// Brevo SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // false for port 587
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_PASS?.trim(),
  },
  tls: {
    minVersion: "TLSv1.2",
  },
});
 
// Test Brevo connection when server starts
transporter.verify((error) => {
  if (error) {
    console.error("Brevo SMTP connection failed:", {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
    });
  } else {
    console.log("Brevo SMTP connection successful");
  }
});
 
// Prevent user input from inserting HTML into emails
function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
 
// Contact form
app.post("/api/contact", async (req, res) => {
  try {
    const {
      fullName,
      firmName,
      email,
      phone,
      service,
      country,
      message,
    } = req.body;
 
    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }
 
    await transporter.sendMail({
      from: `"Upsilon Website" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: "New Website Inquiry - Upsilon Services",
      text: `
New Website Inquiry
 
Full Name: ${fullName}
Firm Name: ${firmName || "Not provided"}
Email: ${email}
Phone: ${phone || "Not provided"}
Service: ${service || "Not selected"}
Country / Region: ${country || "Not provided"}
 
Message:
${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New Website Inquiry</h2>
 
          <p>
            <strong>Full Name:</strong>
            ${escapeHtml(fullName)}
          </p>
 
          <p>
            <strong>Firm Name:</strong>
            ${escapeHtml(firmName || "Not provided")}
          </p>
 
          <p>
            <strong>Email:</strong>
            ${escapeHtml(email)}
          </p>
 
          <p>
            <strong>Phone:</strong>
            ${escapeHtml(phone || "Not provided")}
          </p>
 
          <p>
            <strong>Service:</strong>
            ${escapeHtml(service || "Not selected")}
          </p>
 
          <p>
            <strong>Country / Region:</strong>
            ${escapeHtml(country || "Not provided")}
          </p>
 
          <p><strong>Message:</strong></p>
 
          <p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>
        </div>
      `,
    });
 
    return res.status(200).json({
      success: true,
      message: "Submitted successfully. We will contact you soon.",
    });
  } catch (error) {
    console.error("Contact email error:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });
 
    return res.status(500).json({
      success: false,
      message:
        "Your message could not be sent. Please try again in a few minutes.",
    });
  }
});
 
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
 
// Resource download form
app.post("/api/download-resource", async (req, res) => {
  try {
    const { name, email, company, phone, resource } = req.body;
 
    if (!name || !email || !phone || !resource) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, and resource are required.",
      });
    }
 
    const resourceInfo = RESOURCE_FILES[resource];
 
    if (!resourceInfo) {
      return res.status(400).json({
        success: false,
        message: "Requested resource was not found.",
      });
    }
 
    const filePath = path.join(
      __dirname,
      "..",
      "public",
      resourceInfo.file
    );
 
    if (!fs.existsSync(filePath)) {
      console.error("Resource file not found:", filePath);
 
      return res.status(404).json({
        success: false,
        message: "The requested resource file is currently unavailable.",
      });
    }
 
    // Email the PDF to the user
    await transporter.sendMail({
      from: `"Upsilon Services" <${process.env.EMAIL_FROM}>`,
      to: email,
      replyTo: process.env.EMAIL_TO,
      subject: `Your requested download: ${resourceInfo.label}`,
      text: `
Hello ${name},
 
Thank you for your interest.
 
Your requested resource, "${resourceInfo.label}", is attached to this email.
 
If you have any questions, reply to this email and our team will help.
 
Upsilon Services
      `,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Thanks for your interest, ${escapeHtml(name)}!</h2>
 
          <p>
            Your requested resource,
            <strong>${escapeHtml(resourceInfo.label)}</strong>,
            is attached to this email.
          </p>
 
          <p>
            If you have any questions, reply to this email and our team will
            help.
          </p>
 
          <p>Upsilon Services</p>
        </div>
      `,
      attachments: [
        {
          filename: path.basename(resourceInfo.file),
          path: filePath,
        },
      ],
    });
 
    // Send an internal notification
    await transporter.sendMail({
      from: `"Upsilon Website" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `New resource download - ${resourceInfo.label}`,
      text: `
New Resource Download
 
Resource: ${resourceInfo.label}
Name: ${name}
Company: ${company || "Not provided"}
Email: ${email}
Phone: ${phone}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New Resource Download</h2>
 
          <p>
            <strong>Resource:</strong>
            ${escapeHtml(resourceInfo.label)}
          </p>
 
          <p>
            <strong>Name:</strong>
            ${escapeHtml(name)}
          </p>
 
          <p>
            <strong>Company:</strong>
            ${escapeHtml(company || "Not provided")}
          </p>
 
          <p>
            <strong>Email:</strong>
            ${escapeHtml(email)}
          </p>
 
          <p>
            <strong>Phone:</strong>
            ${escapeHtml(phone)}
          </p>
        </div>
      `,
    });
 
    return res.status(200).json({
      success: true,
      message:
        "Submitted successfully. The resource has been sent to your email.",
    });
  } catch (error) {
    console.error("Resource download email error:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });
 
    return res.status(500).json({
      success: false,
      message:
        "We could not send the resource. Please try again in a few minutes.",
    });
  }
});
 
// Health-check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Upsilon server is running.",
  });
});
 
// Serve frontend production build
const frontendPath = path.join(__dirname, "..", "dist");
 
app.use(express.static(frontendPath));
 
// React fallback route
app.get(/.*/, (req, res) => {
  const indexPath = path.join(frontendPath, "index.html");
 
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send(
      "Frontend build was not found. Run npm run build before starting production."
    );
  }
 
  return res.sendFile(indexPath);
});
 
const PORT = process.env.PORT || 5000;
 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
