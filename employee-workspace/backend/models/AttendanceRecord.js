import mongoose from "mongoose";

export const UNINFORMED_ABSENCE_STATUS = "Absent \u2013 Uninformed";
export const HALF_DAY_LEAVE_STATUS = "Half Day Leave";
export const PERMISSION_STATUS = "Permission";
export const ATTENDANCE_RECORD_TYPES = ["FULL_DAY", "HALF_DAY", "PERMISSION"];
export const ATTENDANCE_BALANCE_TREATMENTS = ["LOP", "PAID", "NONE"];
export const ATTENDANCE_RECORD_STATUSES = [
  UNINFORMED_ABSENCE_STATUS,
  HALF_DAY_LEAVE_STATUS,
  PERMISSION_STATUS,
  "Cancelled",
];

const attendanceChangeSchema = new mongoose.Schema(
  {
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    modifiedByRole: {
      type: String,
      enum: ["Manager", "HR"],
      required: true,
    },
    modifiedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    previousDate: {
      type: Date,
      required: true,
    },
    previousRemarks: {
      type: String,
      default: "",
      trim: true,
    },
    previousAttendanceType: {
      type: String,
      enum: ATTENDANCE_RECORD_TYPES,
      default: "FULL_DAY",
    },
    previousStatus: {
      type: String,
      enum: ATTENDANCE_RECORD_STATUSES,
      default: UNINFORMED_ABSENCE_STATUS,
    },
    previousDurationDays: {
      type: Number,
      enum: [0, 0.5, 1],
      default: 1,
    },
    previousBalanceTreatment: {
      type: String,
      enum: ATTENDANCE_BALANCE_TREATMENTS,
      default: "LOP",
    },
  },
  { _id: true },
);

const attendanceRecordSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    attendanceDate: {
      type: Date,
      required: true,
      index: true,
    },
    attendanceType: {
      type: String,
      enum: ATTENDANCE_RECORD_TYPES,
      default: "FULL_DAY",
      required: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_RECORD_STATUSES,
      default: UNINFORMED_ABSENCE_STATUS,
      required: true,
    },
    durationDays: {
      type: Number,
      enum: [0, 0.5, 1],
      default: 1,
      required: true,
    },
    balanceTreatment: {
      type: String,
      enum: ATTENDANCE_BALANCE_TREATMENTS,
      default: "LOP",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    cancelledByRole: { type: String, enum: ["Manager", "HR"], default: null },
    cancellationReason: { type: String, trim: true, maxlength: 500, default: "" },
    remarks: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    createdByRole: {
      type: String,
      enum: ["Manager", "HR"],
      required: true,
      immutable: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModifiedByRole: {
      type: String,
      enum: ["Manager", "HR"],
      required: true,
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    changeHistory: {
      type: [attendanceChangeSchema],
      default: [],
    },
  },
  { timestamps: true },
);

attendanceRecordSchema.index(
  { employeeId: 1, attendanceDate: 1 },
  { unique: true },
);

attendanceRecordSchema.index({ attendanceDate: -1, status: 1 });

const AttendanceRecord = mongoose.model(
  "AttendanceRecord",
  attendanceRecordSchema,
);

export default AttendanceRecord;
