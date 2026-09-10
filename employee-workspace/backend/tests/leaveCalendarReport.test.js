import assert from "node:assert/strict";
import test from "node:test";
import { buildLeaveCalendarReport, getCalendarReportRange, getLeaveCalendarReport } from "../services/leaveCalendarReportService.js";
import { calculateBalanceSummary } from "../services/leaveBalanceService.js";
import { calendarLeaveReport } from "../controllers/leaveCalendarReportController.js";
import LeaveRequest from "../models/LeaveRequest.js";
import AttendanceRecord from "../models/AttendanceRecord.js";
import LeaveBalanceLedger from "../models/LeaveBalanceLedger.js";
import Holiday from "../models/Holiday.js";
import User from "../models/User.js";
import Team from "../models/Team.js";

const employee = { _id: "employee-1", name: "Employee One", employeeId: "E001", teamId: { name: "Team One" }, subcategoryId: { name: "Tax" } };
const leave = (values = {}) => ({ _id: "leave-1", employeeId: employee, startDate: "2026-09-03", endDate: "2026-09-08", workingDays: 4,
  finalStatus: "Approved by HR", leaveType: "Casual", teamId: employee.teamId, subcategoryId: employee.subcategoryId, ...values });
const attendance = (values = {}) => ({ _id: "attendance-1", employeeId: employee, attendanceDate: "2026-09-09", attendanceType: "HALF_DAY", durationDays: 0.5,
  balanceTreatment: "LOP", status: "Half Day Leave", active: true, ...values });
const credit = (values = {}) => ({ userId: employee._id, entryType: "MONTHLY_CREDIT", effectiveDate: "2026-09-01", period: "2026-09", amount: 2, active: true, ...values });
const charge = (values = {}) => ({ userId: employee._id, entryType: "APPROVED_LEAVE", effectiveDate: "2026-09-03", period: "2026-09", amount: -4, leaveDays: 4,
  leaveRequestId: { _id: "leave-1", finalStatus: "Approved by HR" }, active: true, ...values });
const report = (values = {}) => buildLeaveCalendarReport({ leaves: [leave()], attendance: [], ledger: [credit(), charge()], holidays: [],
  range: getCalendarReportRange({ filterType: "month", month: "2026-09" }), now: new Date("2026-09-10T10:00:00Z"), ...values });

test("calendar report validates day/week/month/custom and preserves Sunday weeks", () => {
  assert.equal(getCalendarReportRange({ filterType: "day", date: "2026-09-10" }).startDate.toISOString(), "2026-09-10T00:00:00.000Z");
  const week = getCalendarReportRange({ filterType: "week", date: "2026-09-10" });
  assert.equal(week.startDate.toISOString(), "2026-09-06T00:00:00.000Z");
  assert.equal(week.endDate.toISOString(), "2026-09-12T23:59:59.999Z");
  assert.equal(getCalendarReportRange({ filterType: "month", month: "2024-02" }).endDate.toISOString(), "2024-02-29T23:59:59.999Z");
  assert.throws(() => getCalendarReportRange({ filterType: "custom", startDate: "2026-09-10", endDate: "2026-09-01" }), RangeError);
  assert.throws(() => getCalendarReportRange({ filterType: "day", date: "2026-02-30" }), RangeError);
  assert.throws(() => getCalendarReportRange({ filterType: "custom", startDate: "2024-01-01", endDate: "2025-01-01" }), /366/);
  assert.doesNotThrow(() => getCalendarReportRange({ filterType: "custom", startDate: "2024-01-01", endDate: "2024-12-31" }));
});

test("multi-day leave excludes weekends and splits paid/LOP using the balance ledger", () => {
  const result = report();
  assert.deepEqual(result.records[0].dates, ["2026-09-03", "2026-09-04", "2026-09-07", "2026-09-08"]);
  assert.equal(result.summary[0].totalDays, 4);
  assert.equal(result.summary[0].paidDays, 2);
  assert.equal(result.summary[0].lopDays, 2);
  assert.equal(result.summary[0].approvedCount, 1);
  assert.equal(result.summary[0].approvedDays, 4);
});

