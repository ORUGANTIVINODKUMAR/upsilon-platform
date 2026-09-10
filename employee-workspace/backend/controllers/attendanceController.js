import mongoose from "mongoose";
import AttendanceRecord, {
  UNINFORMED_ABSENCE_STATUS,
} from "../models/AttendanceRecord.js";
import Holiday from "../models/Holiday.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import {
  ATTENDANCE_AUDIT_ROLES,
  ATTENDANCE_EMPLOYEE_ROLES,
  canManageAttendance,
  getAttendanceBalanceTreatment,
  getAttendanceTypeDetails,
  isManagerAuthorizedForEmployee,
  parseAttendanceDate,
  validateAttendanceDate,
  validateAttendanceRange,
} from "../services/attendancePolicy.js";
import { getRetrospectivePolicy } from "../services/leaveRequestPolicy.js";
import { createNotification } from "../services/notificationService.js";
import { syncUninformedAbsenceLedger } from "../services/leaveBalanceService.js";
import { buildAttendanceCalendar, calendarPeriod } from "../services/attendanceCalendarService.js";
import { employeeBaseFilter, getManagedTeamIds, getAuthorizedEmployeeFilter } from "../services/attendanceScopeService.js";

export const getAttendanceCalendar = async (req, res) => {
  try {
    const period = calendarPeriod(req.query.month);
    if (!period) return res.status(400).json({ message: "Enter a valid month (YYYY-MM)." });
    let scope;
    if (["HR", "Admin", "Finance"].includes(req.user.role)) {
      scope = { role: { $in: ATTENDANCE_EMPLOYEE_ROLES } };
    } else if (req.user.role === "Manager") {
      scope = await getAuthorizedEmployeeFilter(req.user);
    } else if (req.user.role === "TeamLeader") {
      const teamIds = await Team.find({ teamLeaderId: req.user._id }).distinct("_id");
      scope = { role: { $in: ATTENDANCE_EMPLOYEE_ROLES }, $or: [
        { _id: req.user._id }, { teamLeaderId: req.user._id }, { teamId: { $in: teamIds } },
      ] };
    } else {
      scope = { _id: req.user._id };
    }
    const employees = await User.find({ ...scope, isActive: true })
      .select("name employeeId role teamId dateOfJoining").populate("teamId", "name").sort({ name: 1 }).lean();
    const selectedId = req.query.employeeId;
    if (selectedId && !employees.some((employee) => String(employee._id) === selectedId)) {
      return res.status(403).json({ message: "You are not authorized to view this employee." });
    }
    const selected = selectedId ? employees.filter((employee) => String(employee._id) === selectedId) : employees;
    const ids = selected.map((employee) => employee._id);
    const [records, leaves, holidays] = await Promise.all([
      AttendanceRecord.find({ employeeId: { $in: ids }, active: { $ne: false }, attendanceDate: { $gte: period.start, $lt: period.end } })
        .select("employeeId attendanceDate attendanceType status durationDays balanceTreatment remarks active").lean(),
      LeaveRequest.find({ employeeId: { $in: ids }, finalStatus: { $in: ["Approved by Manager", "Approved by HR"] },
        startDate: { $lt: period.end }, endDate: { $gte: period.start } })
        .select("employeeId startDate endDate leaveType workingDays finalStatus requiresReapproval").lean(),
      Holiday.find({ holidayDate: { $gte: period.start, $lt: period.end } }).select("name holidayDate type").lean(),
    ]);
    return res.json({ month: period.month, today: period.today, employees,
      calendars: selected.map((employee) => ({ employee,
        days: buildAttendanceCalendar({ period, employee, holidays,
          records: records.filter((record) => String(record.employeeId) === String(employee._id)),
          leaves: leaves.filter((leave) => String(leave.employeeId) === String(employee._id)),
        }),
      })),
    });
  } catch (error) {
    console.error("GET ATTENDANCE CALENDAR ERROR:", error);
    return res.status(500).json({ message: "Unable to load the attendance calendar." });
  }
};

