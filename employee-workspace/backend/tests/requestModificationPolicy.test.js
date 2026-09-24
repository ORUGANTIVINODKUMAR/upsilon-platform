import test from "node:test";
import assert from "node:assert/strict";
import LeaveRequest from "../models/LeaveRequest.js";
import ReimbursementRequest from "../models/ReimbursementRequest.js";
import { canDeleteOwnLeaveRequest } from "../services/leaveRequestPolicy.js";
import {
  canDeleteOwnReimbursement,
  canEditOwnReimbursement,
  validateReimbursementInput,
} from "../services/reimbursementRequestPolicy.js";

const pendingReimbursement = {
  employeeId: "employee-1",
  finalStatus: "Pending Final Approval",
};

test("employee can edit their own pending reimbursement", () => {
  assert.equal(canEditOwnReimbursement(pendingReimbursement, "employee-1"), true);
});

test("employee cannot edit another employee reimbursement or an approved request", () => {
  assert.equal(canEditOwnReimbursement(pendingReimbursement, "employee-2"), false);
  assert.equal(canEditOwnReimbursement({ ...pendingReimbursement, finalStatus: "Approved by Manager" }, "employee-1"), false);
  assert.equal(canEditOwnReimbursement({ ...pendingReimbursement, finalStatus: "Paid by Finance" }, "employee-1"), false);
});

test("pending and rejected reimbursements can be deleted only by their owner", () => {
  assert.equal(canDeleteOwnReimbursement(pendingReimbursement, "employee-1"), true);
  assert.equal(canDeleteOwnReimbursement({ ...pendingReimbursement, finalStatus: "Rejected by HR" }, "employee-1"), true);
  assert.equal(canDeleteOwnReimbursement(pendingReimbursement, "employee-2"), false);
  assert.equal(canDeleteOwnReimbursement({ ...pendingReimbursement, finalStatus: "Approved by HR" }, "employee-1"), false);
});

test("reimbursement create and edit share amount, item, date, and receipt validation", () => {
  const input = {
    expenseFrom: "2026-08-01",
    expenseTo: "2026-08-02",
    businessPurpose: "Client visit",
    lessCashAdvance: "100",
    items: JSON.stringify([
      { description: "Train", category: "Travel", cost: "500" },
      { description: "Meal", category: "Business Meals", cost: "250" },
    ]),
  };
  const result = validateReimbursementInput(input, {
    existingReceiptCount: 1,
    now: new Date("2026-08-10T12:00:00.000Z"),
  });
  assert.equal(result.valid, true);
  assert.equal(result.value.subtotal, 750);
  assert.equal(result.value.totalReimbursement, 650);
});

test("existing receipt is accepted on edit and missing receipts are rejected on create", () => {
  const input = {
    expenseFrom: "2026-08-01",
    expenseTo: "2026-08-01",
    businessPurpose: "Office supplies",
    lessCashAdvance: 0,
    items: [{ description: "Paper", category: "Office Supplies", cost: 20 }],
  };
  assert.equal(validateReimbursementInput(input, { existingReceiptCount: 1 }).valid, true);
  assert.match(validateReimbursementInput(input).message, /receipt/i);
});

test("future expense dates and negative totals are rejected", () => {
  const base = {
    expenseFrom: "2026-08-11",
    expenseTo: "2026-08-11",
    businessPurpose: "Travel",
    lessCashAdvance: 0,
    items: [{ description: "Taxi", category: "Travel", cost: 20 }],
  };
  assert.match(validateReimbursementInput(base, { newReceiptCount: 1, now: new Date("2026-08-10") }).message, /after today's date/i);
  assert.match(validateReimbursementInput({ ...base, expenseFrom: "2026-08-01", expenseTo: "2026-08-01", lessCashAdvance: 50 }, { newReceiptCount: 1 }).message, /cash advance/i);
});

test("leave deletion protects ownership and approved or cancelled records", () => {
  const options = { ownerId: "employee-1", userId: "employee-1" };
  assert.equal(canDeleteOwnLeaveRequest({ ...options, finalStatus: "Pending Final Approval" }), true);
  assert.equal(canDeleteOwnLeaveRequest({ ...options, finalStatus: "Rejected by Manager" }), true);
  assert.equal(canDeleteOwnLeaveRequest({ ...options, finalStatus: "Rejected by Team Leader" }), true);
  assert.equal(canDeleteOwnLeaveRequest({ ...options, finalStatus: "Approved by HR" }), false);
  assert.equal(canDeleteOwnLeaveRequest({ ...options, finalStatus: "Cancelled" }), false);
  assert.equal(canDeleteOwnLeaveRequest({ ...options, userId: "employee-2", finalStatus: "Pending Final Approval" }), false);
});

test("business record schemas retain soft-delete and edit audit fields", () => {
  for (const path of ["isDeleted", "deletedAt", "deletedBy"]) {
    assert.ok(LeaveRequest.schema.path(path), `LeaveRequest.${path} should exist`);
    assert.ok(ReimbursementRequest.schema.path(path), `ReimbursementRequest.${path} should exist`);
  }
  assert.ok(ReimbursementRequest.schema.path("editHistory"));
  assert.ok(ReimbursementRequest.schema.path("lastEditedAt"));
});
