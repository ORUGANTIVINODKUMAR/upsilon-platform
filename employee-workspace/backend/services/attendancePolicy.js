import { getRetrospectivePolicy, startOfUtcDay } from "./leaveRequestPolicy.js";

export const ATTENDANCE_MANAGEMENT_ROLES = ["Manager", "HR"];
export const ATTENDANCE_AUDIT_ROLES = ["HR", "Admin"];
export const ATTENDANCE_EMPLOYEE_ROLES = [
  "Employee",
  "TeamLeader",
  "Manager",
  "HR",
];

export const ATTENDANCE_TYPE_DETAILS = Object.freeze({
  FULL_DAY: Object.freeze({
    attendanceType: "FULL_DAY",
    status: "Absent \u2013 Uninformed",
    durationDays: 1,
    label: "Full-day absence",
  }),
  HALF_DAY: Object.freeze({
    attendanceType: "HALF_DAY",
    status: "Half Day Leave",
    durationDays: 0.5,
    label: "Half-day leave",
  }),
  PERMISSION: Object.freeze({
    attendanceType: "PERMISSION",
    status: "Permission",
    durationDays: 0,
    label: "Permission",
  }),
});

export const getAttendanceTypeDetails = (value = "FULL_DAY") =>
  ATTENDANCE_TYPE_DETAILS[value] || null;

export const getAttendanceBalanceTreatment = (attendanceType, value) => {
  if (attendanceType === "PERMISSION") return "NONE";
  if (value === undefined || value === null || value === "") return "LOP";
  return ["LOP", "PAID"].includes(value) ? value : null;
};

export const canManageAttendance = (role) =>
  ATTENDANCE_MANAGEMENT_ROLES.includes(role);

export const parseAttendanceDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? date
    : null;
};

export const validateAttendanceDate = ({ value, now = new Date(), dateOfJoining }) => {
  const attendanceDate = parseAttendanceDate(value);
  if (!attendanceDate) {
    return { valid: false, message: "Enter a valid attendance date." };
  }

  const today = getRetrospectivePolicy(now).today;
  if (attendanceDate > today) {
    return { valid: false, message: "A future date cannot be marked absent." };
  }

  const joiningDate = dateOfJoining ? startOfUtcDay(dateOfJoining) : null;
  if (joiningDate && attendanceDate < joiningDate) {
    return {
      valid: false,
      message: "The selected date is before the employee's joining date.",
    };
  }

  const day = attendanceDate.getUTCDay();
  if (day === 0 || day === 6) {
    return { valid: false, message: "The selected date is a weekly off." };
  }

  return { valid: true, attendanceDate, today };
};

export const isManagerAuthorizedForEmployee = ({
  managerId,
  employee,
  managedTeamIds = [],
}) => {
  const actorId = managerId?.toString();
  if (!actorId || !employee || employee._id?.toString() === actorId) return false;

  if (employee.managerId?.toString() === actorId) return true;

  const employeeTeamId = employee.teamId?.toString();
  return Boolean(
    employeeTeamId && managedTeamIds.some((teamId) => teamId.toString() === employeeTeamId),
  );
};

export const validateAttendanceRange = ({ startDate, endDate }) => {
  const start = parseAttendanceDate(startDate);
  const end = parseAttendanceDate(endDate);

  if (!start || !end) {
    return { valid: false, message: "Start and end dates must use YYYY-MM-DD format." };
  }
  if (end < start) {
    return { valid: false, message: "End date cannot be earlier than start date." };
  }
  if ((end - start) / 86_400_000 > 366) {
    return { valid: false, message: "Attendance reports cannot exceed 366 days." };
  }

  return { valid: true, startDate: start, endDate: end };
};
