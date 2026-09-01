import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBalanceSummary,
  getPeriodsBetween,
  sourceKeyToObjectId,
} from "../services/leaveBalanceService.js";
import { createHrLeaveAdjustment } from "../controllers/leaveBalanceController.js";

const credit = (period, amount = 2) => ({
  entryType: "MONTHLY_CREDIT",
  period,
  amount,
  active: true,
  effectiveDate: `${period}-01T00:00:00.000Z`,
});

const approvedLeave = (period, days, active = true) => ({
  entryType: "APPROVED_LEAVE",
  period,
  amount: -days,
  leaveDays: days,
  active,
  effectiveDate: `${period}-10T00:00:00.000Z`,
  leaveRequestId: { finalStatus: "Approved by Manager" },
});

test("new month starts with two paid leaves", () => {
  const summary = calculateBalanceSummary([credit("2026-08")], "2026-08");
  assert.equal(summary.availablePaidLeave, 2);
  assert.equal(summary.excessLeaveDays, 0);
});

test("unused leave carries forward and combines with the next credit", () => {
  const summary = calculateBalanceSummary(
    [credit("2026-07"), approvedLeave("2026-07", 1), credit("2026-08")],
    "2026-08",
  );
  assert.equal(summary.carryForward, 1);
  assert.equal(summary.monthlyAllocation, 2);
  assert.equal(summary.availablePaidLeave, 3);
});

test("approved leave consumes paid capacity without going negative", () => {
  const summary = calculateBalanceSummary(
    [credit("2026-07"), credit("2026-08"), approvedLeave("2026-07", 1), approvedLeave("2026-08", 2)],
    "2026-08",
  );
  assert.equal(summary.availablePaidLeave, 1);
  assert.equal(summary.paidLeaveUsed, 3);
  assert.equal(summary.excessLeaveDays, 0);
});

test("leave beyond available balance is recorded as excess LOP", () => {
  const summary = calculateBalanceSummary(
    [credit("2026-07"), credit("2026-08"), approvedLeave("2026-07", 1), approvedLeave("2026-08", 4)],
    "2026-08",
  );
  assert.equal(summary.availablePaidLeave, 0);
  assert.equal(summary.paidLeaveUsed, 4);
  assert.equal(summary.excessLeaveDays, 1);
});

test("a later monthly credit does not erase previously recorded LOP", () => {
  const summary = calculateBalanceSummary(
    [
      credit("2026-07"),
      approvedLeave("2026-07", 3),
      credit("2026-08"),
    ],
    "2026-08",
  );
  assert.equal(summary.excessLeaveDays, 1);
  assert.equal(summary.availablePaidLeave, 2);
});

test("uninformed absence adds one LOP day without consuming paid leave", () => {
  const summary = calculateBalanceSummary(
    [
      credit("2026-08"),
      {
        entryType: "UNINFORMED_ABSENCE",
        period: "2026-08",
        amount: 0,
        leaveDays: 1,
        active: true,
        effectiveDate: "2026-08-11T00:00:00.000Z",
      },
    ],
    "2026-08",
  );

  assert.equal(summary.availablePaidLeave, 2);
  assert.equal(summary.paidLeaveUsed, 0);
  assert.equal(summary.uninformedAbsenceDays, 1);
  assert.equal(summary.excessLeaveDays, 1);
});

test("pending, rejected, and inactive reapproval entries consume nothing", () => {
  const inactive = approvedLeave("2026-08", 2, false);
  const stalePending = {
    ...approvedLeave("2026-08", 2),
    leaveRequestId: { finalStatus: "Pending Reapproval" },
  };
  const rejected = {
    ...approvedLeave("2026-08", 2),
    leaveRequestId: { finalStatus: "Rejected by Manager" },
  };
  const summary = calculateBalanceSummary(
    [credit("2026-08"), inactive, stalePending, rejected],
    "2026-08",
  );
  assert.equal(summary.availablePaidLeave, 2);
  assert.equal(summary.paidLeaveUsed, 0);
  assert.equal(summary.excessLeaveDays, 0);
});

