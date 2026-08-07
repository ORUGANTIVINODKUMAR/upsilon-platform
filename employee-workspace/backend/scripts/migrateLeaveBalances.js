import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import LeaveBalanceLedger from "../models/LeaveBalanceLedger.js";
import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import {
  FINAL_APPROVED_LEAVE_STATUSES,
  MONTHLY_PAID_LEAVE_ALLOCATION,
  PERSONAL_LEAVE_ROLES,
  getPeriodsBetween,
  periodToDate,
  sourceKeyToObjectId,
  syncApprovedLeaveLedger,
  toPeriod,
} from "../services/leaveBalanceService.js";

dotenv.config();

const args = process.argv.slice(2);
const applyChanges = args.includes("--apply");
const startArgument = args.find((value) => value.startsWith("--start-period="));
const startPeriod = startArgument?.split("=")[1] || "";

if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(startPeriod)) {
  console.error(
    "Usage: npm run migrate:leave-balances -- --start-period=YYYY-MM [--apply]",
  );
  process.exit(1);
}

const run = async () => {
  await connectDB();
  const currentPeriod = toPeriod();
  if (startPeriod > currentPeriod) {
    throw new Error("Start period cannot be in the future");
  }

  const users = await User.find({ role: { $in: PERSONAL_LEAVE_ROLES } })
    .select("_id name employeeId role dateOfJoining createdAt")
    .lean();
  const startDate = periodToDate(startPeriod);
  const approvedLeaves = await LeaveRequest.find({
    employeeId: { $in: users.map((user) => user._id) },
    finalStatus: { $in: FINAL_APPROVED_LEAVE_STATUSES },
    startDate: { $gte: startDate },
  }).lean();
  const userPeriods = users.map((user) => {
    const userStart = toPeriod(user.dateOfJoining || user.createdAt || startDate);
    const effectiveStart = userStart > startPeriod ? userStart : startPeriod;
    return {
      user,
      periods:
        effectiveStart <= currentPeriod
          ? getPeriodsBetween(effectiveStart, currentPeriod)
          : [],
    };
  });
  const monthlyEntryCount = userPeriods.reduce(
    (sum, item) => sum + item.periods.length,
    0,
  );

  console.log(`Mode: ${applyChanges ? "APPLY" : "DRY RUN"}`);
  console.log(`Allocation period: ${startPeriod} through ${currentPeriod}`);
  console.log(`Applicable users: ${users.length}`);
  console.log(`Monthly credit entries considered: ${monthlyEntryCount}`);
  console.log(`Approved leave entries considered: ${approvedLeaves.length}`);

  if (!applyChanges) {
    console.log("No data changed. Add --apply after reviewing these totals.");
    return;
  }

  const operations = userPeriods.flatMap(({ user, periods }) =>
    periods.map((period) => ({
      updateOne: {
        filter: {
          _id: sourceKeyToObjectId(`monthly:${user._id}:${period}`),
        },
        update: {
          $setOnInsert: {
            userId: user._id,
            entryType: "MONTHLY_CREDIT",
            sourceKey: `monthly:${user._id}:${period}`,
            period,
            amount: MONTHLY_PAID_LEAVE_ALLOCATION,
            leaveDays: 0,
            reason: "Monthly paid leave credit (approved migration)",
            effectiveDate: periodToDate(period),
            active: true,
          },
        },
        upsert: true,
      },
    })),
  );
  if (operations.length > 0) {
    await LeaveBalanceLedger.bulkWrite(operations, { ordered: false });
  }
  for (const leaveRequest of approvedLeaves) {
    await syncApprovedLeaveLedger(leaveRequest);
  }
  console.log("Leave balance migration completed successfully.");
};

run()
  .catch((error) => {
    console.error("Leave balance migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
