import mongoose from "mongoose";
import LeaveBalanceLedger from "../models/LeaveBalanceLedger.js";
import User from "../models/User.js";
import {
  PERSONAL_LEAVE_ROLES,
  getLeaveBalanceForUser,
  toPeriod,
} from "../services/leaveBalanceService.js";

const requirePersonalLeaveRole = (req, res) => {
  if (!PERSONAL_LEAVE_ROLES.includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: "This account does not use the personal leave balance system",
    });
    return false;
  }
  return true;
};

const requireBalanceManager = (req, res) => {
  if (!["HR", "Manager"].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: "Only HR or Manager can manage company leave balances",
    });
    return false;
  }
  return true;
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasAtMostTwoDecimalPlaces = (value) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;

const ADJUSTMENT_ENTRY_TYPES = {
  available: "HR_ADJUSTMENT",
  paidUsed: "PAID_USED_ADJUSTMENT",
};

export const getMyLeaveBalance = async (req, res) => {
  try {
    if (!requirePersonalLeaveRole(req, res)) return;

    const balance = await getLeaveBalanceForUser(req.user._id);
    return res.status(200).json({ success: true, balance });
  } catch (error) {
    console.error("GET MY LEAVE BALANCE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve leave balance",
    });
  }
};

export const getHrLeaveBalances = async (req, res) => {
  try {
    if (!requireBalanceManager(req, res)) return;

    const search = req.query.search?.trim() || "";
    const role = req.query.role?.trim() || "";
    const query = {
      isActive: true,
      role: {
        $in:
          role && PERSONAL_LEAVE_ROLES.includes(role)
            ? [role]
            : PERSONAL_LEAVE_ROLES,
      },
    };

    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { name: pattern },
        { email: pattern },
        { employeeId: pattern },
      ];
    }

    const users = await User.find(query)
      .select("name email employeeId role subcategoryId teamId")
      .populate("subcategoryId", "name")
      .populate("teamId", "name")
      .sort({ name: 1 })
      .lean();
    const balances = await Promise.all(
      users.map(async (user) => ({
        user,
        balance: await getLeaveBalanceForUser(user._id, {
          includeHistory: false,
        }),
      })),
    );

    return res.status(200).json({ success: true, balances });
  } catch (error) {
    console.error("GET HR LEAVE BALANCES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve company leave balances",
    });
  }
};

export const getHrLeaveBalanceHistory = async (req, res) => {
  try {
    if (!requireBalanceManager(req, res)) return;
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findOne({
      _id: req.params.userId,
      role: { $in: PERSONAL_LEAVE_ROLES },
    })
      .select("name email employeeId role subcategoryId teamId")
      .populate("subcategoryId", "name")
      .populate("teamId", "name")
      .lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const balance = await getLeaveBalanceForUser(user._id, { historyLimit: 200 });
    return res.status(200).json({ success: true, user, balance });
  } catch (error) {
    console.error("GET HR LEAVE BALANCE HISTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve leave balance history",
    });
  }
};

export const createHrLeaveAdjustment = async (req, res) => {
  try {
    if (!requireBalanceManager(req, res)) return;
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const field = ADJUSTMENT_ENTRY_TYPES[req.body.field] ? req.body.field : "available";
    const entryType = ADJUSTMENT_ENTRY_TYPES[field];

    const amount = Number(req.body.amount);
    const reason = req.body.reason?.trim() || "";
    if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 365) {
      return res.status(400).json({
        success: false,
        message: "Adjustment must be a non-zero number between -365 and 365",
      });
    }
    if (!hasAtMostTwoDecimalPlaces(amount)) {
      return res.status(400).json({
        success: false,
        message: "Adjustment must have no more than two decimal places",
      });
    }
    if (reason.length < 3 || reason.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Adjustment reason must contain between 3 and 500 characters",
      });
    }

    const user = await User.findOne({
      _id: req.params.userId,
      role: { $in: PERSONAL_LEAVE_ROLES },
    }).select("_id");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const now = new Date();
    await LeaveBalanceLedger.create({
      userId: user._id,
      entryType,
      period: toPeriod(now),
      amount,
      leaveDays: 0,
      reason,
      createdBy: req.user._id,
      effectiveDate: now,
      active: true,
    });
    const balance = await getLeaveBalanceForUser(user._id);

    return res.status(201).json({
      success: true,
      message:
        field === "paidUsed"
          ? "Paid leave used adjustment recorded"
          : "Leave balance adjustment recorded",
      balance,
    });
  } catch (error) {
    console.error("CREATE HR LEAVE ADJUSTMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to record leave balance adjustment",
    });
  }
};
