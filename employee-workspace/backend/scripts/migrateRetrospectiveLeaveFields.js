import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import LeaveRequest from "../models/LeaveRequest.js";
import { describeLeaveTiming } from "../services/leaveRequestPolicy.js";

dotenv.config();

const migrate = async () => {
  await connectDB();

  const cursor = LeaveRequest.find({
    $or: [
      { submittedAt: { $exists: false } },
      { requestKind: { $exists: false } },
      { retrospectiveDays: { $exists: false } },
    ],
  }).cursor();

  let migrated = 0;

  for await (const leaveRequest of cursor) {
    const submittedAt = leaveRequest.submittedAt || leaveRequest.createdAt || new Date();
    const timing = describeLeaveTiming(leaveRequest.startDate, submittedAt);

    await LeaveRequest.updateOne(
      { _id: leaveRequest._id },
      {
        $set: {
          submittedAt,
          requestKind: timing.requestKind,
          retrospectiveDays: timing.retrospectiveDays,
        },
      },
    );

    migrated += 1;
  }

  console.log(`Retrospective leave migration complete. Updated ${migrated} request(s).`);
};

migrate()
  .catch((error) => {
    console.error("Retrospective leave migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