test("partial periods allocate across the whole request before clipping", () => {
  const result = report({ range: getCalendarReportRange({ filterType: "custom", startDate: "2026-09-04", endDate: "2026-09-07" }) });
  assert.deepEqual(result.records[0].dates, ["2026-09-04", "2026-09-07"]);
  assert.equal(result.summary[0].totalDays, 2);
  assert.equal(result.summary[0].paidDays, 1);
  assert.equal(result.summary[0].lopDays, 1);
  const weekend = report({ range: getCalendarReportRange({ filterType: "day", date: "2026-09-05" }) });
  assert.deepEqual(weekend.records, []);
});

test("holidays and leave spanning months or years do not inflate selected-period totals", () => {
  const result = report({ leaves: [leave({ startDate: "2025-12-31", endDate: "2026-01-05", workingDays: 3 })], ledger: [],
    holidays: [{ holidayDate: "2026-01-01" }], range: getCalendarReportRange({ filterType: "month", month: "2026-01" }) });
  assert.deepEqual(result.records[0].dates, ["2026-01-02", "2026-01-05"]);
  assert.equal(result.summary[0].totalDays, 2);
  assert.equal(result.summary[0].unallocatedDays, 2);
});

test("half-day leave and paid/LOP attendance contribute 0.5 without double counting", () => {
  const result = report({ leaves: [leave({ startDate: "2026-09-03", endDate: "2026-09-03", workingDays: 0.5 })],
    attendance: [attendance(), attendance({ _id: "paid-half", attendanceDate: "2026-09-10", balanceTreatment: "PAID" })],
    ledger: [credit(), charge({ amount: -0.5, leaveDays: 0.5 }), { ...charge({ entryType: "ATTENDANCE_PAID_LEAVE", effectiveDate: "2026-09-10", leaveDays: 0.5 }), attendanceRecordId: "paid-half" }] });
  const row = result.summary[0];
  assert.equal(row.totalDays, 1.5);
  assert.equal(row.paidDays, 1);
  assert.equal(row.lopDays, 0.5);
  assert.equal(row.halfDayCount, 3);
  assert.equal(row.halfDayDays, 1.5);
  assert.equal(row.approvedDays, 0.5);
  assert.equal(row.approvedCount, 1);
});

test("permission has zero days and explicit manual LOP requires no ledger", () => {
  const result = report({ leaves: [], ledger: [], attendance: [attendance(), attendance({ _id: "permission", attendanceDate: "2026-09-10", attendanceType: "PERMISSION", balanceTreatment: "NONE", durationDays: 0, status: "Permission" })] });
  assert.equal(result.records.length, 2);
  assert.equal(result.summary[0].totalDays, 0.5);
  assert.equal(result.summary[0].lopDays, 0.5);
  assert.equal(result.summary[0].approvedCount, 0);
});

test("leave before the selected range still consumes paid capacity for later records", () => {
  const result = report({ leaves: [leave({ _id: "later", startDate: "2026-09-09", endDate: "2026-09-10", workingDays: 2 })],
    ledger: [credit({ amount: 3 }), charge({ leaveDays: 2, amount: -2 }), charge({ leaveRequestId: { _id: "later", finalStatus: "Approved by HR" }, effectiveDate: "2026-09-09", leaveDays: 2, amount: -2 })],
    range: getCalendarReportRange({ filterType: "custom", startDate: "2026-09-09", endDate: "2026-09-10" }) });
  assert.equal(result.summary[0].totalDays, 2);
  assert.equal(result.summary[0].paidDays, 1);
  assert.equal(result.summary[0].lopDays, 1);
});

test("paid attendance can be partly LOP when available paid capacity is fractional", () => {
  const result = report({ leaves: [], attendance: [attendance({ balanceTreatment: "PAID" })], ledger: [credit({ amount: 0.25 }),
    charge({ entryType: "ATTENDANCE_PAID_LEAVE", attendanceRecordId: "attendance-1", effectiveDate: "2026-09-09", leaveDays: 0.5, amount: 0 })] });
  assert.equal(result.summary[0].paidDays, 0.25);
  assert.equal(result.summary[0].lopDays, 0.25);
  assert.equal(result.summary[0].totalDays, 0.5);
  assert.equal(result.summary[0].halfDayCount, 1);
});

test("rejected, cancelled, deleted, reapproval and inactive records are excluded", () => {
  for (const finalStatus of ["Pending Final Approval", "Rejected by HR", "Cancelled", "On Hold", "Pending Reapproval"]) assert.equal(report({ leaves: [leave({ finalStatus })] }).records.length, 0);
  for (const values of [{ isDeleted: true }, { requiresReapproval: true }]) assert.equal(report({ leaves: [leave(values)] }).records.length, 0);
  for (const values of [{ active: false }, { status: "Cancelled" }]) assert.equal(report({ leaves: [], attendance: [attendance(values)] }).records.length, 0);
});

