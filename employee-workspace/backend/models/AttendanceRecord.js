import mongoose from "mongoose";

export const UNINFORMED_ABSENCE_STATUS = "Absent \u2013 Uninformed";

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
    status: {
      type: String,
      enum: [UNINFORMED_ABSENCE_STATUS],
      default: UNINFORMED_ABSENCE_STATUS,
      required: true,
    },
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
