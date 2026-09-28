import assert from "node:assert/strict";
import test from "node:test";
import { getNotificationPage } from "../src/utils/notificationNavigation.js";

test("uses an explicit notification page when the role can access it", () => {
  assert.equal(
    getNotificationPage(
      { type: "Leave", link: "/dashboard?page=managerApprovals" },
      "Manager",
      ["dashboard", "notifications", "managerApprovals"]
    ),
    "managerApprovals"
  );
});

test("maps employee request outcomes to personal request pages", () => {
  assert.equal(
    getNotificationPage(
      { type: "Leave", link: "/dashboard", message: "Your leave was approved." },
      "Employee",
      ["dashboard", "notifications", "leave"]
    ),
    "leave"
  );
  assert.equal(
    getNotificationPage(
      { type: "Reimbursement", link: "/dashboard", message: "Your reimbursement was paid." },
      "Employee",
      ["dashboard", "notifications", "reimbursements"]
    ),
    "reimbursements"
  );
});

test("supports older leave notifications that were stored as system notifications", () => {
  assert.equal(
    getNotificationPage(
      { type: "System", link: "/dashboard", title: "Leave Approved by Team Leader" },
      "Employee",
      ["dashboard", "notifications", "leave"]
    ),
    "leave"
  );
});

test("maps approver and finance notifications to their work queues", () => {
  assert.equal(
    getNotificationPage(
      { type: "Reimbursement", link: "/dashboard", message: "A claim requires review." },
      "HR",
      ["dashboard", "notifications", "reimbursementApprovals"]
    ),
    "reimbursementApprovals"
  );
  assert.equal(
    getNotificationPage(
      { type: "Leave", link: "/dashboard", message: "An approved leave is ready." },
      "Finance",
      ["dashboard", "notifications", "financeLeaves"]
    ),
    "financeLeaves"
  );
});

test("does not navigate to a page the role cannot access", () => {
  assert.equal(
    getNotificationPage(
      { type: "Leave", link: "/dashboard?page=managerApprovals" },
      "Employee",
      ["dashboard", "notifications", "leave"]
    ),
    "notifications"
  );
});
