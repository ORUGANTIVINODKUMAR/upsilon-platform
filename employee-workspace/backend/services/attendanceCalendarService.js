import { getRetrospectivePolicy } from "./leaveRequestPolicy.js";
import { FINAL_APPROVED_LEAVE_STATUSES } from "./leaveBalanceService.js";

export const dateKey = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";

export const calendarPeriod = (month, now = new Date()) => {
  const today = getRetrospectivePolicy(now).todayDate;
  const value = month || today.slice(0, 7);
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value) || value < "1900-01" || value > "9998-12") return null;
  const start = new Date(`${value}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { month: value, today, start, end };
};

// Leave requests that have not been decided yet. A past working day covered by
// one is not marked Present until the request is approved or rejected.
export const AWAITING_LEAVE_STATUSES = ["Pending Final Approval", "Pending Reapproval", "On Hold"];

// Display-only projection. Reading a calendar never creates ledger or attendance entries.
// A past working day is marked Present automatically unless approved leave, a
// leave request awaiting approval, or an absence recorded in the Leave calendar
// covers it. Today stays Pending until the day is over.
export const buildAttendanceCalendar = ({ period, employee, records = [], leaves = [], holidays = [] }) => {
  const holidayMap = new Map(holidays.map((holiday) => [dateKey(holiday.holidayDate), holiday]));
  const recordMap = new Map(records.filter((record) => record.active !== false && record.status !== "Cancelled")
    .map((record) => [dateKey(record.attendanceDate), record]));
  const liveLeaves = leaves.filter((leave) => !leave.isDeleted);
  const approvedLeaves = liveLeaves.filter((leave) => FINAL_APPROVED_LEAVE_STATUSES.includes(leave.finalStatus) && !leave.requiresReapproval);
  const awaitingLeaves = liveLeaves.filter((leave) => AWAITING_LEAVE_STATUSES.includes(leave.finalStatus)
    || (FINAL_APPROVED_LEAVE_STATUSES.includes(leave.finalStatus) && leave.requiresReapproval));
  const covering = (list, date) => list.find((item) => dateKey(item.startDate) <= date && dateKey(item.endDate) >= date);
  const days = [];
  for (let cursor = new Date(period.start); cursor < period.end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = dateKey(cursor);
    const day = { date, status: "", today: date === period.today, details: {} };
    const holiday = holidayMap.get(date);
    const record = recordMap.get(date);
    const leave = covering(approvedLeaves, date);
    const awaitingLeave = covering(awaitingLeaves, date);
    const treatment = record?.balanceTreatment || (record?.attendanceType === "PERMISSION" ? "NONE" : "LOP");
    const recordDetails = record ? { recordType: record.status,
      durationDays: record.durationDays ?? (record.attendanceType === "PERMISSION" ? 0 : record.attendanceType === "HALF_DAY" ? 0.5 : 1),
      balanceTreatment: treatment, remarks: record.remarks } : {};
    if (employee.dateOfJoining && date < dateKey(employee.dateOfJoining)) {
      day.details.note = "Before joining date";
    } else if (holiday) {
      day.status = "Holiday";
      day.details = { holiday: holiday.name, type: holiday.type };
    } else if ([0, 6].includes(cursor.getUTCDay())) {
      day.status = "Weekend";
    } else if (record && date <= period.today && treatment === "LOP") {
      day.status = "LOP";
      day.details = recordDetails;
    } else if (leave) {
      day.status = leave.workingDays === 0.5 && dateKey(leave.startDate) === dateKey(leave.endDate) ? "Half Day" : "Leave";
      day.details = { leaveType: leave.leaveType, approvalStatus: leave.finalStatus };
    } else if (record && date <= period.today) {
      day.status = record.attendanceType === "PERMISSION" ? "Permission"
        : record.attendanceType === "HALF_DAY" ? "Half Day" : "Leave";
      day.details = recordDetails;
    } else if (awaitingLeave && date <= period.today) {
      day.status = "Pending";
      day.details = { leaveType: awaitingLeave.leaveType, approvalStatus: awaitingLeave.finalStatus,
        note: "Leave request awaiting approval. Marked once it is approved or rejected." };
    } else if (date < period.today) {
      day.status = "Present";
      day.details.note = "Marked present automatically: no leave or absence was recorded for this working day.";
    } else if (date === period.today) {
      day.status = "Pending";
      day.details.note = "Marked present automatically after today ends, unless leave or an absence is recorded.";
    }
    days.push(day);
  }
  return days;
};
