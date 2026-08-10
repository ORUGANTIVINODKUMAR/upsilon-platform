import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import DailyEmailDispatch from "../models/DailyEmailDispatch.js";
import { sendDailyLeaveSummary } from "./emailService.js";
import { deduplicateRecipients, getManagerVisibleTeamIds } from "./leaveEmailRecipientService.js";

export const DAILY_SUMMARY_STATUSES = [
  "Pending Final Approval",
  "Pending Reapproval",
  "Approved by Manager",
  "Approved by HR",
];

export const leaveAppliesToDate = (leave, date) => {
  const target = new Date(date).getTime();
  return new Date(leave.startDate).getTime() <= target && new Date(leave.endDate).getTime() >= target;
};

export const getEmployeesOnLeaveForDate = async (dateKey) => {
  const startOfDay = new Date(`${dateKey}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateKey}T23:59:59.999Z`);
  const leaves = await LeaveRequest.find({
    startDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay },
    finalStatus: { $in: DAILY_SUMMARY_STATUSES },
  })
    .populate("employeeId", "name email teamId subcategoryId isActive")
    .populate("teamId", "name")
    .populate("subcategoryId", "name")
    .lean();

  return leaves
    .filter((leave) => leave.employeeId?.isActive !== false)
    .map((leave) => ({
      leaveRequestId: leave._id.toString(),
      employeeId: leave.employeeId?._id?.toString(),
      employeeName: leave.employeeId?.name || "Unknown employee",
      teamId: leave.teamId?._id?.toString() || leave.employeeId?.teamId?.toString() || "",
      team: leave.teamId?.name || "",
      department: leave.subcategoryId?.name || "",
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      workingDays: leave.workingDays,
      dayType: leave.dayType,
      durationType: leave.durationType,
      isHalfDay: leave.isHalfDay,
      finalStatus: leave.finalStatus,
    }));
};

export const claimDailyEmailDispatch = async ({
  jobName = "daily-leave-summary",
  dateKey,
  recipientKey,
  now = new Date(),
  DispatchModel = DailyEmailDispatch,
}) => {
  try {
    return await DispatchModel.create({
      jobName, dateKey, recipientKey, status: "Sending", attempts: 1, lockedAt: now,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }

  const staleBefore = new Date(now.getTime() - 15 * 60 * 1000);
  return DispatchModel.findOneAndUpdate(
    {
      jobName, dateKey, recipientKey,
      status: { $ne: "Sent" },
      $or: [{ status: "Failed" }, { lockedAt: { $lt: staleBefore } }],
    },
    { $set: { status: "Sending", lockedAt: now, lastError: "" }, $inc: { attempts: 1 } },
    { new: true }
  );
};

const completeDispatch = (dispatch, update) => {
  Object.assign(dispatch, update);
  return dispatch.save();
};

const deliverRecipientSummary = async ({ recipient, dateKey, leaves, scopeLabel }) => {
  const recipientKey = recipient.email.trim().toLowerCase();
  const dispatch = await claimDailyEmailDispatch({ dateKey, recipientKey });
  if (!dispatch) {
    console.info("[daily-leave-summary] Duplicate delivery skipped", { dateKey, recipientKey });
    return "skipped";
  }
  try {
    await sendDailyLeaveSummary({ to: recipient.email, date: `${dateKey}T12:00:00.000Z`, leaves, scopeLabel });
    await completeDispatch(dispatch, { status: "Sent", sentAt: new Date(), lockedAt: null });
    return "sent";
  } catch (error) {
    await completeDispatch(dispatch, { status: "Failed", lockedAt: null, lastError: error.message.slice(0, 1000) });
    throw error;
  }
};

export const runDailyLeaveSummary = async ({ dateKey }) => {
  console.info("[daily-leave-summary] Job started", { dateKey });
  const [leaves, hrUsers, managers, teams] = await Promise.all([
    getEmployeesOnLeaveForDate(dateKey),
    User.find({ role: "HR", isActive: true, email: { $ne: "" } }).select("_id name email role isActive").lean(),
    User.find({ role: "Manager", isActive: true, email: { $ne: "" } }).select("_id name email role isActive assignedTeamIds").lean(),
    Team.find({ isActive: true }).select("_id name managerIds").lean(),
  ]);
  console.info("[daily-leave-summary] Employees found", { dateKey, count: leaves.length });

  const hrRecipients = deduplicateRecipients(hrUsers);
  const hrEmails = new Set(hrRecipients.map((user) => user.email.toLowerCase()));
  const managerRecipients = deduplicateRecipients(managers).filter((user) => !hrEmails.has(user.email.toLowerCase()));
  const deliveries = [
    ...hrRecipients.map((recipient) => ({ recipient, leaves, scopeLabel: "Organization-wide view" })),
    ...managerRecipients.map((recipient) => {
      const teamIds = new Set(getManagerVisibleTeamIds(recipient, teams));
      return { recipient, leaves: leaves.filter((leave) => teamIds.has(leave.teamId)), scopeLabel: "Your teams" };
    }),
  ];

  const results = await Promise.allSettled(deliveries.map((delivery) => deliverRecipientSummary({ ...delivery, dateKey })));
  const failed = results.filter((result) => result.status === "rejected");
  const sent = results.filter((result) => result.status === "fulfilled" && result.value === "sent").length;
  const skipped = results.length - failed.length - sent;
  console.info("[daily-leave-summary] Job completed", { dateKey, recipients: results.length, sent, skipped, failed: failed.length });
  if (failed.length) console.error("[daily-leave-summary] Delivery failures", { dateKey, failed: failed.length, messages: failed.map((item) => item.reason?.message) });
  return { employeeCount: leaves.length, recipients: results.length, sent, skipped, failed: failed.length };
};