const ATTENDANCE_POPULATE = [
  {
    path: "employeeId",
    select: "name email employeeId designation role profilePhoto teamId subcategoryId",
    populate: [
      { path: "teamId", select: "name" },
      { path: "subcategoryId", select: "name" },
    ],
  },
  { path: "createdBy", select: "name email employeeId role" },
  { path: "lastModifiedBy", select: "name email employeeId role" },
  { path: "changeHistory.modifiedBy", select: "name email employeeId role" },
];

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAuthorizedEmployee = async (actor, employeeId) => {
  if (!mongoose.isValidObjectId(employeeId)) return null;
  if (!["Manager", "HR"].includes(actor.role)) return null;
  if (employeeId.toString() === actor._id.toString()) return null;

  const employee = await User.findOne({
    ...employeeBaseFilter(actor),
    _id: employeeId,
  }).select("name email employeeId role teamId managerId subcategoryId dateOfJoining isActive");

  if (!employee) return null;
  if (actor.role === "HR") return employee;

  const managedTeamIds = await getManagedTeamIds(actor);
  return isManagerAuthorizedForEmployee({
    managerId: actor._id,
    employee,
    managedTeamIds,
  })
    ? employee
    : null;
};

const getAttendanceConflict = async ({ employeeId, attendanceDate, excludeId }) => {
  const [holiday, leave, attendance] = await Promise.all([
    Holiday.findOne({ holidayDate: attendanceDate }).select("name type").lean(),
    LeaveRequest.findOne({
      employeeId,
      startDate: { $lte: attendanceDate },
      endDate: { $gte: attendanceDate },
      finalStatus: {
        $in: [
          "Pending Final Approval",
          "Pending Reapproval",
          "On Hold",
          "Approved by Manager",
          "Approved by HR",
        ],
      },
    }).select("leaveType finalStatus").lean(),
    AttendanceRecord.findOne({
      employeeId,
      attendanceDate,
      active: { $ne: false },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("status").lean(),
  ]);

  if (holiday) {
    return { existingStatus: `Holiday - ${holiday.name}`, message: `${holiday.name} is configured as a holiday.` };
  }
  if (leave) {
    return {
      existingStatus: `${leave.leaveType} leave - ${leave.finalStatus}`,
      message: `The employee already has ${leave.finalStatus.toLowerCase()} ${leave.leaveType.toLowerCase()} leave for this date.`,
    };
  }
  if (attendance) {
    return {
      existingStatus: attendance.status,
      message: `Attendance already exists with status "${attendance.status}".`,
    };
  }
  return null;
};

const sendAttendanceNotification = (record) => {
  const deductionText = record.active === false
    ? " This record was cancelled and no longer affects your leave balance."
    : record.balanceTreatment === "PAID"
    ? ` This uses ${record.durationDays} paid leave day${record.durationDays === 1 ? "" : "s"}.`
    : record.durationDays > 0
    ? ` This records ${record.durationDays} LOP day${record.durationDays === 1 ? "" : "s"}.`
    : " This permission does not deduct leave.";
  return createNotification({
    recipientId: record.employeeId,
    type: "Attendance",
    title: "Attendance Update",
    message: `Your attendance for ${record.attendanceDate.toISOString().slice(0, 10)} is '${record.status}'.${deductionText} If this is incorrect, please contact your manager or HR.`,
    link: "/dashboard?page=attendance",
  }).catch((error) => {
    console.error("ATTENDANCE NOTIFICATION ERROR:", error.message);
  });
};

const populateAttendance = (query) => {
  ATTENDANCE_POPULATE.forEach((entry) => query.populate(entry));
  return query;
};

export const getAttendanceEmployees = async (req, res) => {
  try {
    if (!canManageAttendance(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only HR or Managers can manage attendance" });
    }

    const query = String(req.query.search || "").trim();
    if (query.length > 100) {
      return res.status(400).json({ success: false, message: "Search text cannot exceed 100 characters" });
    }

    const filter = await getAuthorizedEmployeeFilter(req.user);
    if (query) {
      const search = new RegExp(escapeRegExp(query), "i");
      filter.$and = [{ $or: [{ name: search }, { email: search }, { employeeId: search }] }];
    }

    const employees = await User.find(filter)
      .select("name email employeeId designation role teamId subcategoryId dateOfJoining")
      .populate("teamId", "name")
      .populate("subcategoryId", "name")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ success: true, employees });
  } catch (error) {
    console.error("GET ATTENDANCE EMPLOYEES ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to retrieve employees" });
  }
};

