import mongoose from "mongoose";

const dailyEmailDispatchSchema = new mongoose.Schema({
  jobName: { type: String, required: true, trim: true },
  dateKey: { type: String, required: true, trim: true },
  recipientKey: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ["Sending", "Sent", "Failed"], required: true },
  attempts: { type: Number, default: 0, min: 0 },
  lockedAt: { type: Date, default: null },
  sentAt: { type: Date, default: null },
  lastError: { type: String, default: "", trim: true },
}, { timestamps: true });

dailyEmailDispatchSchema.index(
  { jobName: 1, dateKey: 1, recipientKey: 1 },
  { unique: true, name: "unique_daily_email_recipient" }
);

export default mongoose.model("DailyEmailDispatch", dailyEmailDispatchSchema);

