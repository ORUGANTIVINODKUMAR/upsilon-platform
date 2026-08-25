export const LEAVE_APPROVAL_EXPORT_ROLES = [
  "TeamLeader",
  "Manager",
  "HR",
  "Admin",
];

export const LEAVE_APPROVAL_EXPORT_FILTERS = [
  "day",
  "week",
  "month",
  "custom",
];

const parseDateOnly = (value, fieldName) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    throw new RangeError(`${fieldName} must use YYYY-MM-DD format`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`${fieldName} is not a valid date`);
  }

  return date;
};

const endOfUtcDay = (date) =>
  new Date(date.getTime() + (24 * 60 * 60 * 1000) - 1);

export const getLeaveApprovalExportRange = (query = {}) => {
  const filterType = String(query.filterType || "").toLowerCase();
  if (!LEAVE_APPROVAL_EXPORT_FILTERS.includes(filterType)) {
    throw new RangeError("filterType must be day, week, month, or custom");
  }

  let startDate;
  let endDate;

  if (filterType === "month") {
    if (!/^\d{4}-\d{2}$/.test(String(query.month || ""))) {
      throw new RangeError("month must use YYYY-MM format");
    }

    startDate = parseDateOnly(`${query.month}-01`, "month");
    const nextMonth = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth() + 1,
      1
    ));
    endDate = new Date(nextMonth.getTime() - 1);
  } else if (filterType === "custom") {
    startDate = parseDateOnly(query.startDate, "startDate");
    const customEnd = parseDateOnly(query.endDate, "endDate");
    if (customEnd < startDate) {
      throw new RangeError("endDate cannot be earlier than startDate");
    }
    endDate = endOfUtcDay(customEnd);
  } else {
    const selectedDate = parseDateOnly(query.date, "date");
    if (filterType === "day") {
      startDate = selectedDate;
      endDate = endOfUtcDay(selectedDate);
    } else {
      const daysSinceMonday = (selectedDate.getUTCDay() + 6) % 7;
      startDate = new Date(selectedDate.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
      endDate = endOfUtcDay(new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000));
    }
  }

  return { filterType, startDate, endDate };
};

export const getLeaveApprovalVisibilityFilter = (user) => {
  if (!LEAVE_APPROVAL_EXPORT_ROLES.includes(user?.role)) {
    throw new Error("Role is not allowed to export final leave approvals");
  }

  if (user.role === "TeamLeader") return { teamLeaderId: user._id };
  if (user.role === "Manager") return { managerId: user._id };
  return {};
};

export const getLeaveApprovalStatusFilter = (status = "All") => {
  const allowedExactStatuses = [
    "Pending Final Approval",
    "Pending Reapproval",
    "On Hold",
  ];

  if (!status || status === "All") return {};
  if (status === "Approved") {
    return { finalStatus: { $in: ["Approved by Manager", "Approved by HR"] } };
  }
  if (status === "Rejected") {
    return { finalStatus: { $in: ["Rejected by Manager", "Rejected by HR"] } };
  }
  if (allowedExactStatuses.includes(status)) return { finalStatus: status };
  throw new RangeError("statusFilter is invalid");
};

export const leaveRequestMatchesSearch = (leaveRequest, search = "") => {
  const normalizedSearch = String(search).trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [
    leaveRequest.employeeId?.name,
    leaveRequest.employeeId?.email,
    leaveRequest.employeeId?.employeeId,
    leaveRequest.leaveType,
    leaveRequest.finalStatus,
    leaveRequest.reason,
  ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
};
