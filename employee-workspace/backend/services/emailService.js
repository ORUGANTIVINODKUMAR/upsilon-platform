import transporter, { validateMailConfiguration } from "../config/mail.js";
import { emailTemplate } from "../utils/emailTemplate.js";
import {
  buildDailyLeaveSummaryEmail,
  buildLeaveRequestEmail,
} from "./leaveEmailTemplates.js";

const getMailFrom = () => `"UPSILON HRMS" <${process.env.SMTP_FROM?.trim()}>`;

export const sendEmail = async ({ to, subject, html, messageType = "general" }) => {
  const configuration = validateMailConfiguration();
  if (!configuration.valid) {
    const error = new Error(`Email configuration invalid: ${configuration.errors.join("; ")}`);
    error.code = "EMAIL_CONFIGURATION_INVALID";
    console.error("[email] Send blocked by invalid configuration", {
      messageType,
      recipients: Array.isArray(to) ? to.length : 1,
      errors: configuration.errors,
    });
    throw error;
  }

  const recipients = Array.isArray(to) ? to : [to];
  console.info("[email] Send attempt", { messageType, recipientCount: recipients.length });
  try {
    const info = await transporter.sendMail({ from: getMailFrom(), to, subject, html });
    console.info("[email] Send successful", {
      messageType,
      recipientCount: recipients.length,
      messageId: info.messageId,
    });
    return info;
  } catch (error) {
    console.error("[email] Send failed", {
      messageType,
      recipientCount: recipients.length,
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode,
      command: error.command,
    });
    throw error;
  }
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
export const sendLeaveRequestEmail = async ({
  to,
  employeeName,
  leaveType,
  startDate,
  endDate,
  workingDays,
  reason,
  status,
  reviewUrl,
}) => {
  return sendEmail({
    to,
    subject: "New Leave Request Submitted",
    html: buildLeaveRequestEmail({ employeeName, leaveType, startDate, endDate, workingDays, reason, status, reviewUrl }),
    messageType: "leave-request",
  });
};

export const sendLeaveRequestNotification = async ({ recipients, employee, leaveRequest, reviewUrl, send = sendLeaveRequestEmail }) => {
  console.info("[email] Leave notification recipients resolved", {
    leaveRequestId: leaveRequest._id?.toString(),
    recipientCount: recipients.length,
    roles: [...new Set(recipients.map((recipient) => recipient.role))],
  });

  const results = await Promise.allSettled(recipients.map((recipient) =>
    send({
      to: recipient.email,
      employeeName: employee.name,
      leaveType: leaveRequest.leaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      workingDays: leaveRequest.workingDays,
      reason: leaveRequest.reason,
      status: leaveRequest.finalStatus,
      reviewUrl,
    })
  ));
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length) {
    console.error("[email] Leave request notification incomplete", {
      leaveRequestId: leaveRequest._id?.toString(),
      attempted: results.length,
      failed: failures.length,
    });
  }
  return { attempted: results.length, sent: results.length - failures.length, failed: failures.length };
};

export const sendDailyLeaveSummary = ({ to, date, leaves, scopeLabel }) =>
  sendEmail({
    to,
    subject: `Daily Leave Summary – ${new Date(date).toISOString().slice(0, 10)}`,
    html: buildDailyLeaveSummaryEmail({ date, leaves, scopeLabel }),
    messageType: "daily-leave-summary",
  });

export const sendDecisionEmail = async ({
  to,
  subject,
  title,
  employeeName,
  requestType,
  status,
  rejectionReason = "",
  leaveType = "",
  startDate = null,
  endDate = null,
  approverName = "",
  approverRole = "",
}) => {
  const leaveDetails = requestType === "Leave"
    ? `
      <table border="1" cellpadding="8" cellspacing="0">
        ${leaveType
          ? `<tr><td><strong>Leave Type</strong></td><td>${escapeHtml(leaveType)}</td></tr>`
          : ""
        }
        ${startDate
          ? `<tr><td><strong>Start Date</strong></td><td>${new Date(startDate).toDateString()}</td></tr>`
          : ""
        }
        ${endDate
          ? `<tr><td><strong>End Date</strong></td><td>${new Date(endDate).toDateString()}</td></tr>`
          : ""
        }
        <tr><td><strong>Status</strong></td><td>${escapeHtml(status)}</td></tr>
        ${approverRole || approverName
          ? `<tr><td><strong>Decision By</strong></td><td>${escapeHtml([approverName, approverRole].filter(Boolean).join(" - "))}</td></tr>`
          : ""
        }
      </table>
    `
    : "";

  const html = `
    <h2>${escapeHtml(title)}</h2>
    <p>Hello ${escapeHtml(employeeName)},</p>
    <p>Your ${escapeHtml(requestType)} request has been marked as <strong>${escapeHtml(status)}</strong>.</p>

    ${leaveDetails}

    ${status === "Rejected"
      ? `<p><strong>Rejection Reason:</strong> ${escapeHtml(rejectionReason)}</p>`
      : ""
    }
  `;

  await transporter.sendMail({
    from: getMailFrom(),
    to,
    subject,
    html,
  });
};

