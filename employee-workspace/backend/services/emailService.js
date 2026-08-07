import transporter from "../config/mail.js";
import { emailTemplate } from "../utils/emailTemplate.js";
const senderAddress =
  process.env.SMTP_FROM?.trim() ||
  process.env.SMTP_USER?.trim();
const mailFrom = `"UPSILON HRMS" <${senderAddress}>`;
export const sendLeaveRequestEmail = async ({
  to,
  employeeName,
  leaveType,
  startDate,
  endDate,
  workingDays,
}) => {
  const html = `
    <h2>New Leave Request</h2>
    <p>A new leave request has been submitted.</p>

    <table border="1" cellpadding="8" cellspacing="0">
      <tr>
        <td><strong>Employee Name</strong></td>
        <td>${employeeName}</td>
      </tr>
      <tr>
        <td><strong>Leave Type</strong></td>
        <td>${leaveType}</td>
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
    </table>
  `;

  await transporter.sendMail({
    from: mailFrom,
    to,
    subject: "New Leave Request Submitted",
    html,
  });
};

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
          ? `<tr><td><strong>Leave Type</strong></td><td>${leaveType}</td></tr>`
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
        <tr><td><strong>Status</strong></td><td>${status}</td></tr>
        ${approverRole || approverName
          ? `<tr><td><strong>Decision By</strong></td><td>${[approverName, approverRole].filter(Boolean).join(" - ")}</td></tr>`
          : ""
        }
      </table>
    `
    : "";

  const html = `
    <h2>${title}</h2>
    <p>Hello ${employeeName},</p>
    <p>Your ${requestType} request has been marked as <strong>${status}</strong>.</p>

    ${leaveDetails}

    ${status === "Rejected"
      ? `<p><strong>Rejection Reason:</strong> ${rejectionReason}</p>`
      : ""
    }
  `;

  await transporter.sendMail({
    from: mailFrom,
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
        <td>${employeeName}</td>
      </tr>
      <tr>
        <td><strong>Leave Type</strong></td>
        <td>${leaveType}</td>
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
        <td>${status}</td>
      </tr>
    </table>
  `;

  await transporter.sendMail({
    from: mailFrom,
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
      <td>${employeeName}</td>
    </tr>

    <tr>
      <td><strong>Business Purpose</strong></td>
      <td>${businessPurpose}</td>
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
    from: mailFrom,
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
        <td>${employeeName}</td>
      </tr>
      <tr>
        <td><strong>Business Purpose</strong></td>
        <td>${businessPurpose}</td>
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
    from: mailFrom,
    to,
    subject: "New Reimbursement Request Submitted",
    html,
  });
};
