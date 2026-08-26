import mongoose from "mongoose";

const leaveEmailActionTokenSchema = new mongoose.Schema(
  {
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveRequest",
      required: true,
      index: true,
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["approve", "reject"],
      default: null,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    usedAt: {
      type: Date,
      default: null,
    },
    invalidatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

leaveEmailActionTokenSchema.index({
  leaveRequestId: 1,
  approverId: 1,
  action: 1,
  usedAt: 1,
  invalidatedAt: 1,
});

export default mongoose.model("LeaveEmailActionToken", leaveEmailActionTokenSchema);
