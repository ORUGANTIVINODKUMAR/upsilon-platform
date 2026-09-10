import assert from "node:assert/strict";
import test from "node:test";
import { buildAttendanceCalendar, calendarPeriod } from "../services/attendanceCalendarService.js";
import { getAttendanceCalendar } from "../controllers/attendanceController.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Holiday from "../models/Holiday.js";
import LeaveBalanceLedger from "../models/LeaveBalanceLedger.js";

const period = calendarPeriod("2026-09", new Date("2026-09-08T07:00:00Z"));
const days = (options = {}) => buildAttendanceCalendar({ period, employee: {}, ...options });
const day = (date, options) => days(options).find((item) => item.date === date);
const record = (overrides = {}) => ({ attendanceDate: "2026-09-07", attendanceType: "FULL_DAY", balanceTreatment: "LOP", durationDays: 1, active: true, ...overrides });
const leave = (overrides = {}) => ({ startDate: "2026-09-07", endDate: "2026-09-10", finalStatus: "Approved by Manager", leaveType: "Casual", ...overrides });

test("month parsing, leap years, December rollover, and backend business day", () => {
  for (const invalid of ["2026-13", "2026-9", "2026-09-01", "0000-01", ["2026-09"]]) assert.equal(calendarPeriod(invalid), null);
  assert.equal(days({ period: calendarPeriod("2024-02") }).length, 29);
  assert.equal(calendarPeriod("2026-12").end.toISOString(), "2027-01-01T00:00:00.000Z");
  const previous = process.env.LEAVE_TIME_ZONE;
  try {
    process.env.LEAVE_TIME_ZONE = "Asia/Kolkata";
    assert.equal(calendarPeriod(undefined, new Date("2026-09-07T19:00:00Z")).today, "2026-09-08");
    process.env.LEAVE_TIME_ZONE = "America/New_York";
    assert.equal(calendarPeriod(undefined, new Date("2026-09-08T01:00:00Z")).today, "2026-09-07");
  } finally {
    if (previous === undefined) delete process.env.LEAVE_TIME_ZONE;
    else process.env.LEAVE_TIME_ZONE = previous;
  }
});

test("past working days are display-only absent, today pending, future blank, pre-joining blank", () => {
  assert.equal(day("2026-09-07").status, "Absent");
  assert.match(day("2026-09-07").details.note, /no LOP deduction/);
  assert.equal(day("2026-09-08").status, "Pending");
  assert.equal(day("2026-09-08").today, true);
  assert.equal(day("2026-09-09").status, "");
  assert.equal(day("2026-09-07", { employee: { dateOfJoining: "2026-09-08" } }).status, "");
});

test("weekends and configured holidays override leave/LOP, including future dates", () => {
  assert.equal(day("2026-09-05", { records: [record({ attendanceDate: "2026-09-05" })] }).status, "Weekend");
  assert.equal(day("2026-09-12").status, "Weekend");
  const result = day("2026-09-10", { holidays: [{ holidayDate: "2026-09-10", name: "Company day" }], leaves: [leave()] });
  assert.equal(result.status, "Holiday");
  assert.equal(result.details.holiday, "Company day");
});

test("only final approved leave affects calendar, including future approved leave", () => {
  for (const finalStatus of ["Approved by Manager", "Approved by HR"]) {
    assert.equal(day("2026-09-10", { leaves: [leave({ finalStatus })] }).status, "Leave");
  }
  for (const finalStatus of ["Pending Final Approval", "Pending Reapproval", "On Hold", "Rejected by HR", "Cancelled"]) {
    assert.equal(day("2026-09-07", { leaves: [leave({ finalStatus })] }).status, "Absent");
  }
  assert.equal(day("2026-09-07", { leaves: [leave({ isDeleted: true })] }).status, "Absent");
  assert.equal(day("2026-09-07", { leaves: [leave({ requiresReapproval: true })] }).status, "Absent");
});

