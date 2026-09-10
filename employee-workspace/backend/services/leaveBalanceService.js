import crypto from "node:crypto";
import mongoose from "mongoose";
import LeaveBalanceLedger from "../models/LeaveBalanceLedger.js";

export const MONTHLY_PAID_LEAVE_ALLOCATION = 2;
export const PERSONAL_LEAVE_ROLES = [
  "Employee",
  "TeamLeader",
  "Manager",
  "HR",
];
export const FINAL_APPROVED_LEAVE_STATUSES = [
  "Approved by Manager",
  "Approved by HR",
];

export const roundLeaveDays = (value) =>
  Number(Number(value || 0).toFixed(2));

export const toPeriod = (value = new Date()) => {
  const date = new Date(value);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
};

export const periodToDate = (period) => {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
};

export const sourceKeyToObjectId = (sourceKey) =>
  new mongoose.Types.ObjectId(
    crypto.createHash("sha256").update(sourceKey).digest("hex").slice(0, 24),
  );

export const getPeriodsBetween = (startPeriod, endPeriod) => {
  const periods = [];
  const cursor = periodToDate(startPeriod);
  const end = periodToDate(endPeriod);

  while (cursor <= end) {
    periods.push(toPeriod(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return periods;
};

export const calculateBalanceSummary = (entries, currentPeriod = toPeriod(), { onLeaveAllocated } = {}) => {
  const activeEntries = entries.filter((entry) => {
    if (entry.active === false) return false;

    const entryPeriod = entry.period || toPeriod(entry.effectiveDate);
    if (entryPeriod > currentPeriod) return false;

    if (
      entry.entryType === "APPROVED_LEAVE" &&
      entry.leaveRequestId?.finalStatus
    ) {
      return FINAL_APPROVED_LEAVE_STATUSES.includes(
        entry.leaveRequestId.finalStatus,
      );
    }
    return true;
  });
  const sortedEntries = [...activeEntries].sort((left, right) => {
    const dateDifference =
      new Date(left.effectiveDate || periodToDate(left.period)).getTime() -
      new Date(right.effectiveDate || periodToDate(right.period)).getTime();
    if (dateDifference !== 0) return dateDifference;
    const priority = {
      MONTHLY_CREDIT: 0,
      MONTHLY_ALLOCATION_ADJUSTMENT: 0,
      HR_ADJUSTMENT: 1,
      CARRY_FORWARD_ADJUSTMENT: 1,
      APPROVED_LEAVE: 2,
      ATTENDANCE_PAID_LEAVE: 2,
      PAID_USED_ADJUSTMENT: 2,
      UNINFORMED_ABSENCE: 3,
      EXCESS_ADJUSTMENT: 4,
    };
    return (priority[left.entryType] || 0) - (priority[right.entryType] || 0);
  });
  const monthlyEntries = sortedEntries.filter(
    (entry) =>
      entry.entryType === "MONTHLY_CREDIT" ||
      entry.entryType === "MONTHLY_ALLOCATION_ADJUSTMENT",
  );
  const adjustments = sortedEntries.filter(
    (entry) => entry.entryType === "HR_ADJUSTMENT",
  );
  const approvedLeaves = sortedEntries.filter(
    (entry) =>
      entry.entryType === "APPROVED_LEAVE" ||
      entry.entryType === "ATTENDANCE_PAID_LEAVE",
  );
  const uninformedAbsences = sortedEntries.filter(
    (entry) => entry.entryType === "UNINFORMED_ABSENCE",
  );

  const totalAdjustments = adjustments.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0,
  );
  const approvedLeaveDays = approvedLeaves.reduce(
    (sum, entry) => sum + Number(entry.leaveDays || Math.abs(entry.amount) || 0),
    0,
  );
  const uninformedAbsenceDays = uninformedAbsences.reduce(
    (sum, entry) => sum + Number(entry.leaveDays ?? 1),
    0,
  );
  const consumeEntries = (items, onAllocation) =>
    items.reduce(
      (state, entry) => {
        if (
          entry.entryType === "APPROVED_LEAVE" ||
          entry.entryType === "ATTENDANCE_PAID_LEAVE"
        ) {
          const days = Number(entry.leaveDays || Math.abs(entry.amount) || 0);
          const paidDays = Math.min(state.available, days);
          onAllocation?.(entry, { paidDays: roundLeaveDays(paidDays), lopDays: roundLeaveDays(Math.max(days - paidDays, 0)) });
          state.available -= paidDays;
          state.paidUsed += paidDays;
          state.excess += Math.max(days - paidDays, 0);
        } else if (entry.entryType === "PAID_USED_ADJUSTMENT") {
          const amount = Number(entry.amount || 0);
          if (amount >= 0) {
            const paidDays = Math.min(state.available, amount);
            state.available -= paidDays;
            state.paidUsed += paidDays;
            state.excess += Math.max(amount - paidDays, 0);
          } else {
            const refundDays = Math.min(state.paidUsed, -amount);
            state.paidUsed -= refundDays;
            state.available += refundDays;
          }
        } else if (entry.entryType === "UNINFORMED_ABSENCE") {
          state.excess += Number(entry.leaveDays ?? 1);
        } else if (entry.entryType === "EXCESS_ADJUSTMENT") {
          state.excess = Math.max(
            state.excess + Number(entry.amount || 0),
            0,
          );
        } else {
          state.available = Math.max(
            state.available + Number(entry.amount || 0),
            0,
          );
        }
        return state;
      },
      { available: 0, paidUsed: 0, excess: 0 },
    );

  const totals = consumeEntries(sortedEntries, onLeaveAllocated);
  const priorEntries = sortedEntries.filter((entry) => {
    const entryPeriod = entry.period || toPeriod(entry.effectiveDate);
    return entryPeriod < currentPeriod;
  });
  const carryForward = consumeEntries(priorEntries).available;
  const currentMonthlyCredit = monthlyEntries
    .filter((entry) => entry.period === currentPeriod)
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const lastUpdated = activeEntries.reduce((latest, entry) => {
    const value = new Date(entry.updatedAt || entry.effectiveDate || 0);
    return !latest || value > latest ? value : latest;
  }, null);

  return {
    period: currentPeriod,
    monthlyAllocation: roundLeaveDays(currentMonthlyCredit),
    carryForward: roundLeaveDays(carryForward),
    hrAdjustments: roundLeaveDays(totalAdjustments),
    availablePaidLeave: roundLeaveDays(totals.available),
    paidLeaveUsed: roundLeaveDays(totals.paidUsed),
    approvedLeaveDays: roundLeaveDays(approvedLeaveDays),
    uninformedAbsenceDays: roundLeaveDays(uninformedAbsenceDays),
    excessLeaveDays: roundLeaveDays(totals.excess),
    lastUpdated,
  };
};

export const ensureMonthlyCredits = async (userId, now = new Date()) => {
  const currentPeriod = toPeriod(now);
  const latestCredit = await LeaveBalanceLedger.findOne({
    userId,
    entryType: "MONTHLY_CREDIT",
    active: true,
  })
    .sort({ period: -1 })
    .select("period")
    .lean();
  const periods = latestCredit?.period
    ? getPeriodsBetween(latestCredit.period, currentPeriod).slice(1)
    : [currentPeriod];

  if (periods.length === 0) {
    return;
  }

  try {
    await LeaveBalanceLedger.bulkWrite(
      periods.map((period) => ({
        updateOne: {
          filter: {
            _id: sourceKeyToObjectId(`monthly:${userId}:${period}`),
          },
          update: {
            $setOnInsert: {
              userId,
              entryType: "MONTHLY_CREDIT",
              sourceKey: `monthly:${userId}:${period}`,
              period,
              amount: MONTHLY_PAID_LEAVE_ALLOCATION,
              leaveDays: 0,
              reason: "Monthly paid leave credit",
              effectiveDate: periodToDate(period),
              active: true,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  } catch (error) {
    const writeErrors = error.writeErrors || [];
    if (error.code !== 11000 && !writeErrors.every((item) => item.code === 11000)) {
      throw error;
    }
  }
};

export const getLeaveBalanceForUser = async (
  userId,
  { includeHistory = true, historyLimit = 30, now = new Date() } = {},
) => {
  await ensureMonthlyCredits(userId, now);
  const entries = await LeaveBalanceLedger.find({ userId })
    .populate("createdBy", "name employeeId role")
    .populate("leaveRequestId", "leaveType startDate endDate workingDays finalStatus")
    .populate("attendanceRecordId", "attendanceDate attendanceType status durationDays remarks")
    .sort({ effectiveDate: -1, createdAt: -1 })
    .lean();
  const summary = calculateBalanceSummary(entries, toPeriod(now));

  return {
    ...summary,
    history: includeHistory ? entries.slice(0, historyLimit) : undefined,
  };
};

export const syncApprovedLeaveLedger = async (leaveRequest, actedBy = null) => {
  const leaveRequestId = leaveRequest._id;
  const isApproved = FINAL_APPROVED_LEAVE_STATUSES.includes(
    leaveRequest.finalStatus,
  );
  const leaveDays = Math.max(Number(leaveRequest.workingDays || 0), 0);
  const sourceKey = `leave:${leaveRequestId}`;

  if (!isApproved) {
    await LeaveBalanceLedger.updateOne(
      { _id: sourceKeyToObjectId(sourceKey) },
      {
        $set: {
          active: false,
          reason: `Leave charge inactive: ${leaveRequest.finalStatus}`,
        },
      },
    );
    return;
  }

  await ensureMonthlyCredits(leaveRequest.employeeId?._id || leaveRequest.employeeId);
  const filter = { _id: sourceKeyToObjectId(sourceKey) };
  const update = {
    $set: {
      userId: leaveRequest.employeeId?._id || leaveRequest.employeeId,
      entryType: "APPROVED_LEAVE",
      sourceKey,
      period: toPeriod(leaveRequest.startDate),
      amount: -leaveDays,
      leaveDays,
      leaveRequestId,
      reason: `Final approved ${leaveRequest.leaveType} leave`,
      createdBy: actedBy,
      effectiveDate: leaveRequest.startDate || new Date(),
      active: true,
    },
  };

  try {
    await LeaveBalanceLedger.updateOne(filter, update, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    await LeaveBalanceLedger.updateOne(filter, update);
  }
};

export const syncUninformedAbsenceLedger = async (
  attendanceRecord,
  actedBy = null,
  { session = null } = {},
) => {
  const attendanceRecordId = attendanceRecord._id;
  const userId = attendanceRecord.employeeId?._id || attendanceRecord.employeeId;
  const sourceKey = `attendance:${attendanceRecordId}`;
  const leaveDays = Number(attendanceRecord.durationDays ?? 1);
  const filter = { _id: sourceKeyToObjectId(sourceKey) };

  if (attendanceRecord.active === false) {
    await LeaveBalanceLedger.updateOne(
      filter,
      { $set: { active: false, reason: "Attendance record cancelled" } },
      session ? { session } : {},
    );
    return;
  }

  const isPaidLeave = attendanceRecord.balanceTreatment === "PAID";
  const ledgerLeaveDays = attendanceRecord.balanceTreatment === "NONE" ? 0 : leaveDays;
  const update = {
    $set: {
      userId,
      entryType: isPaidLeave ? "ATTENDANCE_PAID_LEAVE" : "UNINFORMED_ABSENCE",
      sourceKey,
      period: toPeriod(attendanceRecord.attendanceDate),
      amount: 0,
      leaveDays: ledgerLeaveDays,
      leaveRequestId: null,
      attendanceRecordId,
      reason: isPaidLeave
        ? `${attendanceRecord.status || "Manual attendance leave"} - ${ledgerLeaveDays} paid leave day${ledgerLeaveDays === 1 ? "" : "s"}`
        : ledgerLeaveDays > 0
        ? `${attendanceRecord.status || "Uninformed absence"} - ${ledgerLeaveDays} Loss of Pay day${ledgerLeaveDays === 1 ? "" : "s"}`
        : `${attendanceRecord.status || "Permission"} - No leave deduction`,
      createdBy: actedBy,
      effectiveDate: attendanceRecord.attendanceDate,
      active: true,
    },
  };

  try {
    await LeaveBalanceLedger.updateOne(filter, update, {
      upsert: true,
      ...(session ? { session } : {}),
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    await LeaveBalanceLedger.updateOne(
      filter,
      update,
      session ? { session } : {},
    );
  }
};
