import assert from "node:assert/strict";
import test from "node:test";
import AttendanceRecord, {
  ATTENDANCE_RECORD_STATUSES,
  UNINFORMED_ABSENCE_STATUS,
} from "../models/AttendanceRecord.js";
import { createUninformedAbsence } from "../controllers/attendanceController.js";
import {
  getAttendanceBalanceTreatment,
  isManagerAuthorizedForEmployee,
  getAttendanceTypeDetails,
  parseAttendanceDate,
  validateAttendanceDate,
  validateAttendanceRange,
} from "../services/attendancePolicy.js";

test("attendance dates require strict date-only values", () => {
  assert.equal(parseAttendanceDate("2026-08-11")?.toISOString(), "2026-08-11T00:00:00.000Z");
  assert.equal(parseAttendanceDate("11-08-2026"), null);
  assert.equal(parseAttendanceDate("2026-02-30"), null);
});

test("future dates, weekly offs, and pre-joining dates are rejected", () => {
  const now = new Date("2026-08-11T06:00:00.000Z");
  assert.match(validateAttendanceDate({ value: "2026-08-12", now }).message, /future/i);
  assert.match(validateAttendanceDate({ value: "2026-08-09", now }).message, /weekly off/i);
  assert.match(
    validateAttendanceDate({ value: "2026-08-10", now, dateOfJoining: "2026-08-11" }).message,
    /joining date/i,
  );
});

test("a current or historical working day is accepted", () => {
  const result = validateAttendanceDate({
    value: "2026-08-10",
    now: new Date("2026-08-11T06:00:00.000Z"),
    dateOfJoining: "2026-01-01",
  });
  assert.equal(result.valid, true);
  assert.equal(result.attendanceDate.toISOString(), "2026-08-10T00:00:00.000Z");
});

test("attendance types map to full-day LOP, half-day LOP, and zero-deduction permission", () => {
  assert.deepEqual(getAttendanceTypeDetails("FULL_DAY"), {
    attendanceType: "FULL_DAY",
    status: UNINFORMED_ABSENCE_STATUS,
    durationDays: 1,
    label: "Full-day absence",
  });
  assert.equal(getAttendanceTypeDetails("HALF_DAY").durationDays, 0.5);
  assert.equal(getAttendanceTypeDetails("PERMISSION").durationDays, 0);
  assert.equal(getAttendanceTypeDetails("INVALID"), null);
  assert.equal(getAttendanceBalanceTreatment("HALF_DAY", "PAID"), "PAID");
  assert.equal(getAttendanceBalanceTreatment("FULL_DAY", "LOP"), "LOP");
  assert.equal(getAttendanceBalanceTreatment("PERMISSION", "PAID"), "NONE");
  assert.equal(getAttendanceBalanceTreatment("HALF_DAY", "INVALID"), null);
});

test("manager scope accepts direct reports and assigned teams only", () => {
  const managerId = "manager-1";
  assert.equal(
    isManagerAuthorizedForEmployee({
      managerId,
      employee: { _id: "employee-1", managerId, teamId: "team-1" },
    }),
    true,
  );
  assert.equal(
    isManagerAuthorizedForEmployee({
      managerId,
      employee: { _id: "employee-2", managerId: "manager-2", teamId: "team-1" },
      managedTeamIds: ["team-1"],
    }),
    true,
  );
  assert.equal(
    isManagerAuthorizedForEmployee({
      managerId,
      employee: { _id: "employee-3", managerId: "manager-2", teamId: "team-2" },
      managedTeamIds: ["team-1"],
    }),
    false,
  );
});

test("a manager cannot mark themselves", () => {
  assert.equal(
    isManagerAuthorizedForEmployee({
      managerId: "manager-1",
      employee: { _id: "manager-1", managerId: "manager-1", teamId: "team-1" },
      managedTeamIds: ["team-1"],
    }),
    false,
  );
});

test("employees receive 403 from the uninformed absence controller", async () => {
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

  await createUninformedAbsence(
    { user: { role: "Employee" }, body: {} },
    response,
  );

  assert.equal(response.statusCode, 403);
  assert.match(response.payload.message, /only HR or Managers/i);
});

test("attendance report ranges are ordered and bounded", () => {
  assert.equal(validateAttendanceRange({ startDate: "2026-08-01", endDate: "2026-08-31" }).valid, true);
  assert.match(validateAttendanceRange({ startDate: "2026-09-01", endDate: "2026-08-31" }).message, /earlier/i);
  assert.match(validateAttendanceRange({ startDate: "2025-01-01", endDate: "2026-08-31" }).message, /366/i);
});

test("attendance records retain supported statuses, audit fields, and duplicate protection", () => {
  assert.deepEqual(AttendanceRecord.schema.path("status").enumValues, ATTENDANCE_RECORD_STATUSES);
  for (const path of [
    "employeeId",
    "employeeName",
    "attendanceDate",
    "attendanceType",
    "durationDays",
    "balanceTreatment",
    "active",
    "cancelledAt",
    "cancellationReason",
    "createdBy",
    "createdByRole",
    "lastModifiedBy",
    "lastModifiedByRole",
    "lastModifiedAt",
    "changeHistory",
  ]) {
    assert.ok(AttendanceRecord.schema.path(path), `AttendanceRecord.${path} should exist`);
  }
  const uniqueIndex = AttendanceRecord.schema.indexes().find(
    ([fields, options]) => fields.employeeId === 1 && fields.attendanceDate === 1 && options.unique,
  );
  assert.ok(uniqueIndex, "employee/date attendance index should be unique");
});
