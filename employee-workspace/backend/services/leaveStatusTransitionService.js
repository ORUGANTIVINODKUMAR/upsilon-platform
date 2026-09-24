export const MANAGED_LEAVE_STATUSES = {
  Manager: [
    "Pending Final Approval",
    "On Hold",
    "Approved by Manager",
    "Rejected by Manager",
  ],
  HR: [
    "Pending Final Approval",
    "On Hold",
    "Approved by HR",
    "Rejected by HR",
  ],
};

export const getManagedLeaveStatuses = (role) =>
  MANAGED_LEAVE_STATUSES[role] || [];

export const applyManagedLeaveStatus = ({
  leaveRequest,
  status,
  role,
  actorId,
  remarks,
  now = new Date(),
}) => {
  if (!getManagedLeaveStatuses(role).includes(status)) {
    throw new Error("Invalid status");
  }

  if (
    status.startsWith("Approved by ")
    && !["Approved", "Not Required"].includes(leaveRequest.tlStatus)
  ) {
    const error = new Error(
      leaveRequest.tlStatus === "Rejected"
        ? "This leave request was rejected by the Team Leader and cannot be approved"
        : "Team Leader approval is required before Manager or HR approval",
    );
    error.code = "TEAM_LEADER_APPROVAL_REQUIRED";
    error.status = 409;
    throw error;
  }

  const trimmedRemarks = remarks.trim();
  const previousStatus = leaveRequest.finalStatus;
  const rolePrefix = role === "Manager" ? "manager" : "hr";

  leaveRequest.finalStatus = status;
  leaveRequest.lastStatusChangedBy = actorId;
  leaveRequest.lastStatusChangedAt = now;
  leaveRequest.requiresReapproval = false;

  if (status === "Pending Final Approval") {
    leaveRequest.managerStatus = "Pending";
    leaveRequest.hrStatus = "Pending";
    leaveRequest.managerRejectionReason = "";
    leaveRequest.hrRejectionReason = "";
    leaveRequest.rejectionReason = "";
  } else if (status.startsWith("Approved by ")) {
    leaveRequest[`${rolePrefix}Status`] = "Approved";
    leaveRequest[`${rolePrefix}ApprovedBy`] = actorId;
    leaveRequest[`${rolePrefix}ApprovedAt`] = now;
    leaveRequest[`${rolePrefix}RejectionReason`] = "";
    leaveRequest.rejectionReason = "";
  } else if (status.startsWith("Rejected by ")) {
    leaveRequest[`${rolePrefix}Status`] = "Rejected";
    leaveRequest[`${rolePrefix}RejectionReason`] = trimmedRemarks;
    leaveRequest.rejectionReason = trimmedRemarks;
  }

  leaveRequest.statusHistory.push({
    previousStatus,
    newStatus: status,
    changedBy: actorId,
    changedAt: now,
    remarks: trimmedRemarks,
  });

  leaveRequest.approvalHistory.push({
    level: role,
    action: "Status Changed",
    actedBy: actorId,
    actedAt: now,
    remarks: `${previousStatus} -> ${status} | ${trimmedRemarks}`,
  });

  return { previousStatus };
};
