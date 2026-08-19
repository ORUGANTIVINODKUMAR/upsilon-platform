import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import LeaveRequest from "../models/LeaveRequest.js";
import {
  applyManagedLeaveStatus,
  getManagedLeaveStatuses,
} from "../services/leaveStatusTransitionService.js";

const actorId = new mongoose.Types.ObjectId();

const request = (finalStatus) => ({
  finalStatus,
  managerStatus: "Pending",
  hrStatus: "Pending",
  managerRejectionReason: "",
  hrRejectionReason: "",
  rejectionReason: "",
  requiresReapproval: false,
  statusHistory: [],
  approvalHistory: [],
});

const assertTransition = ({ role, from, to, expectedDecision }) => {
  const leaveRequest = request(from);
  applyManagedLeaveStatus({
    leaveRequest,
    status: to,
    role,
    actorId,
    remarks: "  reviewed  ",
    now: new Date("2026-08-19T08:00:00.000Z"),
  });

  const prefix = role === "Manager" ? "manager" : "hr";
  assert.equal(leaveRequest.finalStatus, to);
  assert.equal(leaveRequest[`${prefix}Status`], expectedDecision);
  assert.equal(leaveRequest.statusHistory.at(-1).previousStatus, from);
  assert.equal(leaveRequest.statusHistory.at(-1).newStatus, to);
  assert.equal(leaveRequest.statusHistory.at(-1).remarks, "reviewed");
  assert.equal(leaveRequest.approvalHistory.at(-1).action, "Status Changed");
  assert.equal(
    leaveRequest.approvalHistory.at(-1).remarks,
    `${from} -> ${to} | reviewed`,
  );

  if (expectedDecision === "Rejected") {
    assert.equal(leaveRequest.rejectionReason, "reviewed");
    assert.equal(leaveRequest[`${prefix}RejectionReason`], "reviewed");
  } else {
    assert.equal(leaveRequest.rejectionReason, "");
    assert.equal(leaveRequest[`${prefix}RejectionReason`], "");
    assert.equal(leaveRequest[`${prefix}ApprovedBy`], actorId);
  }
};

for (const role of ["Manager", "HR"]) {
  const approved = `Approved by ${role}`;
  const rejected = `Rejected by ${role}`;

  test(`${role}: Pending -> Approved`, () => {
    assertTransition({
      role,
      from: "Pending Final Approval",
      to: approved,
      expectedDecision: "Approved",
    });
  });

  test(`${role}: Pending -> Rejected`, () => {
    assertTransition({
      role,
      from: "Pending Final Approval",
      to: rejected,
      expectedDecision: "Rejected",
    });
  });

  test(`${role}: Approved -> Rejected`, () => {
    assertTransition({
      role,
      from: approved,
      to: rejected,
      expectedDecision: "Rejected",
    });
  });

  test(`${role}: Rejected -> Approved`, () => {
    assertTransition({
      role,
      from: rejected,
      to: approved,
      expectedDecision: "Approved",
    });
  });
}

test("roles can only assign statuses attributed to themselves", () => {
  assert.deepEqual(getManagedLeaveStatuses("Manager"), [
    "Pending Final Approval",
    "On Hold",
    "Approved by Manager",
    "Rejected by Manager",
  ]);
  assert.equal(getManagedLeaveStatuses("Employee").length, 0);
});

test("legacy leave requests without submittedAt remain valid for status updates", async () => {
  const leaveRequest = LeaveRequest.hydrate({
    _id: new mongoose.Types.ObjectId(),
    employeeId: new mongoose.Types.ObjectId(),
    subcategoryId: new mongoose.Types.ObjectId(),
    leaveType: "Casual",
    startDate: new Date("2026-07-01T00:00:00.000Z"),
    endDate: new Date("2026-07-01T00:00:00.000Z"),
    reason: "Legacy request",
    finalStatus: "Approved by HR",
  });

  await assert.doesNotReject(() => leaveRequest.validate());
});

test("new leave requests still receive a submittedAt timestamp", () => {
  const leaveRequest = new LeaveRequest();
  assert.ok(leaveRequest.submittedAt instanceof Date);
});