export const sendFinanceLeaveEmail = async ({
  to,
  employeeName,
  leaveType,
  startDate,
  endDate,
  workingDays,
  status,
}) => {
  const html = `
    <h2>Approved Leave Details</h2>
    <p>A leave request has been fully approved.</p>

    <table border="1" cellpadding="8" cellspacing="0">
      <tr>
        <td><strong>Employee Name</strong></td>
        <td>${escapeHtml(employeeName)}</td>
      </tr>
      <tr>
        <td><strong>Leave Type</strong></td>
        <td>${escapeHtml(leaveType)}</td>
      </tr>
      <tr>
        <td><strong>Start Date</strong></td>
        <td>${new Date(startDate).toDateString()}</td>
      </tr>
      <tr>
        <td><strong>End Date</strong></td>
        <td>${new Date(endDate).toDateString()}</td>
      </tr>
      <tr>
        <td><strong>Total Leave Days</strong></td>
        <td>${workingDays}</td>
      </tr>
      <tr>
        <td><strong>Approval Status</strong></td>
        <td>${escapeHtml(status)}</td>
      </tr>
    </table>
  `;

  await transporter.sendMail({
    from: getMailFrom(),
    to,
    subject: "Approved Leave Details",
    html,
  });
};

export const sendFinanceReimbursementEmail = async ({
  to,
  employeeName,
  totalReimbursement,
  businessPurpose,
  expenseFrom,
  expenseTo,
  status,
}) => {
  const html = emailTemplate(
    "New Reimbursement Request",
    `
  <p>
    A new reimbursement request has been submitted.
  </p>

  <table
    width="100%"
    cellpadding="10"
    cellspacing="0"
    style="border-collapse:collapse;"
  >
    <tr>
      <td><strong>Employee</strong></td>
      <td>${escapeHtml(employeeName)}</td>
    </tr>

    <tr>
      <td><strong>Business Purpose</strong></td>
      <td>${escapeHtml(businessPurpose)}</td>
    </tr>

    <tr>
      <td><strong>Expense From</strong></td>
      <td>${new Date(expenseFrom).toDateString()}</td>
    </tr>

    <tr>
      <td><strong>Expense To</strong></td>
      <td>${new Date(expenseTo).toDateString()}</td>
    </tr>

    <tr>
      <td><strong>Total Amount</strong></td>
      <td>₹${totalReimbursement}</td>
    </tr>
  </table>
  `
  );
  await transporter.sendMail({
    from: getMailFrom(),
    to,
    subject: "Reimbursement Ready for Payment",
    html,
  });
};
export const sendReimbursementRequestEmail = async ({
  to,
  employeeName,
  businessPurpose,
  totalReimbursement,
  expenseFrom,
  expenseTo,
}) => {
  const html = `
    <h2>New Reimbursement Request</h2>
    <p>A new reimbursement request has been submitted.</p>

    <table border="1" cellpadding="8" cellspacing="0">
      <tr>
        <td><strong>Employee Name</strong></td>
        <td>${escapeHtml(employeeName)}</td>
      </tr>
      <tr>
        <td><strong>Business Purpose</strong></td>
        <td>${escapeHtml(businessPurpose)}</td>
      </tr>
      <tr>
        <td><strong>Expense From</strong></td>
        <td>${new Date(expenseFrom).toDateString()}</td>
      </tr>
      <tr>
        <td><strong>Expense To</strong></td>
        <td>${new Date(expenseTo).toDateString()}</td>
      </tr>
      <tr>
        <td><strong>Total Reimbursement</strong></td>
        <td>${totalReimbursement}</td>
      </tr>
    </table>
  `;

  await transporter.sendMail({
    from: getMailFrom(),
    to,
    subject: "New Reimbursement Request Submitted",
    html,
  });
};
