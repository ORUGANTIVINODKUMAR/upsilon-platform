import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import { syncApprovedLeaveLedger } from "./leaveBalanceService.js";
import { canApproverManageLeave } from "./leaveEmailRecipientService.js";
import { createNotification } from "./notificationService.js";
import { sendDecisionEmail, sendFinanceLeaveEmail } from "./emailService.js";

const APPROVED_STATUSES = new Set(["Approved by Manager", "Approved by HR"]);
const PENDING_STATUSES = new Set(["Pending Final Approval", "Pending Reapproval"]);

export class LeaveDecisionError extends Error {
  constructor(message, { code, status = 400 } = {}) {
    super(message);
    this.name = "LeaveDecisionError";
    this.code = code;
    this.status = status;
  }
}

export const assertLeaveDecisionAuthorized = ({ actor, leaveRequest, action }) => {
  if (!["Manager", "HR"].includes(actor.role)) {
    throw new LeaveDecisionError(`Only Manager or HR can ${action} leave`, {
      code: "FORBIDDEN",
      status: 403,
    });
  }
  if (leaveRequest.employeeId._id.toString() === actor._id.toString()) {
    throw new LeaveDecisionError(`You cannot ${action} your own leave request`, {
      code: "FORBIDDEN",
      status: 403,
    });
  }
  if (!canApproverManageLeave({
    approverRole: actor.role,
    applicantRole: leaveRequest.employeeId.role,
  })) {
    throw new LeaveDecisionError(
      "HR leave requests must be reviewed by the assigned Manager",
      { code: "FORBIDDEN", status: 403 },
    );
  }
  if (
    actor.role === "Manager"
    && leaveRequest.managerId?.toString() !== actor._id.toString()
  ) {
    throw new LeaveDecisionError(
      "You are not assigned as Manager for this leave request",
      { code: "FORBIDDEN", status: 403 },
    );
  }
};

const populateDecisionResult = (query) => query
  .populate("employeeId", "name email employeeId designation role profilePhoto")
  .populate("subcategoryId", "name")
  .populate("teamId", "name")
  .populate("teamLeaderId", "name email role")
  .populate("managerApprovedBy", "name email role")
  .populate("hrApprovedBy", "name email role")
  .populate("lastEditedBy", "name email role");

const notifyEmployee = async ({ leaveRequest, actor, action, reason, wasReapproval }) => {
  const approved = action === "approve";
  const status = approved ? "Approved" : "Rejected";
  const title = wasReapproval
    ? `Updated Leave ${approved ? "Reapproved" : "Rejected"}`
    : `Leave ${status}`;
  const message = approved
    ? wasReapproval
      ? `Your updated leave request was reapproved by ${actor.role}.`
      : `Your leave request was approved by ${actor.role}.`
    : wasReapproval
      ? `Your updated leave request was rejected by ${actor.role}. Reason: ${reason}`
      : `Your leave request was rejected by ${actor.role}. Reason: ${reason}`;

  await createNotification({
    recipientId: leaveRequest.employeeId._id,
    title,
    message,
    link: "/dashboard",
  });

  if (leaveRequest.employeeId.email) {
    sendDecisionEmail({
      to: leaveRequest.employeeId.email,
      subject: wasReapproval
        ? `Updated Leave Request ${approved ? "Reapproved" : "Rejected"}`
        : `Leave Request ${status}`,
      title: wasReapproval
        ? `Updated Leave Request ${approved ? "Reapproved" : "Rejected"}`
        : `Leave Request ${status}`,
      employeeName: leaveRequest.employeeId.name,
      requestType: "Leave",
      status,
      rejectionReason: approved ? "" : reason,
      leaveType: leaveRequest.leaveType,
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      approverName: actor.name,
      approverRole: actor.role,
    }).catch((emailError) => {
      console.log(`Leave ${action} email failed:`, emailError.message);
    });
  }
};