test("a rejected leave charge is applied again after reapproval", () => {
  const entry = {
    ...approvedLeave("2026-08", 1),
    leaveRequestId: { finalStatus: "Rejected by HR" },
  };
  const rejectedSummary = calculateBalanceSummary(
    [credit("2026-08"), entry],
    "2026-08",
  );
  entry.leaveRequestId.finalStatus = "Approved by HR";
  const reapprovedSummary = calculateBalanceSummary(
    [credit("2026-08"), entry],
    "2026-08",
  );

  assert.equal(rejectedSummary.availablePaidLeave, 2);
  assert.equal(reapprovedSummary.availablePaidLeave, 1);
  assert.equal(reapprovedSummary.paidLeaveUsed, 1);
});

test("HR adjustments are auditable capacity changes", () => {
  const summary = calculateBalanceSummary(
    [
      credit("2026-08"),
      {
        entryType: "HR_ADJUSTMENT",
        period: "2026-08",
        amount: 1,
        active: true,
        effectiveDate: "2026-08-15T00:00:00.000Z",
      },
    ],
    "2026-08",
  );
  assert.equal(summary.availablePaidLeave, 3);
  assert.equal(summary.hrAdjustments, 1);
});

test("decimal HR adjustments retain hundredth-day precision", () => {
  const summary = calculateBalanceSummary(
    [
      credit("2026-08"),
      {
        entryType: "HR_ADJUSTMENT",
        period: "2026-08",
        amount: 0.1,
        active: true,
        effectiveDate: "2026-08-15T00:00:00.000Z",
      },
      {
        entryType: "HR_ADJUSTMENT",
        period: "2026-08",
        amount: 0.25,
        active: true,
        effectiveDate: "2026-08-16T00:00:00.000Z",
      },
    ],
    "2026-08",
  );

  assert.equal(summary.hrAdjustments, 0.35);
  assert.equal(summary.availablePaidLeave, 2.35);
});

test("period generation handles the December to January year boundary once", () => {
  assert.deepEqual(getPeriodsBetween("2026-12", "2027-02"), [
    "2026-12",
    "2027-01",
    "2027-02",
  ]);
});

test("automatic ledger source keys always resolve to the same database ID", () => {
  const first = sourceKeyToObjectId("leave:request-123").toString();
  const retry = sourceKeyToObjectId("leave:request-123").toString();
  const other = sourceKeyToObjectId("leave:request-456").toString();
  assert.equal(first, retry);
  assert.notEqual(first, other);
});

test("Employee users receive 403 from the adjustment controller", async () => {
  const response = {
    statusCode: 200,
    payload: null,
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.payload = value;
      return this;
    },
  };
  await createHrLeaveAdjustment(
    { user: { role: "Employee" }, params: {}, body: {} },
    response,
  );
  assert.equal(response.statusCode, 403);
  assert.equal(response.payload.success, false);
});

test("Manager passes management authorization", async () => {
  const response = {
    statusCode: 200,
    payload: null,
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.payload = value;
      return this;
    },
  };
  await createHrLeaveAdjustment(
    { user: { role: "Manager" }, params: { userId: "invalid" }, body: {} },
    response,
  );
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.message, "Invalid user ID");
});

test("adjustment endpoint rejects values beyond hundredth-day precision", async () => {
  const response = {
    statusCode: 200,
    payload: null,
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.payload = value;
      return this;
    },
  };

  await createHrLeaveAdjustment(
    {
      user: { role: "HR" },
      params: { userId: "507f1f77bcf86cd799439011" },
      body: { amount: 0.001, reason: "Test adjustment" },
    },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.equal(
    response.payload.message,
    "Adjustment must have no more than two decimal places",
  );
});