export const getAttendanceRecords = async (req, res) => {
  try {
    const today = getRetrospectivePolicy().today;
    const defaultStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const startValue = req.query.startDate || defaultStart.toISOString().slice(0, 10);
    const endValue = req.query.endDate || today.toISOString().slice(0, 10);
    const range = validateAttendanceRange({ startDate: startValue, endDate: endValue });

    if (!range.valid) {
      return res.status(400).json({ success: false, message: range.message });
    }

    const filter = {
      attendanceDate: { $gte: range.startDate, $lte: range.endDate },
    };

    if (req.user.role === "Manager") {
      const employeeFilter = await getAuthorizedEmployeeFilter(req.user);
      const employeeIds = await User.find(employeeFilter).distinct("_id");
      filter.employeeId = { $in: employeeIds };
    } else if (req.user.role === "TeamLeader") {
      const teamMemberIds = await User.find({
        teamLeaderId: req.user._id,
        isActive: true,
        role: { $in: ATTENDANCE_EMPLOYEE_ROLES },
      }).distinct("_id");
      filter.employeeId = {
        $in: [...teamMemberIds, req.user._id],
      };
    } else if (req.user.role === "Finance") {
      // Finance already has organization-wide access to the Leave Calendar.
    } else if (!ATTENDANCE_AUDIT_ROLES.includes(req.user.role)) {
      filter.employeeId = req.user._id;
    }

    if (req.query.employeeId) {
      if (!mongoose.isValidObjectId(req.query.employeeId)) {
        return res.status(400).json({ success: false, message: "Invalid employee ID" });
      }

      if (req.user.role === "Manager") {
        const authorized = await getAuthorizedEmployee(req.user, req.query.employeeId);
        if (!authorized) {
          return res.status(403).json({ success: false, message: "You are not authorized to view this employee" });
        }
      } else if (!ATTENDANCE_AUDIT_ROLES.includes(req.user.role) && req.query.employeeId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "You can only view your own attendance" });
      }
      filter.employeeId = req.query.employeeId;
    }

    const records = await populateAttendance(
      AttendanceRecord.find(filter).sort({ attendanceDate: -1, createdAt: -1 }),
    ).lean();

    return res.status(200).json({
      success: true,
      records,
      filter: { startDate: startValue, endDate: endValue },
    });
  } catch (error) {
    console.error("GET ATTENDANCE RECORDS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to retrieve attendance records" });
  }
};