const notifyFinance = async ({ leaveRequest, wasReapproval }) => {
  const financeUsers = await User.find({ role: "Finance", isActive: true }).select("_id email");
  await Promise.all(financeUsers.map((financeUser) => createNotification({
    recipientId: financeUser._id,
    title: wasReapproval ? "Reapproved Leave Details" : "Approved Leave Details",
    message: `${leaveRequest.employeeId.name} has an approved ${leaveRequest.leaveType} leave request.`,
    link: "/dashboard",
  })));

  Promise.all(financeUsers.filter((user) => user.email).map((user) => sendFinanceLeaveEmail({
    to: user.email,
    employeeName: leaveRequest.employeeId.name,
    leaveType: leaveRequest.leaveType,
    startDate: leaveRequest.startDate,
    endDate: leaveRequest.endDate,
    workingDays: leaveRequest.workingDays,
    status: leaveRequest.finalStatus,
  }))).catch((emailError) => {
    console.log("Finance leave email failed:", emailError.message);
  });
};

export const processLeaveDecision = async ({
  leaveRequestId,
  actor,
  action,
  rejectionReason = "",
}) => {
  if (!["approve", "reject"].includes(action)) {
    throw new LeaveDecisionError("Invalid leave decision", { code: "INVALID_ACTION" });
  }
  if (!["Manager", "HR"].includes(actor?.role)) {
    throw new LeaveDecisionError(`Only Manager or HR can ${action} leave`, {
      code: "FORBIDDEN",
      status: 403,
    });
  }
  const reason = rejectionReason.trim();
  if (action === "reject" && !reason) {
    throw new LeaveDecisionError("Rejection reason is required", {
      code: "REJECTION_REASON_REQUIRED",
    });
  }

  const leaveRequest = await LeaveRequest.findById(leaveRequestId)
    .populate("employeeId", "name email employeeId role");
  if (!leaveRequest) {
    throw new LeaveDecisionError("Leave request not found", {
      code: "NOT_FOUND",
      status: 404,
    });
  }

  assertLeaveDecisionAuthorized({ actor, leaveRequest, action });

  if (!PENDING_STATUSES.has(leaveRequest.finalStatus)) {
    if (action === "approve" && APPROVED_STATUSES.has(leaveRequest.finalStatus)) {
      await syncApprovedLeaveLedger(leaveRequest, actor._id);
      return { leaveRequest, alreadyProcessed: true, alreadyApproved: true };
    }
    return { leaveRequest, alreadyProcessed: true, alreadyApproved: false };
  }

  const wasReapproval = leaveRequest.finalStatus === "Pending Reapproval";
  const prefix = actor.role === "Manager" ? "manager" : "hr";
  const decision = action === "approve" ? "Approved" : "Rejected";

  leaveRequest[`${prefix}Status`] = decision;
  if (action === "approve") {
    leaveRequest[`${prefix}ApprovedBy`] = actor._id;
    leaveRequest[`${prefix}ApprovedAt`] = new Date();
    leaveRequest[`${prefix}RejectionReason`] = "";
    leaveRequest.rejectionReason = "";
  } else {
    leaveRequest[`${prefix}RejectionReason`] = reason;
    leaveRequest.rejectionReason = reason;
  }
  leaveRequest.finalStatus = `${decision} by ${actor.role}`;
  leaveRequest.requiresReapproval = false;
  leaveRequest.approvalHistory.push({
    level: actor.role,
    action: decision,
    actedBy: actor._id,
    remarks: action === "approve"
      ? wasReapproval ? `Reapproved by ${actor.role}` : `Approved by ${actor.role}`
      : wasReapproval ? `Updated leave rejected by ${actor.role}: ${reason}` : reason,
  });

  await leaveRequest.save();
  await syncApprovedLeaveLedger(leaveRequest, actor._id);
  await notifyEmployee({ leaveRequest, actor, action, reason, wasReapproval });
  if (action === "approve") await notifyFinance({ leaveRequest, wasReapproval });

  const updatedLeaveRequest = await populateDecisionResult(
    LeaveRequest.findById(leaveRequest._id),
  );
  return { leaveRequest: updatedLeaveRequest, alreadyProcessed: false, wasReapproval };
};