test("manual paid, half-day, LOP, and permission preserve their actual duration and treatment", () => {
  assert.equal(day("2026-09-07", { records: [record({ balanceTreatment: "PAID" })] }).status, "Leave");
  assert.equal(day("2026-09-07", { records: [record({ balanceTreatment: "PAID", attendanceType: "HALF_DAY", durationDays: 0.5 })] }).status, "Half Day");
  const halfLop = day("2026-09-07", { records: [record({ attendanceType: "HALF_DAY", durationDays: 0.5 })] });
  assert.equal(halfLop.status, "LOP");
  assert.equal(halfLop.details.durationDays, 0.5);
  assert.equal(day("2026-09-07", { records: [record({ attendanceType: "PERMISSION", balanceTreatment: "NONE", durationDays: 0 })] }).status, "Permission");
  assert.equal(day("2026-09-08", { records: [record({ attendanceDate: "2026-09-08" })] }).status, "LOP");
});

test("cancelled records do not affect calendar; future attendance is not inferred; inputs are unchanged", () => {
  const records = [record({ active: false })];
  const before = structuredClone(records);
  assert.equal(day("2026-09-07", { records }).status, "Absent");
  assert.deepEqual(records, before);
  assert.equal(day("2026-09-07", { records: [record({ status: "Cancelled" })] }).status, "Absent");
  assert.equal(day("2026-09-09", { records: [record({ attendanceDate: "2026-09-09" })] }).status, "");
});

test("status precedence and legacy LOP defaults do not mislabel paid leave", () => {
  assert.equal(day("2026-09-07", { records: [record({ balanceTreatment: undefined })] }).status, "LOP");
  assert.equal(day("2026-09-07", { records: [record()], leaves: [leave()] }).status, "LOP");
  assert.equal(day("2026-09-07", { records: [record({ attendanceType: "PERMISSION", balanceTreatment: "NONE" })], leaves: [leave()] }).status, "Leave");
  assert.equal(day("2026-09-07", { leaves: [leave({ endDate: "2026-09-07", workingDays: 0.5 })] }).status, "Half Day");
  assert.equal(day("2026-09-07", { leaves: [leave({ workingDays: 0.5 })] }).status, "Leave");
});

const query = (result) => ({ select() { return this; }, populate() { return this; }, sort() { return this; }, lean: async () => result, distinct: async () => result });
const response = () => ({ code: 200, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test("calendar API scopes every role, rejects employee-ID tampering, and performs no writes", async (t) => {
  const filters = [];
  t.mock.method(User, "find", (filter) => { filters.push(filter); return query([{ _id: "self", name: "Own employee", role: "Employee" }]); });
  const teamFilters = [];
  t.mock.method(Team, "find", (filter) => { teamFilters.push(filter); return query([]); });
  const attendanceFilters = [];
  t.mock.method(AttendanceRecord, "find", (filter) => { attendanceFilters.push(filter); return query([]); });
  t.mock.method(LeaveRequest, "find", () => query([]));
  t.mock.method(Holiday, "find", () => query([]));
  for (const model of [AttendanceRecord, LeaveRequest, LeaveBalanceLedger]) {
    for (const method of ["create", "updateOne", "bulkWrite", "insertMany"]) {
      t.mock.method(model, method, () => { assert.fail("Calendar must not write data"); });
    }
  }
  for (const role of ["Employee", "TeamLeader", "Manager", "HR", "Admin", "Finance"]) {
    const res = response();
    await getAttendanceCalendar({ user: { _id: "self", role, assignedTeamIds: ["managed-team"] }, query: { month: "2026-09" } }, res);
    assert.equal(res.code, 200);
    assert.deepEqual(attendanceFilters.at(-1).employeeId, { $in: ["self"] });
    const filter = filters.at(-1);
    assert.equal(filter.isActive, true);
    if (role === "Employee") assert.equal(filter._id, "self");
    if (role === "TeamLeader") {
      assert.deepEqual(filter.$or, [{ _id: "self" }, { teamLeaderId: "self" }, { teamId: { $in: [] } }]);
      assert.deepEqual(teamFilters.at(-1), { teamLeaderId: "self" });
    }
    if (role === "Manager") {
      assert.deepEqual(filter._id, { $ne: "self" });
      assert.deepEqual(filter.$or, [{ managerId: "self" }, { teamId: { $in: ["managed-team"] } }]);
    }
    const denied = response();
    await getAttendanceCalendar({ user: { _id: "self", role }, query: { month: "2026-09", employeeId: "unrelated" } }, denied);
    assert.equal(denied.code, 403);
  }
  const invalid = response();
  await getAttendanceCalendar({ user: { _id: "self", role: "Employee" }, query: { month: "2026-99" } }, invalid);
  assert.equal(invalid.code, 400);
});