export const createUninformedAbsence = async (req, res) => {
  try {
    if (!canManageAttendance(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only HR or Managers can manage attendance" });
    }

    const employee = await getAuthorizedEmployee(req.user, req.body.employeeId);
    if (!employee) {
      return res.status(403).json({ success: false, message: "You are not authorized to manage this employee" });
    }

    const dateResult = validateAttendanceDate({
      value: req.body.date,
      dateOfJoining: employee.dateOfJoining,
    });
    if (!dateResult.valid) {
      return res.status(400).json({ success: false, message: dateResult.message });
    }

    const remarks = String(req.body.remarks || "").trim();
    if (remarks.length > 500) {
      return res.status(400).json({ success: false, message: "Remarks cannot exceed 500 characters" });
    }

    const attendanceDetails = getAttendanceTypeDetails(req.body.attendanceType || "FULL_DAY");
    if (!attendanceDetails) {
      return res.status(400).json({ success: false, message: "Select a valid attendance type" });
    }
    const balanceTreatment = getAttendanceBalanceTreatment(
      attendanceDetails.attendanceType,
      req.body.balanceTreatment,
    );
    if (!balanceTreatment) {
      return res.status(400).json({ success: false, message: "Select paid leave or LOP treatment" });
    }

    const conflict = await getAttendanceConflict({
      employeeId: employee._id,
      attendanceDate: dateResult.attendanceDate,
    });
    if (conflict) {
      return res.status(409).json({ success: false, code: "ATTENDANCE_CONFLICT", ...conflict });
    }

    let record;
    await mongoose.connection.transaction(async (session) => {
      [record] = await AttendanceRecord.create([{
        employeeId: employee._id,
        employeeName: employee.name,
        attendanceDate: dateResult.attendanceDate,
        attendanceType: attendanceDetails.attendanceType,
        status: attendanceDetails.status,
        durationDays: attendanceDetails.durationDays,
        balanceTreatment,
        remarks,
        createdBy: req.user._id,
        createdByRole: req.user.role,
        lastModifiedBy: req.user._id,
        lastModifiedByRole: req.user.role,
        lastModifiedAt: new Date(),
      }], { session });
      await syncUninformedAbsenceLedger(record, req.user._id, { session });
    });

    await sendAttendanceNotification(record);

    const populatedRecord = await populateAttendance(AttendanceRecord.findById(record._id)).lean();
    return res.status(201).json({
      success: true,
      message: `${employee.name} has been marked as ${attendanceDetails.label}.`,
      record: populatedRecord,
    });
  } catch (error) {
    console.error("CREATE UNINFORMED ABSENCE ERROR:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "ATTENDANCE_CONFLICT",
        existingStatus: UNINFORMED_ABSENCE_STATUS,
        message: "Attendance already exists for this employee and date.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(error.errors).map((item) => item.message).join(", ") });
    }
    return res.status(500).json({ success: false, message: "Unable to create attendance record" });
  }
};

export const updateUninformedAbsence = async (req, res) => {
  try {
    if (!canManageAttendance(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only HR or Managers can manage attendance" });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid attendance record ID" });
    }

    const record = await AttendanceRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    const employee = await getAuthorizedEmployee(req.user, record.employeeId);
    if (!employee) {
      return res.status(403).json({ success: false, message: "You are not authorized to manage this employee" });
    }

    const nextDateValue = req.body.date || record.attendanceDate.toISOString().slice(0, 10);
    const dateResult = validateAttendanceDate({ value: nextDateValue, dateOfJoining: employee.dateOfJoining });
    if (!dateResult.valid) {
      return res.status(400).json({ success: false, message: dateResult.message });
    }

    const remarks = req.body.remarks === undefined ? record.remarks : String(req.body.remarks).trim();
    if (remarks.length > 500) {
      return res.status(400).json({ success: false, message: "Remarks cannot exceed 500 characters" });
    }


    const attendanceDetails = getAttendanceTypeDetails(
      req.body.attendanceType || record.attendanceType || "FULL_DAY",
    );
    if (!attendanceDetails) {
      return res.status(400).json({ success: false, message: "Select a valid attendance type" });
    }
    const balanceTreatment = getAttendanceBalanceTreatment(
      attendanceDetails.attendanceType,
      req.body.balanceTreatment ?? record.balanceTreatment,
    );
    if (!balanceTreatment) {
      return res.status(400).json({ success: false, message: "Select paid leave or LOP treatment" });
    }

    const conflict = await getAttendanceConflict({
      employeeId: record.employeeId,
      attendanceDate: dateResult.attendanceDate,
      excludeId: record._id,
    });
    if (conflict) {
      return res.status(409).json({ success: false, code: "ATTENDANCE_CONFLICT", ...conflict });
    }

    const changed =
      record.attendanceDate.toISOString().slice(0, 10) !== nextDateValue ||
      record.remarks !== remarks ||
      record.attendanceType !== attendanceDetails.attendanceType ||
      record.balanceTreatment !== balanceTreatment ||
      record.active === false;
    if (!changed) {
      await syncUninformedAbsenceLedger(record, req.user._id);
      const populatedRecord = await populateAttendance(AttendanceRecord.findById(record._id)).lean();
      return res.status(200).json({ success: true, message: "No attendance changes were required.", record: populatedRecord });
    }

    record.changeHistory.push({
      modifiedBy: req.user._id,
      modifiedByRole: req.user.role,
      modifiedAt: new Date(),
      previousDate: record.attendanceDate,
      previousRemarks: record.remarks,
      previousAttendanceType: record.attendanceType || "FULL_DAY",
      previousStatus: record.status,
      previousDurationDays: record.durationDays ?? 1,
      previousBalanceTreatment: record.balanceTreatment || "LOP",
    });
    record.attendanceDate = dateResult.attendanceDate;
    record.attendanceType = attendanceDetails.attendanceType;
    record.status = attendanceDetails.status;
    record.durationDays = attendanceDetails.durationDays;
    record.balanceTreatment = balanceTreatment;
    record.active = true;
    record.cancelledAt = null;
    record.cancelledBy = null;
    record.cancelledByRole = null;
    record.cancellationReason = "";
    record.remarks = remarks;
    record.lastModifiedBy = req.user._id;
    record.lastModifiedByRole = req.user.role;
    record.lastModifiedAt = new Date();
    await mongoose.connection.transaction(async (session) => {
      await record.save({ session });
      await syncUninformedAbsenceLedger(record, req.user._id, { session });
    });

    await sendAttendanceNotification(record);

    const populatedRecord = await populateAttendance(AttendanceRecord.findById(record._id)).lean();
    return res.status(200).json({
      success: true,
      message: `${employee.name}'s attendance record has been updated.`,
      record: populatedRecord,
    });
  } catch (error) {
    console.error("UPDATE UNINFORMED ABSENCE ERROR:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "ATTENDANCE_CONFLICT",
        existingStatus: UNINFORMED_ABSENCE_STATUS,
        message: "Attendance already exists for this employee and date.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: Object.values(error.errors).map((item) => item.message).join(", ") });
    }
    return res.status(500).json({ success: false, message: "Unable to update attendance record" });
  }
};

