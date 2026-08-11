import test from "node:test";
import assert from "node:assert/strict";
import {
  getLeaveApprovalExportRange,
  getLeaveApprovalStatusFilter,
  getLeaveApprovalVisibilityFilter,
  leaveRequestMatchesSearch,
} from "../services/leaveApprovalExportPolicy.js";

test("day export range covers the selected UTC day", () => {
  const range = getLeaveApprovalExportRange({ filterType: "day", date: "2026-08-11" });
  assert.equal(range.startDate.toISOString(), "2026-08-11T00:00:00.000Z");
  assert.equal(range.endDate.toISOString(), "2026-08-11T23:59:59.999Z");
});

test("week export range uses Monday through Sunday", () => {
  const range = getLeaveApprovalExportRange({ filterType: "week", date: "2026-08-13" });
  assert.equal(range.startDate.toISOString(), "2026-08-10T00:00:00.000Z");
  assert.equal(range.endDate.toISOString(), "2026-08-16T23:59:59.999Z");
});

test("month and custom export ranges are inclusive", () => {
  const month = getLeaveApprovalExportRange({ filterType: "month", month: "2026-02" });
  assert.equal(month.startDate.toISOString(), "2026-02-01T00:00:00.000Z");
  assert.equal(month.endDate.toISOString(), "2026-02-28T23:59:59.999Z");

  const custom = getLeaveApprovalExportRange({
    filterType: "custom",
    startDate: "2026-08-07",
    endDate: "2026-08-14",
  });
  assert.equal(custom.startDate.toISOString(), "2026-08-07T00:00:00.000Z");
  assert.equal(custom.endDate.toISOString(), "2026-08-14T23:59:59.999Z");
});

test("export rejects malformed or reversed date ranges", () => {
  assert.throws(
    () => getLeaveApprovalExportRange({ filterType: "day", date: "2026-02-30" }),
    /valid date/
  );
  assert.throws(
    () => getLeaveApprovalExportRange({ filterType: "custom", startDate: "2026-08-12", endDate: "2026-08-11" }),
    /cannot be earlier/
  );
});

test("export visibility is scoped for TL and Manager and organization-wide for HR and Admin", () => {
  assert.deepEqual(getLeaveApprovalVisibilityFilter({ role: "TeamLeader", _id: "tl-1" }), { teamLeaderId: "tl-1" });
  assert.deepEqual(getLeaveApprovalVisibilityFilter({ role: "Manager", _id: "manager-1" }), { managerId: "manager-1" });
  assert.deepEqual(getLeaveApprovalVisibilityFilter({ role: "HR", _id: "hr-1" }), {});
  assert.deepEqual(getLeaveApprovalVisibilityFilter({ role: "Admin", _id: "admin-1" }), {});
  assert.throws(() => getLeaveApprovalVisibilityFilter({ role: "Employee", _id: "employee-1" }), /not allowed/);
});

test("export status and search filters match the Final Leave Approvals page", () => {
  assert.deepEqual(getLeaveApprovalStatusFilter("Approved"), {
    finalStatus: { $in: ["Approved by Manager", "Approved by HR"] },
  });
  assert.throws(() => getLeaveApprovalStatusFilter("Cancelled"), /invalid/);

  const request = {
    employeeId: { name: "Rukmini Kothuru", email: "rukmini@example.com", employeeId: "EMP-10" },
    leaveType: "Sick",
    finalStatus: "Approved by HR",
    reason: "Recovery",
  };
  assert.equal(leaveRequestMatchesSearch(request, "EMP-10"), true);
  assert.equal(leaveRequestMatchesSearch(request, "vacation"), false);
});
