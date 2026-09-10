import LeaveRequest from "../models/LeaveRequest.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import LeaveBalanceLedger from "../models/LeaveBalanceLedger.js";
import Holiday from "../models/Holiday.js";
import { getLeaveApprovalExportRange } from "./leaveApprovalExportPolicy.js";
import { getAuthorizedEmployeeFilter } from "./attendanceScopeService.js";
import User from "../models/User.js";
import { calculateBalanceSummary, FINAL_APPROVED_LEAVE_STATUSES, roundLeaveDays, toPeriod } from "./leaveBalanceService.js";

const key = (value) => new Date(value).toISOString().slice(0, 10);
const id = (value) => String(value?._id || (typeof value === "object" ? value?.toHexString?.() || "" : value) || "");
const DAY = 86400000;
export const getCalendarReportRange = (query) => {
  const range = getLeaveApprovalExportRange(query);
  // Preserve the existing leave calendar's Sunday-Saturday week.
  if (range.filterType === "week") {
    const anchor = new Date(`${query.date}T00:00:00Z`);
    range.startDate = new Date(anchor.getTime() - anchor.getUTCDay() * DAY);
    range.endDate = new Date(range.startDate.getTime() + 7 * DAY - 1);
  }
  if (range.endDate - range.startDate >= 366 * DAY) throw new RangeError("Choose a period of at most 366 days.");
  return range;
};

export const buildLeaveCalendarReport = ({ leaves, attendance, ledger, holidays, range, now = new Date() }) => {
  const holidayDates = new Set(holidays.map((holiday) => key(holiday.holidayDate)));
  const allocations = new Map();
  const byUser = new Map();
  for (const entry of ledger) {
    const userId = id(entry.userId);
    if (!byUser.has(userId)) byUser.set(userId, []);
    byUser.get(userId).push(entry);
  }
  for (const entries of byUser.values()) {
    calculateBalanceSummary(entries, toPeriod(now), { onLeaveAllocated: (entry, allocation) => {
      const source = entry.entryType === "APPROVED_LEAVE" ? `leave:${id(entry.leaveRequestId)}` : `attendance:${id(entry.attendanceRecordId)}`;
      allocations.set(source, allocation);
    } });
  }
  const startDate = key(range.startDate);
  const endDate = key(range.endDate);
  const records = [];
  const addRecord = (item, sourceType) => {
    const isLeave = sourceType === "Leave";
    if (isLeave && (!FINAL_APPROVED_LEAVE_STATUSES.includes(item.finalStatus) || item.isDeleted || item.requiresReapproval)) return;
    if (!isLeave && (item.active === false || item.status === "Cancelled")) return;
    const sourceId = `${isLeave ? "leave" : "attendance"}:${id(item._id)}`;
    const start = key(isLeave ? item.startDate : item.attendanceDate);
    const end = key(isLeave ? item.endDate : item.attendanceDate);
    const days = [];
    const fullDays = [];
    const duration = isLeave ? Number(item.workingDays || 0) : Number(item.durationDays ?? (item.attendanceType === "HALF_DAY" ? 0.5 : item.attendanceType === "PERMISSION" ? 0 : 1));
    if (!isLeave) fullDays.push({ date: start, days: duration });
    else {
      // Paid capacity is consumed by the earliest working dates in the request,
      // before clipping to the report range. Half days remain fractional.
      let remaining = duration;
      for (let date = new Date(`${start}T00:00:00Z`); key(date) <= end; date = new Date(date.getTime() + DAY)) {
        if ([0, 6].includes(date.getUTCDay()) || holidayDates.has(key(date))) continue;
        fullDays.push({ date: key(date), days: duration > 0 ? Math.min(1, remaining) : 1 });
        remaining = Math.max(0, remaining - 1);
      }
    }
    const allocation = allocations.get(sourceId);
    const treatment = item.balanceTreatment || (item.attendanceType === "PERMISSION" ? "NONE" : "LOP");
    let paidRemaining = allocation?.paidDays || 0;
    let lopRemaining = allocation?.lopDays || 0;
    for (const date of fullDays) {
      const paidDays = !isLeave && treatment === "LOP" ? 0 : Math.min(date.days, paidRemaining);
      paidRemaining = roundLeaveDays(paidRemaining - paidDays);
      const lopDays = !isLeave && treatment === "LOP" ? date.days : Math.min(date.days - paidDays, lopRemaining);
      lopRemaining = Math.max(0, roundLeaveDays(lopRemaining - lopDays));
      if (date.date >= startDate && date.date <= endDate && (date.days > 0 || !isLeave)) {
        days.push({ ...date, paidDays, lopDays, unallocatedDays: roundLeaveDays(date.days - paidDays - lopDays) });
      }
    }
    if (!days.length) return;
    const sum = (field) => roundLeaveDays(days.reduce((total, day) => total + day[field], 0));
    const employee = item.employeeId || {};
    records.push({ id: sourceId, sourceType, employeeKey: id(employee) || `missing:${id(item._id)}`,
      employeeName: employee.name || item.employeeName || "Former employee", employeeId: employee.employeeId || "",
      department: (isLeave ? item.subcategoryId?.name : employee.subcategoryId?.name) || "",
      team: (isLeave ? item.teamId?.name : employee.teamId?.name) || "",
      leaveType: isLeave ? item.leaveType : item.status, status: isLeave ? item.finalStatus : item.status,
      start, end, dates: days.map((day) => day.date), days,
      totalDays: sum("days"), paidDays: sum("paidDays"), lopDays: sum("lopDays"), unallocatedDays: sum("unallocatedDays"),
      halfDayCount: days.filter((day) => day.days === 0.5).length,
      halfDayDays: roundLeaveDays(days.filter((day) => day.days === 0.5).length * 0.5),
      approvedCount: isLeave ? 1 : 0, approvedDays: isLeave ? sum("days") : 0,
      durationDays: sum("days"), reason: isLeave ? item.reason : item.remarks,
    });
  };
  leaves.forEach((leave) => addRecord(leave, "Leave"));
  attendance.forEach((record) => addRecord(record, "Attendance"));
  records.sort((a, b) => a.start.localeCompare(b.start) || a.employeeName.localeCompare(b.employeeName) || a.id.localeCompare(b.id));
  const summaryMap = new Map();
  for (const record of records) {
    if (!summaryMap.has(record.employeeKey)) summaryMap.set(record.employeeKey, { employeeKey: record.employeeKey,
      employeeName: record.employeeName, employeeId: record.employeeId, team: record.team, department: record.department,
      totalDays: 0, paidDays: 0, lopDays: 0, unallocatedDays: 0, halfDayCount: 0, halfDayDays: 0, approvedCount: 0, approvedDays: 0 });
    const summary = summaryMap.get(record.employeeKey);
    for (const field of ["totalDays", "paidDays", "lopDays", "unallocatedDays", "halfDayCount", "halfDayDays", "approvedCount", "approvedDays"]) summary[field] = roundLeaveDays(summary[field] + record[field]);
  }
  return { title: "Employee Leave Report", startDate, endDate, filterType: range.filterType, generatedAt: now.toISOString(), records,
    summary: [...summaryMap.values()].sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
    notes: ["Totals include only working dates inside the selected period. Half-day days are part of Total, not an additional amount.",
      "Paid/LOP uses the existing balance ledger; paid capacity is assigned to the earliest working dates of each request before date-range clipping.",
      "Unallocated means the dated payment split is unavailable or not yet credited. Undated balance adjustments are not assigned to guessed dates.",
      "Approved counts/days refer to final-approved leave requests. Manual attendance is listed separately; permission contributes zero leave days."],
  };
};

