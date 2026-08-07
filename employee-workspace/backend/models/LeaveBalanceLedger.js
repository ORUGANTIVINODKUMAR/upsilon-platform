import mongoose from "mongoose";

const leaveBalanceLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: ["MONTHLY_CREDIT", "APPROVED_LEAVE", "HR_ADJUSTMENT"],
      required: true,
      index: true,
    },
    sourceKey: {
      type: String,
      trim: true,
      default: null,
    },
    period: {
      type: String,
      trim: true,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
    },
    leaveDays: {
      type: Number,
      min: 0,
      default: 0,
    },
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveRequest",
      default: null,
    },
    reason: {
      type: String,
      trim: true,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

leaveBalanceLedgerSchema.index(
  { sourceKey: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceKey: { $type: "string" } },
  },
);

leaveBalanceLedgerSchema.index({ userId: 1, effectiveDate: -1 });

const LeaveBalanceLedger = mongoose.model(
  "LeaveBalanceLedger",
  leaveBalanceLedgerSchema,
);

export default LeaveBalanceLedger;
