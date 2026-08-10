import test from "node:test";
import assert from "node:assert/strict";
import { validateMailConfiguration } from "../config/mail.js";
import {
  getDailyLeaveSummaryConfig,
  shouldRunDailyLeaveSummary,
} from "../config/dailyLeaveSummary.js";
import {
  buildDailyLeaveSummaryEmail,
  buildLeaveRequestEmail,
  getLeaveDurationLabel,
} from "../services/leaveEmailTemplates.js";
import {
  getLeaveNotificationRecipients,
  getManagerVisibleTeamIds,
} from "../services/leaveEmailRecipientService.js";
import { sendLeaveRequestNotification } from "../services/emailService.js";
import {
  claimDailyEmailDispatch,
  leaveAppliesToDate,
} from "../services/dailyLeaveSummaryService.js";

const users = {
  employee: { _id: "employee", name: "John Doe", email: "john@example.com", role: "Employee" },
  manager: { _id: "manager", name: "Mary Manager", email: "manager@example.com", role: "Manager", isActive: true },
  hr: { _id: "hr", name: "Helen HR", email: "hr@example.com", role: "HR", isActive: true },
};

test("invalid SMTP configuration reports every missing required value", () => {
  const result = validateMailConfiguration({});
  assert.equal(result.valid, false);
  assert.deepEqual(result.missingVariables, ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"]);
});

test("leave request recipients include assigned managers and active HR without duplicates", () => {
  const recipients = getLeaveNotificationRecipients({
    team: { managerIds: [users.manager] },
    hrUsers: [users.hr, users.hr],
    employeeId: users.employee._id,
  });
  assert.deepEqual(recipients.map((user) => user.role).sort(), ["HR", "Manager"]);
});

test("notification delivery attempts both Manager and HR and includes all leave data", async () => {
  const messages = [];
  const leaveRequest = {
    _id: "leave-1", leaveType: "Sick", startDate: new Date("2026-08-10"),
    endDate: new Date("2026-08-11"), workingDays: 2, reason: "Medical recovery",
    finalStatus: "Pending Final Approval",
  };
  const result = await sendLeaveRequestNotification({
    recipients: [users.manager, users.hr], employee: users.employee, leaveRequest,
    reviewUrl: "https://workspace.example.com/dashboard?page=managerApprovals",
    send: async (message) => messages.push(message),
  });
  assert.deepEqual(result, { attempted: 2, sent: 2, failed: 0 });
  assert.deepEqual(messages.map((message) => message.to), [users.manager.email, users.hr.email]);
  const html = buildLeaveRequestEmail(messages[0]);
  for (const value of ["John Doe", "Sick", "Medical recovery", "Pending Final Approval", "2", "Review leave request"]) {
    assert.match(html, new RegExp(value));
  }
});

test("email delivery failure is returned to the caller instead of being swallowed", async () => {
  const result = await sendLeaveRequestNotification({
    recipients: [users.manager, users.hr], employee: users.employee,
    leaveRequest: { _id: "leave-2", leaveType: "Casual", startDate: new Date(), endDate: new Date(), workingDays: 1, reason: "Personal", finalStatus: "Pending Final Approval" },
    send: async ({ to }) => { if (to === users.manager.email) throw new Error("SMTP unavailable"); },
  });
  assert.deepEqual(result, { attempted: 2, sent: 1, failed: 1 });
});

test("date filtering includes current and spanning leave but excludes unrelated dates", () => {
  const target = new Date("2026-08-10T00:00:00.000Z");
  assert.equal(leaveAppliesToDate({ startDate: "2026-08-10", endDate: "2026-08-10" }, target), true);
  assert.equal(leaveAppliesToDate({ startDate: "2026-08-09", endDate: "2026-08-12" }, target), true);
  assert.equal(leaveAppliesToDate({ startDate: "2026-08-11", endDate: "2026-08-12" }, target), false);
});

test("daily template represents half-day leave accurately", () => {
  const leave = { employeeName: "Jane Smith", leaveType: "Casual", startDate: "2026-08-10", endDate: "2026-08-10", workingDays: 0.5, finalStatus: "Approved by HR" };
  assert.equal(getLeaveDurationLabel(leave), "Half Day");
  assert.match(buildDailyLeaveSummaryEmail({ date: "2026-08-10", leaves: [leave], scopeLabel: "Organization-wide view" }), /Half Day/);
});

test("scheduler runs after configured time Monday-Friday and never on weekends", () => {
  const config = getDailyLeaveSummaryConfig({ LEAVE_TIME_ZONE: "Asia/Kolkata", DAILY_LEAVE_SUMMARY_HOUR: "9", DAILY_LEAVE_SUMMARY_MINUTE: "0" });
  assert.equal(shouldRunDailyLeaveSummary(new Date("2026-08-10T04:00:00.000Z"), config), true); // Monday 09:30 IST
  assert.equal(shouldRunDailyLeaveSummary(new Date("2026-08-10T03:00:00.000Z"), config), false);
  assert.equal(shouldRunDailyLeaveSummary(new Date("2026-08-09T04:00:00.000Z"), config), false); // Sunday
  assert.equal(shouldRunDailyLeaveSummary(new Date("2026-08-15T04:00:00.000Z"), config), false); // Saturday
});

test("persistent dispatch claim prevents a second daily email", async () => {
  let record;
  const DispatchModel = {
    async create(input) {
      if (record) { const error = new Error("duplicate"); error.code = 11000; throw error; }
      record = { ...input, save: async () => record };
      return record;
    },
    async findOneAndUpdate() { return record.status === "Sent" ? null : record; },
  };
  const first = await claimDailyEmailDispatch({ dateKey: "2026-08-10", recipientKey: "hr@example.com", DispatchModel });
  first.status = "Sent";
  const second = await claimDailyEmailDispatch({ dateKey: "2026-08-10", recipientKey: "hr@example.com", DispatchModel });
  assert.ok(first);
  assert.equal(second, null);
});

test("manager visibility is limited to managed or assigned teams while HR can use all leaves", () => {
  const teams = [
    { _id: "team-a", managerIds: ["manager"] },
    { _id: "team-b", managerIds: ["another-manager"] },
  ];
  assert.deepEqual(getManagerVisibleTeamIds({ _id: "manager", assignedTeamIds: [] }, teams), ["team-a"]);
  const allLeaves = [{ teamId: "team-a" }, { teamId: "team-b" }];
  const visible = new Set(getManagerVisibleTeamIds({ _id: "manager", assignedTeamIds: [] }, teams));
  assert.deepEqual(allLeaves.filter((leave) => visible.has(leave.teamId)), [{ teamId: "team-a" }]);
  assert.equal(allLeaves.length, 2); // HR organization-wide view
});

