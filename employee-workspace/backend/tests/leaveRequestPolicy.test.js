import assert from "node:assert/strict";
import test from "node:test";
import LeaveRequest from "../models/LeaveRequest.js";
import {
  BLOCKING_LEAVE_STATUSES,
  buildOverlapQuery,
  canCancelOwnLeaveRequest,
  describeLeaveTiming,
  validateLeaveDateRange,
} from "../services/leaveRequestPolicy.js";

const withPastLimit = (value, callback) => {
  const previousValue = process.env.PAST_LEAVE_LIMIT_DAYS;
  process.env.PAST_LEAVE_LIMIT_DAYS = String(value);

  try {
    callback();
  } finally {
    if (previousValue === undefined) delete process.env.PAST_LEAVE_LIMIT_DAYS;
    else process.env.PAST_LEAVE_LIMIT_DAYS = previousValue;
  }
};

test("a leave request from yesterday is accepted and marked retrospective", () => {
  withPastLimit(7, () => {
    const result = validateLeaveDateRange({
      startDate: "2026-08-09",
      endDate: "2026-08-09",
      now: new Date("2026-08-10T12:00:00.000Z"),
    });

    assert.equal(result.valid, true);
    assert.equal(result.requestKind, "Retrospective");
    assert.equal(result.retrospectiveDays, 1);
  });
});

test("the configured retrospective boundary is inclusive", () => {
  withPastLimit(7, () => {
    assert.equal(validateLeaveDateRange({
      startDate: "2026-08-03",
      endDate: "2026-08-03",
      now: "2026-08-10T09:00:00.000Z",
    }).valid, true);

    const tooOld = validateLeaveDateRange({
      startDate: "2026-08-02",
      endDate: "2026-08-02",
      now: "2026-08-10T09:00:00.000Z",
    });
    assert.equal(tooOld.valid, false);
    assert.equal(tooOld.code, "RETROSPECTIVE_LIMIT_EXCEEDED");
  });
});

test("invalid and reversed ranges return clear validation results", () => {
  assert.equal(validateLeaveDateRange({ startDate: "bad", endDate: "2026-08-10" }).valid, false);
  assert.equal(validateLeaveDateRange({
    startDate: "2026-08-11",
    endDate: "2026-08-10",
  }).message, "End date cannot be earlier than start date.");
});

test("overlap query catches duplicate and partially overlapping active requests", () => {
  const query = buildOverlapQuery({
    employeeId: "employee-1",
    startDate: new Date("2026-08-09"),
    endDate: new Date("2026-08-11"),
    excludeId: "request-being-edited",
  });

  assert.deepEqual(query.startDate, { $lte: new Date("2026-08-11") });
  assert.deepEqual(query.endDate, { $gte: new Date("2026-08-09") });
  assert.deepEqual(query.finalStatus, { $in: BLOCKING_LEAVE_STATUSES });
  assert.deepEqual(query._id, { $ne: "request-being-edited" });
  assert.ok(BLOCKING_LEAVE_STATUSES.includes("Pending Final Approval"));
  assert.ok(BLOCKING_LEAVE_STATUSES.includes("Approved by HR"));
  assert.ok(!BLOCKING_LEAVE_STATUSES.includes("Rejected by HR"));
  assert.ok(!BLOCKING_LEAVE_STATUSES.includes("Cancelled"));
});

test("only the owner can cancel a pending request", () => {
  assert.equal(canCancelOwnLeaveRequest({
    ownerId: "employee-1",
    userId: "employee-1",
    finalStatus: "Pending Final Approval",
  }), true);
  assert.equal(canCancelOwnLeaveRequest({
    ownerId: "employee-1",
    userId: "employee-2",
    finalStatus: "Pending Final Approval",
  }), false);
  assert.equal(canCancelOwnLeaveRequest({
    ownerId: "employee-1",
    userId: "employee-1",
    finalStatus: "Approved by Manager",
  }), false);
});

test("submission date remains independent from the leave date", () => {
  assert.deepEqual(
    describeLeaveTiming("2026-08-09", "2026-08-10T14:30:00.000Z"),
    { requestKind: "Retrospective", retrospectiveDays: 1 },
  );
});

test("the business time zone determines today near the UTC date boundary", () => {
  const previousTimeZone = process.env.LEAVE_TIME_ZONE;
  process.env.LEAVE_TIME_ZONE = "Asia/Kolkata";

  try {
    const result = validateLeaveDateRange({
      startDate: "2026-08-10",
      endDate: "2026-08-10",
      now: "2026-08-09T19:00:00.000Z",
    });
    assert.equal(result.requestKind, "Standard");
    assert.equal(result.policy.todayDate, "2026-08-10");
  } finally {
    if (previousTimeZone === undefined) delete process.env.LEAVE_TIME_ZONE;
    else process.env.LEAVE_TIME_ZONE = previousTimeZone;
  }
});

test("the schema preserves approval statuses and supports cancellation audit history", () => {
  const finalStatuses = LeaveRequest.schema.path("finalStatus").enumValues;
  const historyActions = LeaveRequest.schema.path("approvalHistory").schema.path("action").enumValues;

  assert.ok(finalStatuses.includes("Pending Final Approval"));
  assert.ok(finalStatuses.includes("Approved by Manager"));
  assert.ok(finalStatuses.includes("Rejected by HR"));
  assert.ok(finalStatuses.includes("Cancelled"));
  assert.ok(historyActions.includes("Submitted"));
  assert.ok(historyActions.includes("Approved"));
  assert.ok(historyActions.includes("Cancelled"));
});
