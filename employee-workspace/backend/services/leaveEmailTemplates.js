const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (value, timeZone = process.env.LEAVE_TIME_ZONE || "Asia/Kolkata") =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(value));

const detailsTable = (rows) => `
  <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;border:1px solid #dfe7e3;border-radius:8px">
    ${rows.map(([label, value]) => `<tr><td style="border-bottom:1px solid #edf2ef;color:#52615b;width:38%"><strong>${escapeHtml(label)}</strong></td><td style="border-bottom:1px solid #edf2ef">${escapeHtml(value)}</td></tr>`).join("")}
  </table>`;

export const getLeaveDurationLabel = (leave) => {
  const explicitType = leave.dayType || leave.durationType;
  if (explicitType) return String(explicitType);
  if (leave.isHalfDay || Number(leave.workingDays) === 0.5) return "Half Day";
  if (new Date(leave.startDate).toDateString() === new Date(leave.endDate).toDateString()) return "Full Day";
  return `${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`;
};

export const buildLeaveRequestEmail = ({ employeeName, leaveType, startDate, endDate, workingDays, reason, status, reviewUrl, approveUrl, rejectUrl, notificationTitle = "New Leave Request" }) => `
  <div style="font-family:Arial,sans-serif;color:#14231d;line-height:1.5;max-width:680px;margin:auto">
    <h2 style="color:#075b45">${escapeHtml(notificationTitle)}</h2>
    <p>A leave request has changed and may require your attention.</p>
    ${detailsTable([
      ["Employee", employeeName], ["Leave type", leaveType],
      ["Start date", formatDate(startDate)], ["End date", formatDate(endDate)],
      ["Leave days", workingDays], ["Reason", reason], ["Status", status],
    ])}
    ${approveUrl && rejectUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px"><tr>
        <td style="padding-right:10px"><a href="${escapeHtml(approveUrl)}" style="display:inline-block;background:#075b45;color:#fff;padding:11px 18px;border-radius:7px;text-decoration:none;font-weight:bold">Approve Leave</a></td>
        <td><a href="${escapeHtml(rejectUrl)}" style="display:inline-block;background:#a12828;color:#fff;padding:11px 18px;border-radius:7px;text-decoration:none;font-weight:bold">Reject Leave</a></td>
      </tr></table>` : ""}
    ${reviewUrl ? `<p style="margin-top:20px"><a href="${escapeHtml(reviewUrl)}" style="color:#075b45;font-weight:bold">View in Workspace</a></p>` : ""}
  </div>`;

export const buildDailyLeaveSummaryEmail = ({ date, leaves, scopeLabel }) => {
  const approvedCount = leaves.filter((leave) => String(leave.finalStatus).startsWith("Approved")).length;
  const pendingCount = leaves.length - approvedCount;
  const rows = leaves.length
    ? leaves.map((leave) => `<tr><td>${escapeHtml(leave.employeeName)}</td><td>${escapeHtml(leave.department || leave.team || "—")}</td><td>${escapeHtml(leave.leaveType)}</td><td>${escapeHtml(getLeaveDurationLabel(leave))}</td><td>${escapeHtml(formatDate(leave.startDate))} – ${escapeHtml(formatDate(leave.endDate))}</td><td>${escapeHtml(leave.finalStatus)}</td></tr>`).join("")
    : `<tr><td colspan="6" style="text-align:center;color:#66756f">No employees are on leave today.</td></tr>`;

  return `<div style="font-family:Arial,sans-serif;color:#14231d;line-height:1.5;max-width:820px;margin:auto">
    <h2 style="color:#075b45">Daily Leave Summary – ${escapeHtml(formatDate(date))}</h2>
    <p>${escapeHtml(scopeLabel)} · Total: <strong>${leaves.length}</strong> · Approved: <strong>${approvedCount}</strong> · Pending: <strong>${pendingCount}</strong></p>
    <table width="100%" cellpadding="9" cellspacing="0" style="border-collapse:collapse;border:1px solid #dfe7e3;font-size:13px">
      <thead style="background:#edf7f3"><tr><th>Employee</th><th>Department / team</th><th>Leave</th><th>Duration</th><th>Dates</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
};