export const cancelAttendanceRecord = async (req, res) => {
  try {
    if (!canManageAttendance(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only HR or Managers can manage attendance" });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid attendance record ID" });
    }

    const record = await AttendanceRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }
    const employee = await getAuthorizedEmployee(req.user, record.employeeId);
    if (!employee) {
      return res.status(403).json({ success: false, message: "You are not authorized to manage this employee" });
    }
    if (record.active === false) {
      return res.status(200).json({ success: true, message: "Attendance record is already cancelled." });
    }

    const reason = String(req.body.reason || "").trim();
    if (reason.length < 3 || reason.length > 500) {
      return res.status(400).json({ success: false, message: "Cancellation reason must contain between 3 and 500 characters" });
    }

    record.changeHistory.push({
      modifiedBy: req.user._id,
      modifiedByRole: req.user.role,
      modifiedAt: new Date(),
      previousDate: record.attendanceDate,
      previousRemarks: record.remarks,
      previousAttendanceType: record.attendanceType || "FULL_DAY",
      previousStatus: record.status,
      previousDurationDays: record.durationDays ?? 1,
      previousBalanceTreatment: record.balanceTreatment || "LOP",
    });
    record.active = false;
    record.status = "Cancelled";
    record.cancelledAt = new Date();
    record.cancelledBy = req.user._id;
    record.cancelledByRole = req.user.role;
    record.cancellationReason = reason;
    record.lastModifiedBy = req.user._id;
    record.lastModifiedByRole = req.user.role;
    record.lastModifiedAt = new Date();

    await mongoose.connection.transaction(async (session) => {
      await record.save({ session });
      await syncUninformedAbsenceLedger(record, req.user._id, { session });
    });
    await sendAttendanceNotification(record);

    const populatedRecord = await populateAttendance(AttendanceRecord.findById(record._id)).lean();
    return res.status(200).json({
      success: true,
      message: `${employee.name}'s attendance record has been cancelled.`,
      record: populatedRecord,
    });
  } catch (error) {
    console.error("CANCEL ATTENDANCE RECORD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to cancel attendance record" });
  }
};