export const getLeaveCalendarReport = async (user, query) => {
  if (!["HR", "Manager"].includes(user.role)) throw Object.assign(new Error("Only HR and Manager can access calendar reports."), { status: 403 });
  const range = getCalendarReportRange(query);
  const leaveScope = user.role === "Manager" ? { managerId: user._id } : {};
  let attendanceScope = {};
  if (user.role === "Manager") {
    const employeeIds = await User.find(await getAuthorizedEmployeeFilter(user)).distinct("_id");
    attendanceScope = { employeeId: { $in: employeeIds } };
  }
  const [leaves, attendance, holidays] = await Promise.all([
    LeaveRequest.find({ ...leaveScope, finalStatus: { $in: FINAL_APPROVED_LEAVE_STATUSES }, requiresReapproval: { $ne: true },
      startDate: { $lte: range.endDate }, endDate: { $gte: range.startDate } })
      .populate("employeeId", "name employeeId").populate("subcategoryId", "name").populate("teamId", "name").lean(),
    AttendanceRecord.find({ ...attendanceScope, active: { $ne: false }, status: { $ne: "Cancelled" }, attendanceDate: { $gte: range.startDate, $lte: range.endDate } })
      .populate({ path: "employeeId", select: "name employeeId subcategoryId teamId", populate: [{ path: "subcategoryId", select: "name" }, { path: "teamId", select: "name" }] }).lean(),
    Holiday.find({}).select("holidayDate").lean(),
  ]);
  const employeeIds = [...new Set([...leaves, ...attendance].map((record) => id(record.employeeId)).filter(Boolean))];
  const ledger = employeeIds.length ? await LeaveBalanceLedger.find({ userId: { $in: employeeIds }, active: { $ne: false } })
    .populate("leaveRequestId", "finalStatus").sort({ effectiveDate: -1, createdAt: -1 }).lean() : [];
  return buildLeaveCalendarReport({ leaves, attendance, ledger, holidays, range });
};