test("missing/inactive/future ledger splits remain unallocated instead of inventing paid days", () => {
  assert.equal(report({ ledger: [] }).summary[0].unallocatedDays, 4);
  assert.equal(report({ ledger: [credit(), charge({ active: false })] }).summary[0].unallocatedDays, 4);
  assert.equal(report({ now: new Date("2026-08-31T12:00:00Z") }).summary[0].unallocatedDays, 4);
});

test("employee IDs keep same-name employees separate and summary equals detail totals", () => {
  const result = report({ attendance: [attendance({ employeeId: { ...employee, _id: "employee-2" } })] });
  assert.equal(result.summary.length, 2);
  for (const summary of result.summary) {
    const rows = result.records.filter((row) => row.employeeKey === summary.employeeKey);
    assert.equal(summary.totalDays, rows.reduce((sum, row) => sum + row.totalDays, 0));
    assert.equal(summary.totalDays, summary.paidDays + summary.lopDays + summary.unallocatedDays);
  }
});

test("allocation callback uses existing consumption rules once and leaves summary unchanged", () => {
  const entries = [credit({ effectiveDate: "2026-08-01", period: "2026-08" }), charge({ effectiveDate: "2026-08-10", period: "2026-08" })];
  const allocations = [];
  const before = structuredClone(entries);
  const expected = calculateBalanceSummary(entries, "2026-09");
  const actual = calculateBalanceSummary(entries, "2026-09", { onLeaveAllocated: (entry, allocation) => allocations.push(allocation) });
  assert.deepEqual(actual, expected);
  assert.deepEqual(allocations, [{ paidDays: 2, lopDays: 2 }]);
  assert.deepEqual(entries, before);
});

const queryResult = (result) => ({ populate() { return this; }, select() { return this; }, sort() { return this; }, lean: async () => result, distinct: async () => result });
test("report endpoint permits only HR/Manager and preserves both existing Manager scopes", async (t) => {
  for (const role of ["Employee", "TeamLeader", "Admin", "Finance"]) await assert.rejects(getLeaveCalendarReport({ role }, {}), { status: 403 });
  let leaveFilter;
  let attendanceFilter;
  let userFilter;
  t.mock.method(LeaveRequest, "find", (filter) => { leaveFilter = filter; return queryResult([]); });
  t.mock.method(AttendanceRecord, "find", (filter) => { attendanceFilter = filter; return queryResult([]); });
  t.mock.method(Holiday, "find", () => queryResult([]));
  t.mock.method(User, "find", (filter) => { userFilter = filter; return queryResult(["direct-report"]); });
  t.mock.method(Team, "find", () => queryResult([]));
  for (const model of [LeaveRequest, AttendanceRecord, LeaveBalanceLedger]) {
    for (const method of ["create", "updateOne", "bulkWrite"]) t.mock.method(model, method, () => assert.fail("Report reads must not write"));
  }
  await getLeaveCalendarReport({ role: "Manager", _id: "manager-1", assignedTeamIds: ["team-1"] }, { filterType: "month", month: "2026-09" });
  assert.equal(leaveFilter.managerId, "manager-1");
  assert.deepEqual(leaveFilter.finalStatus, { $in: ["Approved by Manager", "Approved by HR"] });
  assert.deepEqual(userFilter.$or, [{ managerId: "manager-1" }, { teamId: { $in: ["team-1"] } }]);
  assert.deepEqual(attendanceFilter.employeeId, { $in: ["direct-report"] });
  await getLeaveCalendarReport({ role: "HR", _id: "hr-1" }, { filterType: "month", month: "2026-09" });
  assert.equal(leaveFilter.managerId, undefined);
  assert.equal(attendanceFilter.employeeId, undefined);
});

test("controller returns useful validation and authorization errors", async () => {
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await calendarLeaveReport({ user: { role: "Employee" }, query: {} }, res);
  assert.equal(res.statusCode, 403);
  await calendarLeaveReport({ user: { role: "HR" }, query: { filterType: "month", month: "invalid" } }, res);
  assert.equal(res.statusCode, 400);
});
