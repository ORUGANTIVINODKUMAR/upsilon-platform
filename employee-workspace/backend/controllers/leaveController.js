import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import Holiday from "../models/Holiday.js";
import Team from "../models/Team.js";

import {
  createNotification,
} from "../services/notificationService.js";

import {
  sendDecisionEmail,
  sendFinanceLeaveEmail,
  sendLeaveRequestNotification,
} from "../services/emailService.js";
import { getLeaveNotificationRecipients } from "../services/leaveEmailRecipientService.js";
import {
  PERSONAL_LEAVE_ROLES,
  syncApprovedLeaveLedger,
} from "../services/leaveBalanceService.js";
import {
  buildOverlapQuery,
  canCancelOwnLeaveRequest,
  canDeleteOwnLeaveRequest,
  describeLeaveTiming,
  getOverlapMessage,
  getRetrospectivePolicy,
  validateLeaveDateRange,
} from "../services/leaveRequestPolicy.js";
import {
  getLeaveApprovalExportRange,
  getLeaveApprovalStatusFilter,
  getLeaveApprovalVisibilityFilter,
  leaveRequestMatchesSearch,
} from "../services/leaveApprovalExportPolicy.js";

const APPROVED_LEAVE_STATUSES = [
  "Approved by Manager",
  "Approved by HR",
];

const REJECTED_LEAVE_STATUSES = [
  "Rejected by Manager",
  "Rejected by HR",
];

const PENDING_LEAVE_STATUSES = [
  "Pending Final Approval",
  "Pending Reapproval",
];

const EDITABLE_LEAVE_TYPES = [
  "Sick",
  "Vacation",
  "Personal",
  "Travel",
  "Casual",
  "Earned",
  "Emergency",
];

const calculateWorkingDays = async (
  startDate,
  endDate
) => {
  const holidays = await Holiday.find({}).select(
    "holidayDate"
  );

  const holidayDates = new Set(
    holidays.map((holiday) =>
      new Date(holiday.holidayDate)
        .toISOString()
        .split("T")[0]
    )
  );

  let count = 0;

  const current = new Date(startDate);
  const end = new Date(endDate);

  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const day = current.getDay();

    const formattedDate = current
      .toISOString()
      .split("T")[0];

    const isWeekend =
      day === 0 || day === 6;

    const isHoliday =
      holidayDates.has(formattedDate);

    if (!isWeekend && !isHoliday) {
      count += 1;
    }

    current.setDate(
      current.getDate() + 1
    );
  }

  return count;
};

const normalizeDateForComparison = (
  value
) => {
  if (!value) {
    return "";
  }

  return new Date(value)
    .toISOString()
    .split("T")[0];
};

const getLeaveSnapshot = (
  leaveRequest
) => ({
  leaveType:
    leaveRequest.leaveType || "",

  startDate:
    leaveRequest.startDate || null,

  endDate:
    leaveRequest.endDate || null,

  reason:
    leaveRequest.reason || "",

  leaveExplanation:
    leaveRequest.leaveExplanation || "",

  workingDays:
    leaveRequest.workingDays || 0,

  proofFile:
    leaveRequest.proofFile || "",

  finalStatus:
    leaveRequest.finalStatus || "",
});

const getChangedLeaveFields = (
  previousValues,
  updatedValues
) => {
  const changedFields = [];

  if (
    previousValues.leaveType !==
    updatedValues.leaveType
  ) {
    changedFields.push("leaveType");
  }

  if (
    normalizeDateForComparison(
      previousValues.startDate
    ) !==
    normalizeDateForComparison(
      updatedValues.startDate
    )
  ) {
    changedFields.push("startDate");
  }

  if (
    normalizeDateForComparison(
      previousValues.endDate
    ) !==
    normalizeDateForComparison(
      updatedValues.endDate
    )
  ) {
    changedFields.push("endDate");
  }

  if (
    previousValues.reason !==
    updatedValues.reason
  ) {
    changedFields.push("reason");
  }

  if (
    previousValues.leaveExplanation !==
    updatedValues.leaveExplanation
  ) {
    changedFields.push(
      "leaveExplanation"
    );
  }

  if (
    Number(
      previousValues.workingDays
    ) !==
    Number(
      updatedValues.workingDays
    )
  ) {
    changedFields.push(
      "workingDays"
    );
  }

  if (
    previousValues.proofFile !==
    updatedValues.proofFile
  ) {
    changedFields.push("proofFile");
  }

  return changedFields;
};

const getUniqueUserIds = (
  values
) => {
  return [
    ...new Set(
      values
        .filter(Boolean)
        .map((value) =>
          value.toString()
        )
    ),
  ];
};

export const createLeaveRequest = async (
  req,
  res
) => {
  try {
    if (
      !PERSONAL_LEAVE_ROLES.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This role cannot submit personal leave requests",
      });
    }

    const {
      leaveType,
      startDate,
      endDate,
      reason,
      leaveExplanation,
    } = req.body;

    if (
      !EDITABLE_LEAVE_TYPES.includes(
        leaveType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type",
      });
    }

    if (
      !startDate ||
      !endDate ||
      !reason?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Leave type, dates, and reason are required",
      });
    }

    const employee =
      await User.findById(
        req.user._id
      );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!employee.subcategoryId) {
      return res.status(400).json({
        success: false,
        message:
          "User is not assigned to any department",
      });
    }

    const requiresTeam = ["Employee", "TeamLeader"].includes(employee.role);

    const team = requiresTeam && employee.teamId
      ? await Team.findById(
          employee.teamId
        )
          .populate(
            "teamLeaderId",
            "name email role isActive"
          )
          .populate(
            "managerIds",
            "name email role isActive"
          )
          .populate(
            "hrIds",
            "name email role isActive"
          )
      : null;

    if (requiresTeam && !team) {
      return res.status(400).json({
        success: false,
        message:
          "User is not assigned to any team",
      });
    }

    const isTeamLeader =
      employee.role === "TeamLeader";

    const assignedTeamLeader =
      isTeamLeader || !requiresTeam
        ? null
        : team.teamLeaderId;

    const assignedManager = requiresTeam
      ? team.managerIds?.find(
          (manager) => manager.isActive !== false
        ) || null
      : null;

    if (
      requiresTeam &&
      !isTeamLeader &&
      !assignedTeamLeader
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No Team Leader assigned for this team",
      });
    }

    if (requiresTeam && !assignedManager) {
      return res.status(400).json({
        success: false,
        message:
          "No Manager assigned for this team",
      });
    }

    const submittedAt = new Date();
    const dateValidation = validateLeaveDateRange({
      startDate,
      endDate,
      now: submittedAt,
    });

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        code: dateValidation.code || "INVALID_LEAVE_DATES",
        message: dateValidation.message,
      });
    }

    const parsedStartDate = dateValidation.startDate;
    const parsedEndDate = dateValidation.endDate;

    const overlappingRequest = await LeaveRequest.findOne(
      buildOverlapQuery({
        employeeId: employee._id,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      })
    ).select("startDate endDate finalStatus");

    if (overlappingRequest) {
      return res.status(409).json({
        success: false,
        code: "LEAVE_DATE_OVERLAP",
        message: getOverlapMessage(overlappingRequest),
      });
    }

    const workingDays =
      await calculateWorkingDays(
        parsedStartDate,
        parsedEndDate
      );

    if (workingDays <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Leave cannot be applied only on weekends or holidays.",
      });
    }

    const hrApprover = await User.findOne({
      role: "HR",
      isActive: true,
      _id: { $ne: employee._id },
    }).select("_id");

    if (["Manager", "HR"].includes(employee.role) && !hrApprover) {
      return res.status(400).json({
        success: false,
        message: "No other active HR user is available for final approval",
      });
    }

    const submissionLevel =
      employee.role === "Employee"
        ? "TeamLeader"
        : employee.role === "TeamLeader"
          ? "Manager"
          : "HR";

    const leaveRequest =
      await LeaveRequest.create({
        employeeId:
          employee._id,

        subcategoryId:
          employee.subcategoryId,

        teamId:
          requiresTeam ? employee.teamId || null : null,

        teamLeaderId:
          isTeamLeader || !requiresTeam
            ? null
            : assignedTeamLeader?._id ||
              null,

        managerId:
          assignedManager?._id || null,

        hrId:
          hrApprover?._id ||
          team?.hrIds?.find((hr) => hr.isActive !== false)?._id ||
          null,

        leaveType,

        startDate:
          parsedStartDate,

        endDate:
          parsedEndDate,

        submittedAt,

        requestKind:
          dateValidation.requestKind,

        retrospectiveDays:
          dateValidation.retrospectiveDays,

        reason:
          reason.trim(),

        leaveExplanation:
          leaveExplanation?.trim() ||
          "",

        workingDays,

        proofFile:
          req.file?.path || "",

        tlStatus:
          isTeamLeader || !requiresTeam
            ? "Not Required"
            : "Pending",

        managerStatus:
          "Pending",

        hrStatus:
          "Pending",

        finalStatus:
          "Pending Final Approval",

        requiresReapproval:
          false,

        approvalHistory: [
          {
            level:
              submissionLevel,

            action: "Submitted",

            actedBy:
              employee._id,

            remarks:
              dateValidation.requestKind === "Retrospective"
                ? `Past leave request submitted ${dateValidation.retrospectiveDays} day(s) after the leave start date`
                : "Leave request submitted",
          },
        ],
      });

    const hrUsers =
      await User.find({
        role: "HR",
        isActive: true,
      }).select(
        "_id name email role"
      );

    const notificationUsers =
      isTeamLeader
        ? [
            assignedManager,
            ...hrUsers,
          ]
        : [
            assignedTeamLeader,
            assignedManager,
            ...hrUsers,
          ];

    const uniqueNotificationUsers =
      [
        ...new Map(
          notificationUsers
            .filter(Boolean)
            .map((approver) => [
              approver._id.toString(),
              approver,
            ])
        ).values(),
      ];

    await Promise.all(
      uniqueNotificationUsers.map(
        (approver) =>
          createNotification({
            recipientId:
              approver._id,

            title:
              "New Leave Request",

            message:
              `${employee.name} submitted a ${leaveType} leave request.`,

            link:
              "/dashboard",
          })
      )
    );

    const emailRecipients = getLeaveNotificationRecipients({
      team,
      hrUsers,
      employeeId: employee._id,
    });
    const workspaceUrl = process.env.WORKSPACE_URL?.trim()?.replace(/\/$/, "");
    const emailNotification = await sendLeaveRequestNotification({
      recipients: emailRecipients,
      employee,
      leaveRequest,
      reviewUrl: workspaceUrl ? `${workspaceUrl}/dashboard?page=managerApprovals` : "",
    });

    return res.status(201).json({
      success: true,
      message:
        dateValidation.requestKind === "Retrospective"
          ? "Past leave request submitted successfully and sent for approval"
          : "Leave request submitted successfully",
      leaveRequest,
      emailNotification,
    });
  } catch (error) {
    console.error(
      "CREATE LEAVE REQUEST ERROR:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          Object.values(
            error.errors
          )
            .map(
              (item) =>
                item.message
            )
            .join(", ") ||
          "Leave request validation failed",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create leave request",
    });
  }
};
export const updateMyLeaveRequest = async (
  req,
  res
) => {
  try {
    const {
      leaveType,
      startDate,
      endDate,
      reason,
      leaveExplanation,
      editRemarks,
    } = req.body;

    const leaveRequest =
      await LeaveRequest.findById(
        req.params.id
      );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Leave request not found",
      });
    }

    if (
      leaveRequest.employeeId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can edit only your own leave request",
      });
    }

    if (
      REJECTED_LEAVE_STATUSES.includes(
        leaveRequest.finalStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rejected leave requests cannot be edited",
      });
    }

    const normalizedLeaveType =
      leaveType?.trim() ||
      leaveRequest.leaveType;

    const normalizedReason =
      reason !== undefined
        ? reason.trim()
        : leaveRequest.reason;

    const normalizedExplanation =
      leaveExplanation !== undefined
        ? leaveExplanation.trim()
        : leaveRequest.leaveExplanation ||
          "";

    const normalizedStartDate =
      startDate !== undefined
        ? startDate
        : leaveRequest.startDate;

    const normalizedEndDate =
      endDate !== undefined
        ? endDate
        : leaveRequest.endDate;

    if (
      !EDITABLE_LEAVE_TYPES.includes(
        normalizedLeaveType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid leave type",
      });
    }

    if (!normalizedReason) {
      return res.status(400).json({
        success: false,
        message:
          "Leave reason is required",
      });
    }

    if (
      !normalizedStartDate ||
      !normalizedEndDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Start date and end date are required",
      });
    }

    const datesChanged =
      normalizeDateForComparison(normalizedStartDate) !==
        normalizeDateForComparison(leaveRequest.startDate) ||
      normalizeDateForComparison(normalizedEndDate) !==
        normalizeDateForComparison(leaveRequest.endDate);

    const dateValidation = validateLeaveDateRange({
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      enforceRetrospectiveLimit: datesChanged,
    });

    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        code: dateValidation.code || "INVALID_LEAVE_DATES",
        message: dateValidation.message,
      });
    }

    const parsedStartDate = dateValidation.startDate;
    const parsedEndDate = dateValidation.endDate;

    const overlappingRequest = await LeaveRequest.findOne(
      buildOverlapQuery({
        employeeId: req.user._id,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        excludeId: leaveRequest._id,
      })
    ).select("startDate endDate finalStatus");

    if (overlappingRequest) {
      return res.status(409).json({
        success: false,
        code: "LEAVE_DATE_OVERLAP",
        message: getOverlapMessage(overlappingRequest),
      });
    }

    const updatedWorkingDays =
      await calculateWorkingDays(
        parsedStartDate,
        parsedEndDate
      );

    if (updatedWorkingDays <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Leave cannot be applied only on weekends or holidays.",
      });
    }

    const previousValues =
      getLeaveSnapshot(
        leaveRequest
      );

    const updatedValues = {
      leaveType:
        normalizedLeaveType,

      startDate:
        parsedStartDate,

      endDate:
        parsedEndDate,

      reason:
        normalizedReason,

      leaveExplanation:
        normalizedExplanation,

      workingDays:
        updatedWorkingDays,

      proofFile:
        req.file?.path ||
        leaveRequest.proofFile ||
        "",

      finalStatus:
        leaveRequest.finalStatus,
    };

    const changedFields =
      getChangedLeaveFields(
        previousValues,
        updatedValues
      );

    if (
      changedFields.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No leave details were changed",
      });
    }

    const wasApproved =
      APPROVED_LEAVE_STATUSES.includes(
        leaveRequest.finalStatus
      );

    const wasPending =
      PENDING_LEAVE_STATUSES.includes(
        leaveRequest.finalStatus
      );

    if (
      !wasApproved &&
      !wasPending
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This leave request cannot be edited in its current status",
      });
    }

    leaveRequest.leaveType =
      updatedValues.leaveType;

    leaveRequest.startDate =
      updatedValues.startDate;

    leaveRequest.endDate =
      updatedValues.endDate;

    const timing = describeLeaveTiming(
      updatedValues.startDate,
      leaveRequest.submittedAt || leaveRequest.createdAt,
    );

    leaveRequest.requestKind = timing.requestKind;
    leaveRequest.retrospectiveDays = timing.retrospectiveDays;

    leaveRequest.reason =
      updatedValues.reason;

    leaveRequest.leaveExplanation =
      updatedValues.leaveExplanation;

    leaveRequest.workingDays =
      updatedValues.workingDays;

    leaveRequest.proofFile =
      updatedValues.proofFile;

    let requiredReapproval = false;

    if (wasApproved) {
      requiredReapproval = true;

      leaveRequest.finalStatus =
        "Pending Reapproval";

      leaveRequest.requiresReapproval =
        true;

      leaveRequest.reapprovalCount =
        (leaveRequest.reapprovalCount ||
          0) + 1;

      leaveRequest.managerStatus =
        "Pending";

      leaveRequest.managerApprovedBy =
        null;

      leaveRequest.managerApprovedAt =
        null;

      leaveRequest.managerRejectionReason =
        "";

      leaveRequest.hrStatus =
        "Pending";

      leaveRequest.hrApprovedBy =
        null;

      leaveRequest.hrApprovedAt =
        null;

      leaveRequest.hrRejectionReason =
        "";

      leaveRequest.rejectionReason =
        "";

      if (
        leaveRequest.tlStatus !==
        "Not Required"
      ) {
        leaveRequest.tlStatus =
          "Pending";

        leaveRequest.tlApprovedBy =
          null;

        leaveRequest.tlApprovedAt =
          null;

        leaveRequest.tlRejectionReason =
          "";
      }
    } else {
      leaveRequest.requiresReapproval =
        leaveRequest.finalStatus ===
        "Pending Reapproval";
    }

    updatedValues.finalStatus =
      leaveRequest.finalStatus;

    const now = new Date();

    leaveRequest.lastEditedBy =
      req.user._id;

    leaveRequest.lastEditedAt =
      now;

    leaveRequest.editHistory.push({
      editedBy:
        req.user._id,

      editedAt:
        now,

      previousValues,

      updatedValues,

      changedFields,

      requiredReapproval,

      remarks:
        editRemarks?.trim() ||
        (requiredReapproval
          ? "Approved leave edited and sent for reapproval"
          : "Pending leave request updated"),
    });

    leaveRequest.approvalHistory.push({
      level: req.user.role,

      action:
        "Edited",

      actedBy:
        req.user._id,

      remarks:
        `Updated fields: ${changedFields.join(
          ", "
        )}`,
    });

    if (requiredReapproval) {
      leaveRequest.approvalHistory.push({
        level:
          req.user.role === "Employee"
            ? "TeamLeader"
            : req.user.role === "TeamLeader"
              ? "Manager"
              : "HR",

        action:
          "Sent for Reapproval",

        actedBy:
          req.user._id,

        remarks:
          "Leave request was edited after approval and requires fresh approval",
      });
    }

    await leaveRequest.save();

    await syncApprovedLeaveLedger(leaveRequest, req.user._id);

    const hrUsers =
      await User.find({
        role: "HR",
        isActive: true,
      }).select(
        "_id email"
      );

    const recipientIds =
      getUniqueUserIds([
        leaveRequest.managerId,
        leaveRequest.teamLeaderId,
        ...hrUsers.map(
          (hr) => hr._id
        ),
      ]);

    const notificationTitle =
      requiredReapproval
        ? "Leave Request Updated for Reapproval"
        : "Leave Request Updated";

    const notificationMessage =
      requiredReapproval
        ? `${req.user.name} updated an approved ${leaveRequest.leaveType} leave request. Fresh approval is required.`
        : `${req.user.name} updated their ${leaveRequest.leaveType} leave request.`;

    await Promise.all(
      recipientIds.map(
        (recipientId) =>
          createNotification({
            recipientId,

            title:
              notificationTitle,

            message:
              notificationMessage,

            link:
              "/dashboard",
          })
      )
    );

    const emailRecipients = await User.find({
      _id: { $in: recipientIds },
      isActive: true,
      email: { $ne: "" },
    }).select("_id name email role isActive");
    const workspaceUrl = process.env.WORKSPACE_URL?.trim()?.replace(/\/$/, "");
    await sendLeaveRequestNotification({
      recipients: emailRecipients,
      employee: req.user,
      leaveRequest,
      notificationTitle,
      reviewUrl: workspaceUrl ? `${workspaceUrl}/dashboard?page=managerApprovals` : "",
    });

    const updatedLeaveRequest =
      await LeaveRequest.findById(
        leaveRequest._id
      )
        .populate(
          "employeeId",
          "name email employeeId designation role profilePhoto"
        )
        .populate(
          "subcategoryId",
          "name"
        )
        .populate(
          "teamId",
          "name"
        )
        .populate(
          "teamLeaderId",
          "name email role"
        )
        .populate(
          "managerId",
          "name email role"
        )
        .populate(
          "lastEditedBy",
          "name email role"
        )
        .populate(
          "editHistory.editedBy",
          "name email role"
        );

    return res.status(200).json({
      success: true,

      message:
        requiredReapproval
          ? "Leave request updated and sent for reapproval"
          : "Leave request updated successfully",

      leaveRequest:
        updatedLeaveRequest,

      requiredReapproval,
    });
  } catch (error) {
    console.error(
      "UPDATE LEAVE REQUEST ERROR:",
      error
    );

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid leave request ID",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          Object.values(
            error.errors
          )
            .map(
              (item) =>
                item.message
            )
            .join(", ") ||
          "Leave request validation failed",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Unable to update leave request",
    });
  }
};

export const cancelMyLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (leaveRequest.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can cancel only your own leave request",
      });
    }

    if (!canCancelOwnLeaveRequest({
      ownerId: leaveRequest.employeeId,
      userId: req.user._id,
      finalStatus: leaveRequest.finalStatus,
    })) {
      return res.status(400).json({
        success: false,
        message: "Only a pending leave request can be cancelled",
      });
    }

    const previousStatus = leaveRequest.finalStatus;
    const now = new Date();
    leaveRequest.finalStatus = "Cancelled";
    leaveRequest.requiresReapproval = false;
    leaveRequest.lastStatusChangedBy = req.user._id;
    leaveRequest.lastStatusChangedAt = now;
    leaveRequest.approvalHistory.push({
      level: "Employee",
      action: "Cancelled",
      actedBy: req.user._id,
      actedAt: now,
      remarks: "Leave request cancelled by employee",
    });
    leaveRequest.statusHistory.push({
      previousStatus,
      newStatus: "Cancelled",
      changedBy: req.user._id,
      changedAt: now,
      remarks: "Cancelled by employee",
    });

    await leaveRequest.save();
    await syncApprovedLeaveLedger(leaveRequest, req.user._id);

    return res.status(200).json({
      success: true,
      message: "Leave request cancelled successfully",
      leaveRequest,
    });
  } catch (error) {
    console.error("CANCEL LEAVE REQUEST ERROR:", error);

    return res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError"
        ? "Invalid leave request ID"
        : "Unable to cancel leave request",
    });
  }
};

export const deleteMyLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }
    if (leaveRequest.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can delete only your own leave request" });
    }
    if (!canDeleteOwnLeaveRequest({
      ownerId: leaveRequest.employeeId,
      userId: req.user._id,
      finalStatus: leaveRequest.finalStatus,
    })) {
      return res.status(409).json({
        success: false,
        message: "Approved or cancelled leave requests cannot be deleted",
      });
    }

    const now = new Date();
    leaveRequest.isDeleted = true;
    leaveRequest.deletedAt = now;
    leaveRequest.deletedBy = req.user._id;
    await leaveRequest.save();
    await syncApprovedLeaveLedger(leaveRequest, req.user._id);

    const hrUsers = await User.find({ role: "HR", isActive: true }).select("_id");
    const recipientIds = getUniqueUserIds([
      leaveRequest.teamLeaderId,
      leaveRequest.managerId,
      ...hrUsers.map((hr) => hr._id),
    ]);
    await Promise.all(recipientIds.map((recipientId) => createNotification({
      recipientId,
      title: "Leave Request Deleted",
      message: `${req.user.name} deleted their ${leaveRequest.leaveType} leave request.`,
      link: "/dashboard",
    })));
    const emailRecipients = await User.find({
      _id: { $in: recipientIds },
      isActive: true,
      email: { $ne: "" },
    }).select("_id name email role isActive");
    await sendLeaveRequestNotification({
      recipients: emailRecipients,
      employee: req.user,
      leaveRequest,
      notificationTitle: "Leave Request Deleted",
      reviewUrl: "",
    });

    return res.status(200).json({ success: true, message: "Leave request deleted successfully" });
  } catch (error) {
    console.error("DELETE LEAVE REQUEST ERROR:", error);
    return res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid leave request ID" : "Unable to delete leave request",
    });
  }
};

export const getMyLeaveRequests = async (
  req,
  res
) => {
  try {
    const leaveRequests =
      await LeaveRequest.find({
        employeeId:
          req.user._id,
      })
        .populate(
          "teamLeaderId",
          "name email role"
        )
        .populate(
          "managerId",
          "name email role"
        )
        .populate(
          "lastEditedBy",
          "name email role"
        )
        .populate(
          "editHistory.editedBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      leaveRequests,
      retrospectivePolicy: (() => {
        const policy = getRetrospectivePolicy();
        return {
          maxPastDays: policy.maxPastDays,
          earliestAllowedDate: policy.earliestAllowedDateValue,
          today: policy.todayDate,
        };
      })(),
    });
  } catch (error) {
    console.error(
      "GET MY LEAVE REQUESTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve leave requests",
    });
  }
};
export const getPendingTLRequests = async (
  req,
  res
) => {
  try {
    if (
      req.user.role !==
      "TeamLeader"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Team Leaders can view these requests",
      });
    }

    const leaveRequests =
      await LeaveRequest.find({
        teamLeaderId:
          req.user._id,

        finalStatus: {
          $in: [
            "Pending Final Approval",
            "Pending Reapproval",
          ],
        },

        tlStatus:
          "Pending",
      })
        .populate(
          "employeeId",
          "name email employeeId designation role profilePhoto"
        )
        .populate(
          "subcategoryId",
          "name"
        )
        .populate(
          "teamId",
          "name"
        )
        .populate(
          "managerId",
          "name email role"
        )
        .populate(
          "lastEditedBy",
          "name email role"
        )
        .populate(
          "editHistory.editedBy",
          "name email role"
        )
        .sort({
          updatedAt: -1,
        });

    return res.status(200).json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    console.error(
      "GET PENDING TL REQUESTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve pending Team Leader requests",
    });
  }
};

export const getTLApprovalHistory = async (
  req,
  res
) => {
  try {
    if (
      req.user.role !==
      "TeamLeader"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Team Leaders can view history",
      });
    }

    const leaveRequests =
      await LeaveRequest.find({
        teamLeaderId:
          req.user._id,
      })
        .populate(
          "employeeId",
          "name email employeeId designation role profilePhoto"
        )
        .populate(
          "subcategoryId",
          "name"
        )
        .populate(
          "teamId",
          "name"
        )
        .populate(
          "managerApprovedBy",
          "name email role"
        )
        .populate(
          "hrApprovedBy",
          "name email role"
        )
        .populate(
          "tlApprovedBy",
          "name email role"
        )
        .populate(
          "lastEditedBy",
          "name email role"
        )
        .populate(
          "editHistory.editedBy",
          "name email role"
        )
        .sort({
          updatedAt: -1,
        });

    return res.status(200).json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    console.error(
      "GET TL APPROVAL HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve Team Leader approval history",
    });
  }
};

export const approveLeaveByTL = async (
  req,
  res
) => {
  try {
    if (
      req.user.role !==
      "TeamLeader"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Team Leaders can approve leave requests",
      });
    }

    const leaveRequest =
      await LeaveRequest.findById(
        req.params.id
      ).populate(
        "employeeId",
        "name email role"
      );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Leave request not found",
      });
    }

    if (leaveRequest.employeeId._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot approve your own leave request",
      });
    }

    if (
      !leaveRequest.teamLeaderId ||
      leaveRequest.teamLeaderId.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned as Team Leader for this leave request",
      });
    }

    if (
      leaveRequest.tlStatus !==
      "Pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This leave request has already been reviewed by the Team Leader",
      });
    }

    if (
      !PENDING_LEAVE_STATUSES.includes(
        leaveRequest.finalStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This leave request is not awaiting approval",
      });
    }

    leaveRequest.tlStatus =
      "Approved";

    leaveRequest.tlApprovedBy =
      req.user._id;

    leaveRequest.tlApprovedAt =
      new Date();

    leaveRequest.tlRejectionReason =
      "";

    leaveRequest.approvalHistory.push({
      level:
        "TeamLeader",

      action:
        "Approved",

      actedBy:
        req.user._id,

      remarks:
        leaveRequest.finalStatus ===
        "Pending Reapproval"
          ? "Edited leave request approved again by Team Leader"
          : "Approved by Team Leader",
    });

    await leaveRequest.save();

    await createNotification({
      recipientId:
        leaveRequest.employeeId._id,

      title:
        leaveRequest.finalStatus ===
        "Pending Reapproval"
          ? "Updated Leave Approved by Team Leader"
          : "Leave Approved by Team Leader",

      message:
        leaveRequest.finalStatus ===
        "Pending Reapproval"
          ? "Your updated leave request was approved by the Team Leader and is awaiting Manager or HR reapproval."
          : "Your leave was approved by the Team Leader and is awaiting Manager or HR approval.",

      link:
        "/dashboard",
    });

    const hrUsers =
      await User.find({
        role: "HR",
        isActive: true,
      }).select(
        "_id"
      );

    const finalApproverIds =
      getUniqueUserIds([
        leaveRequest.managerId,
        ...hrUsers.map(
          (hr) => hr._id
        ),
      ]);

    await Promise.all(
      finalApproverIds.map(
        (recipientId) =>
          createNotification({
            recipientId,

            title:
              leaveRequest.finalStatus ===
              "Pending Reapproval"
                ? "Updated Leave Pending Reapproval"
                : "Leave Pending Final Approval",

            message:
              `${leaveRequest.employeeId.name}'s leave request was approved by the Team Leader and requires your review.`,

            link:
              "/dashboard",
          })
      )
    );

    return res.status(200).json({
      success: true,

      message:
        leaveRequest.finalStatus ===
        "Pending Reapproval"
          ? "Updated leave approved by Team Leader"
          : "Leave approved by Team Leader",

      leaveRequest,
    });
  } catch (error) {
    console.error(
      "APPROVE LEAVE BY TL ERROR:",
      error
    );

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid leave request ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to approve leave request",
    });
  }
};

export const rejectLeaveByTL = async (
  req,
  res
) => {
  try {
    if (
      req.user.role !==
      "TeamLeader"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Team Leaders can reject leave requests",
      });
    }

    const {
      rejectionReason,
    } = req.body;

    if (
      !rejectionReason?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is required",
      });
    }

    const leaveRequest =
      await LeaveRequest.findById(
        req.params.id
      ).populate(
        "employeeId",
        "name email role"
      );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Leave request not found",
      });
    }

    if (
      !leaveRequest.teamLeaderId ||
      leaveRequest.teamLeaderId.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned as Team Leader for this leave request",
      });
    }

    if (
      leaveRequest.tlStatus !==
      "Pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This leave request has already been reviewed by the Team Leader",
      });
    }

    if (
      !PENDING_LEAVE_STATUSES.includes(
        leaveRequest.finalStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This leave request is not awaiting approval",
      });
    }

    const trimmedReason =
      rejectionReason.trim();

    leaveRequest.tlStatus =
      "Rejected";

    leaveRequest.tlRejectionReason =
      trimmedReason;

    /*
     * TL rejection remains advisory in your existing workflow.
     * Manager or HR can still make the final decision.
     */
    leaveRequest.approvalHistory.push({
      level:
        "TeamLeader",

      action:
        "Rejected",

      actedBy:
        req.user._id,

      remarks:
        trimmedReason,
    });

    await leaveRequest.save();

    await createNotification({
      recipientId:
        leaveRequest.employeeId._id,

      title:
        leaveRequest.finalStatus ===
        "Pending Reapproval"
          ? "Updated Leave Not Recommended by Team Leader"
          : "Leave Not Recommended by Team Leader",

      message:
        `Your leave request was not recommended by the Team Leader. Reason: ${trimmedReason}. Manager or HR will make the final decision.`,

      link:
        "/dashboard",
    });

    const hrUsers =
      await User.find({
        role: "HR",
        isActive: true,
      }).select(
        "_id"
      );

    const finalApproverIds =
      getUniqueUserIds([
        leaveRequest.managerId,
        ...hrUsers.map(
          (hr) => hr._id
        ),
      ]);

    await Promise.all(
      finalApproverIds.map(
        (recipientId) =>
          createNotification({
            recipientId,

            title:
              leaveRequest.finalStatus ===
              "Pending Reapproval"
                ? "Updated Leave Requires Final Review"
                : "Leave Requires Final Review",

            message:
              `${leaveRequest.employeeId.name}'s leave request was not recommended by the Team Leader. Final review is still required.`,

            link:
              "/dashboard",
          })
      )
    );

    return res.status(200).json({
      success: true,

      message:
        "Team Leader review recorded successfully",

      leaveRequest,
    });
  } catch (error) {
    console.error(
      "REJECT LEAVE BY TL ERROR:",
      error
    );

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid leave request ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to reject leave request",
    });
  }
};
export const getPendingManagerRequests = async (
  req,
  res
) => {
  try {
    if (
      !["Manager", "HR"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Manager or HR can view these requests",
      });
    }

    const pendingStatuses = [
      "Pending Final Approval",
      "Pending Reapproval",
    ];

    const filter =
      req.user.role === "HR"
        ? {
            finalStatus: {
              $in: pendingStatuses,
            },
          }
        : {
            managerId: req.user._id,

            finalStatus: {
              $in: pendingStatuses,
            },
          };

    const leaveRequests =
      await LeaveRequest.find(
        filter
      )
        .populate(
          "employeeId",
          "name email employeeId designation role profilePhoto"
        )
        .populate(
          "subcategoryId",
          "name"
        )
        .populate(
          "teamId",
          "name"
        )
        .populate(
          "teamLeaderId",
          "name email role"
        )
        .populate(
          "tlApprovedBy",
          "name email role"
        )
        .populate(
          "lastEditedBy",
          "name email role"
        )
        .populate(
          "editHistory.editedBy",
          "name email role"
        )
        .sort({
          updatedAt: -1,
        });

    return res.status(200).json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    console.error(
      "GET PENDING MANAGER REQUESTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve pending leave requests",
    });
  }
};

export const getManagerApprovalHistory = async (
  req,
  res
) => {
  try {
    if (
      !["Manager", "HR"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Manager or HR can view approval history",
      });
    }

    const completedStatuses = [
      "Approved by Manager",
      "Approved by HR",
      "Rejected by Manager",
      "Rejected by HR",
    ];

    const filter =
      req.user.role === "HR"
        ? {
            finalStatus: {
              $in: completedStatuses,
            },
          }
        : {
            managerId: req.user._id,

            finalStatus: {
              $in: completedStatuses,
            },
          };

    const leaveRequests =
      await LeaveRequest.find(
        filter
      )
        .populate(
          "employeeId",
          "name email employeeId designation role profilePhoto"
        )
        .populate(
          "subcategoryId",
          "name"
        )
        .populate(
          "teamId",
          "name"
        )
        .populate(
          "teamLeaderId",
          "name email role"
        )
        .populate(
          "managerApprovedBy",
          "name email role"
        )
        .populate(
          "hrApprovedBy",
          "name email role"
        )
        .populate(
          "lastEditedBy",
          "name email role"
        )
        .populate(
          "editHistory.editedBy",
          "name email role"
        )
        .sort({
          updatedAt: -1,
        });

    return res.status(200).json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    console.error(
      "GET MANAGER APPROVAL HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve approval history",
    });
  }
};

export const approveLeaveByManager = async (
  req,
  res
) => {
  try {
    if (
      !["Manager", "HR"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Manager or HR can approve leave",
      });
    }

    const leaveRequest =
      await LeaveRequest.findById(
        req.params.id
      ).populate(
        "employeeId",
        "name email employeeId role"
      );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Leave request not found",
      });
    }

    if (leaveRequest.employeeId._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot approve your own leave request",
      });
    }

    if (APPROVED_LEAVE_STATUSES.includes(leaveRequest.finalStatus)) {
      if (
        req.user.role === "Manager" &&
        leaveRequest.managerId?.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned as Manager for this leave request",
        });
      }

      await syncApprovedLeaveLedger(leaveRequest, req.user._id);
      return res.status(200).json({
        success: true,
        message: "Leave was already approved; balance is already up to date",
        leaveRequest,
      });
    }

    if (
      !PENDING_LEAVE_STATUSES.includes(
        leaveRequest.finalStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This leave request is not awaiting approval",
      });
    }

    if (
      req.user.role ===
        "Manager" &&
      leaveRequest.managerId?.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned as Manager for this leave request",
      });
    }

    const wasReapproval =
      leaveRequest.finalStatus ===
      "Pending Reapproval";

    if (
      req.user.role ===
      "Manager"
    ) {
      leaveRequest.managerStatus =
        "Approved";

      leaveRequest.managerApprovedBy =
        req.user._id;

      leaveRequest.managerApprovedAt =
        new Date();

      leaveRequest.managerRejectionReason =
        "";

      leaveRequest.finalStatus =
        "Approved by Manager";
    }

    if (
      req.user.role === "HR"
    ) {
      leaveRequest.hrStatus =
        "Approved";

      leaveRequest.hrApprovedBy =
        req.user._id;

      leaveRequest.hrApprovedAt =
        new Date();

      leaveRequest.hrRejectionReason =
        "";

      leaveRequest.finalStatus =
        "Approved by HR";
    }

    leaveRequest.rejectionReason =
      "";

    leaveRequest.requiresReapproval =
      false;

    leaveRequest.approvalHistory.push({
      level:
        req.user.role,

      action:
        "Approved",

      actedBy:
        req.user._id,

      remarks:
        wasReapproval
          ? `Reapproved by ${req.user.role}`
          : `Approved by ${req.user.role}`,
    });

    await leaveRequest.save();

    await syncApprovedLeaveLedger(leaveRequest, req.user._id);

    await createNotification({
      recipientId:
        leaveRequest.employeeId._id,

      title:
        wasReapproval
          ? "Updated Leave Reapproved"
          : "Leave Approved",

      message:
        wasReapproval
          ? `Your updated leave request was reapproved by ${req.user.role}.`
          : `Your leave request was approved by ${req.user.role}.`,

      link:
        "/dashboard",
    });

    if (
      leaveRequest.employeeId.email
    ) {
      sendDecisionEmail({
        to:
          leaveRequest.employeeId.email,

        subject:
          wasReapproval
            ? "Updated Leave Request Reapproved"
            : "Leave Request Approved",

        title:
          wasReapproval
            ? "Updated Leave Request Reapproved"
            : "Leave Request Approved",

        employeeName:
          leaveRequest.employeeId.name,

        requestType:
          "Leave",

        status:
          "Approved",

        leaveType:
          leaveRequest.leaveType,

        startDate:
          leaveRequest.startDate,

        endDate:
          leaveRequest.endDate,

        approverName:
          req.user.name,

        approverRole:
          req.user.role,
      }).catch(
        (emailError) => {
          console.log(
            "Leave approval email failed:",
            emailError.message
          );
        }
      );
    }

    const financeUsers =
      await User.find({
        role: "Finance",
        isActive: true,
      }).select(
        "_id email"
      );

    await Promise.all(
      financeUsers.map(
        (financeUser) =>
          createNotification({
            recipientId:
              financeUser._id,

            title:
              wasReapproval
                ? "Reapproved Leave Details"
                : "Approved Leave Details",

            message:
              `${leaveRequest.employeeId.name} has an approved ${leaveRequest.leaveType} leave request.`,

            link:
              "/dashboard",
          })
      )
    );

    Promise.all(
      financeUsers
        .filter(
          (financeUser) =>
            financeUser.email
        )
        .map(
          (financeUser) =>
            sendFinanceLeaveEmail({
              to:
                financeUser.email,

              employeeName:
                leaveRequest
                  .employeeId.name,

              leaveType:
                leaveRequest.leaveType,

              startDate:
                leaveRequest.startDate,

              endDate:
                leaveRequest.endDate,

              workingDays:
                leaveRequest.workingDays,

              status:
                leaveRequest.finalStatus,
            })
        )
    ).catch((emailError) => {
      console.log(
        "Finance leave email failed:",
        emailError.message
      );
    });

    const updatedLeaveRequest =
      await LeaveRequest.findById(
        leaveRequest._id
      )
        .populate(
          "employeeId",
          "name email employeeId designation role profilePhoto"
        )
        .populate(
          "subcategoryId",
          "name"
        )
        .populate(
          "teamId",
          "name"
        )
        .populate(
          "teamLeaderId",
          "name email role"
        )
        .populate(
          "managerApprovedBy",
          "name email role"
        )
        .populate(
          "hrApprovedBy",
          "name email role"
        )
        .populate(
          "lastEditedBy",
          "name email role"
        );

    return res.status(200).json({
      success: true,

      message:
        wasReapproval
          ? "Leave reapproved successfully"
          : "Leave approved successfully",

      leaveRequest:
        updatedLeaveRequest,
    });
  } catch (error) {
    console.error(
      "APPROVE LEAVE BY MANAGER OR HR ERROR:",
      error
    );

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid leave request ID",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          Object.values(
            error.errors
          )
            .map(
              (item) =>
                item.message
            )
            .join(", ") ||
          "Leave request validation failed",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to approve leave request",
    });
  }
};

export const rejectLeaveByManager = async (
  req,
  res
) => {
  try {
    if (
      !["Manager", "HR"].includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Manager or HR can reject leave",
      });
    }

    const {
      rejectionReason,
    } = req.body;

    if (
      !rejectionReason?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is required",
      });
    }

    const leaveRequest =
      await LeaveRequest.findById(
        req.params.id
      ).populate(
        "employeeId",
        "name email employeeId role"
      );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Leave request not found",
      });
    }

    if (leaveRequest.employeeId._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot reject your own leave request",
      });
    }

    if (
      !PENDING_LEAVE_STATUSES.includes(
        leaveRequest.finalStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This leave request is not awaiting approval",
      });
    }

    if (
      req.user.role ===
        "Manager" &&
      leaveRequest.managerId?.toString() !==
        req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not assigned as Manager for this leave request",
      });
    }

    const wasReapproval =
      leaveRequest.finalStatus ===
      "Pending Reapproval";

    const trimmedReason =
      rejectionReason.trim();

    if (
      req.user.role ===
      "Manager"
    ) {
      leaveRequest.managerStatus =
        "Rejected";

      leaveRequest.managerRejectionReason =
        trimmedReason;

      leaveRequest.finalStatus =
        "Rejected by Manager";
    }

    if (
      req.user.role === "HR"
    ) {
      leaveRequest.hrStatus =
        "Rejected";

      leaveRequest.hrRejectionReason =
        trimmedReason;

      leaveRequest.finalStatus =
        "Rejected by HR";
    }

    leaveRequest.rejectionReason =
      trimmedReason;

    leaveRequest.requiresReapproval =
      false;

    leaveRequest.approvalHistory.push({
      level:
        req.user.role,

      action:
        "Rejected",

      actedBy:
        req.user._id,

      remarks:
        wasReapproval
          ? `Updated leave rejected by ${req.user.role}: ${trimmedReason}`
          : trimmedReason,
    });

    await leaveRequest.save();

    await syncApprovedLeaveLedger(leaveRequest, req.user._id);

    await createNotification({
      recipientId:
        leaveRequest.employeeId._id,

      title:
        wasReapproval
          ? "Updated Leave Rejected"
          : "Leave Rejected",

      message:
        wasReapproval
          ? `Your updated leave request was rejected by ${req.user.role}. Reason: ${trimmedReason}`
          : `Your leave request was rejected by ${req.user.role}. Reason: ${trimmedReason}`,

      link:
        "/dashboard",
    });

    if (
      leaveRequest.employeeId.email
    ) {
      sendDecisionEmail({
        to:
          leaveRequest.employeeId.email,

        subject:
          wasReapproval
            ? "Updated Leave Request Rejected"
            : "Leave Request Rejected",

        title:
          wasReapproval
            ? "Updated Leave Request Rejected"
            : "Leave Request Rejected",

        employeeName:
          leaveRequest.employeeId.name,

        requestType:
          "Leave",

        status:
          "Rejected",

        rejectionReason:
          trimmedReason,

        leaveType:
          leaveRequest.leaveType,

        startDate:
          leaveRequest.startDate,

        endDate:
          leaveRequest.endDate,

        approverName:
          req.user.name,

        approverRole:
          req.user.role,
      }).catch(
        (emailError) => {
          console.log(
            "Leave rejection email failed:",
            emailError.message
          );
        }
      );
    }

    const updatedLeaveRequest =
      await LeaveRequest.findById(
        leaveRequest._id
      )
        .populate(
          "employeeId",
          "name email employeeId designation role profilePhoto"
        )
        .populate(
          "subcategoryId",
          "name"
        )
        .populate(
          "teamId",
          "name"
        )
        .populate(
          "teamLeaderId",
          "name email role"
        )
        .populate(
          "managerApprovedBy",
          "name email role"
        )
        .populate(
          "hrApprovedBy",
          "name email role"
        )
        .populate(
          "lastEditedBy",
          "name email role"
        );

    return res.status(200).json({
      success: true,

      message:
        wasReapproval
          ? "Updated leave rejected successfully"
          : "Leave rejected successfully",

      leaveRequest:
        updatedLeaveRequest,
    });
  } catch (error) {
    console.error(
      "REJECT LEAVE BY MANAGER OR HR ERROR:",
      error
    );

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid leave request ID",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,

        message:
          Object.values(
            error.errors
          )
            .map(
              (item) =>
                item.message
            )
            .join(", ") ||
          "Leave request validation failed",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to reject leave request",
    });
  }
};
export const changeLeaveStatus = async (req, res) => {
  try {
    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can change leave status",
      });
    }

    const { status, remarks } = req.body;

    if (!status || !remarks?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Status and remarks are required",
      });
    }

    const commonStatuses = [
      "Pending Final Approval",
      "On Hold",
    ];

    const roleStatuses =
      req.user.role === "Manager"
        ? ["Approved by Manager", "Rejected by Manager"]
        : ["Approved by HR", "Rejected by HR"];

    const allowedStatuses = [
      ...commonStatuses,
      ...roleStatuses,
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate("employeeId", "name email");

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (leaveRequest.employeeId._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot change the status of your own leave request",
      });
    }

    if (
      req.user.role === "Manager" &&
      leaveRequest.managerId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this leave request",
      });
    }

    const previousStatus = leaveRequest.finalStatus;

    leaveRequest.finalStatus = status;

    leaveRequest.lastStatusChangedBy = req.user._id;
    leaveRequest.lastStatusChangedAt = new Date();

    leaveRequest.statusHistory.push({
      previousStatus,
      newStatus: status,
      changedBy: req.user._id,
      remarks: remarks.trim(),
    });

    leaveRequest.approvalHistory.push({
      level: req.user.role,
      action: "Status Changed",
      actedBy: req.user._id,
      remarks: `${previousStatus} → ${status} | ${remarks}`,
    });

    if (status === "Pending Final Approval") {
      leaveRequest.managerStatus = "Pending";
      leaveRequest.hrStatus = "Pending";
      leaveRequest.requiresReapproval = false;
    }

    if (status === "On Hold") {
      leaveRequest.requiresReapproval = false;
    }

    if (
      status === "Approved by Manager" ||
      status === "Approved by HR"
    ) {
      leaveRequest.requiresReapproval = false;
    }

    if (
      status === "Rejected by Manager" ||
      status === "Rejected by HR"
    ) {
      leaveRequest.rejectionReason = remarks.trim();
      leaveRequest.requiresReapproval = false;
    }

    await leaveRequest.save();

    await syncApprovedLeaveLedger(leaveRequest, req.user._id);

    await createNotification({
      recipientId: leaveRequest.employeeId._id,
      title: "Leave Status Updated",
      message: `Your leave status has been changed to "${status}".`,
      link: "/dashboard",
    });

    const isApprovedStatus =
      status === "Approved by Manager" ||
      status === "Approved by HR";

    const isRejectedStatus =
      status === "Rejected by Manager" ||
      status === "Rejected by HR";

    if (
      leaveRequest.employeeId.email &&
      previousStatus !== status &&
      (isApprovedStatus || isRejectedStatus)
    ) {
      const decisionStatus =
        isApprovedStatus
          ? "Approved"
          : "Rejected";

      sendDecisionEmail({
        to: leaveRequest.employeeId.email,
        subject: `Leave Request ${decisionStatus}`,
        title: `Leave Request ${decisionStatus}`,
        employeeName: leaveRequest.employeeId.name,
        requestType: "Leave",
        status: decisionStatus,
        rejectionReason: isRejectedStatus
          ? remarks.trim()
          : "",
        leaveType: leaveRequest.leaveType,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        approverName: req.user.name,
        approverRole: req.user.role,
      }).catch((emailError) => {
        console.log(
          "Leave status decision email failed:",
          emailError.message
        );
      });
    }

    return res.status(200).json({
      success: true,
      message: "Leave status updated successfully.",
      leaveRequest,
    });

  } catch (error) {
    console.error("CHANGE LEAVE STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getFinanceLeaves = async (
  req,
  res
) => {
  try {
    if (
      req.user.role !== "Finance"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Finance can view approved leave details",
      });
    }

    const leaveRequests =
      await LeaveRequest.find({
        finalStatus: {
          $in: [
            "Approved by Manager",
            "Approved by HR",
          ],
        },
      })
        .populate(
          "employeeId",
          "name email employeeId designation role profilePhoto"
        )
        .populate(
          "subcategoryId",
          "name"
        )
        .populate(
          "teamId",
          "name"
        )
        .populate(
          "managerApprovedBy",
          "name email role"
        )
        .populate(
          "hrApprovedBy",
          "name email role"
        )
        .populate(
          "lastEditedBy",
          "name email role"
        )
        .sort({
          updatedAt: -1,
        });

    return res.status(200).json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    console.error(
      "GET FINANCE LEAVES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve approved leave details",
    });
  }
};

export const getApprovedLeaveCalendar = async (
  req,
  res
) => {
  try {
    if (
      ![
        "Manager",
        "HR",
        "Finance",
        "Admin",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied",
      });
    }

    const leaveRequests =
      await LeaveRequest.find({
        finalStatus: {
          $in: [
            "Approved by Manager",
            "Approved by HR",
          ],
        },
      })
        .populate(
          "employeeId",
          "name email employeeId designation role profilePhoto"
        )
        .populate(
          "subcategoryId",
          "name"
        )
        .populate(
          "teamId",
          "name"
        )
        .sort({
          startDate: 1,
        });

    const calendarEvents =
      leaveRequests.map(
        (leave) => ({
          id:
            leave._id,

          title:
            `${leave.employeeId?.name || "Employee"} | ${leave.leaveType}`,

          start:
            leave.startDate,

          end:
            leave.endDate,

          status:
            leave.finalStatus,

          leaveType:
            leave.leaveType,

          employeeName:
            leave.employeeId?.name,

          employeeEmail:
            leave.employeeId?.email,

          employeeId:
            leave.employeeId
              ?.employeeId,

          designation:
            leave.employeeId
              ?.designation,

          role:
            leave.employeeId?.role,

          profilePhoto:
            leave.employeeId
              ?.profilePhoto,

          department:
            leave.subcategoryId?.name,

          team:
            leave.teamId?.name,

          workingDays:
            leave.workingDays,

          reason:
            leave.reason,
        })
      );

    return res.status(200).json({
      success: true,
      calendarEvents,
    });
  } catch (error) {
    console.error(
      "GET APPROVED LEAVE CALENDAR ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve leave calendar",
    });
  }
};

export const getTodayLeaves = async (
  req,
  res
) => {
  try {
    if (
      ![
        "Manager",
        "HR",
        "Finance",
        "Admin",
        "TeamLeader",
      ].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied",
      });
    }

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const endOfDay =
      new Date(today);

    endOfDay.setHours(
      23,
      59,
      59,
      999
    );

    const filter = {
      finalStatus: {
        $in: [
          "Approved by Manager",
          "Approved by HR",
        ],
      },

      startDate: {
        $lte: endOfDay,
      },

      endDate: {
        $gte: today,
      },
    };

    if (
      req.user.role ===
      "TeamLeader"
    ) {
      filter.teamLeaderId =
        req.user._id;
    }

    const leaveRequests =
      await LeaveRequest.find(
        filter
      )
        .populate(
          "employeeId",
          "name email employeeId designation role profilePhoto"
        )
        .populate(
          "subcategoryId",
          "name"
        )
        .populate(
          "teamId",
          "name"
        )
        .sort({
          startDate: 1,
        });

    return res.status(200).json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    console.error(
      "GET TODAY LEAVES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve today leave details",
    });
  }
};
export const getAllManagerLeaveRequests = async (req, res) => {
  try {
    if (!["TeamLeader", "Manager", "HR", "Admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view final leave approvals",
      });
    }

    const filter = getLeaveApprovalVisibilityFilter(req.user);

    const leaveRequests = await LeaveRequest.find(filter)
      .populate(
        "employeeId",
        "name email employeeId designation role profilePhoto"
      )
      .populate("subcategoryId", "name")
      .populate("teamId", "name")
      .populate("teamLeaderId", "name email role")
      .populate("managerApprovedBy", "name email role")
      .populate("hrApprovedBy", "name email role")
      .populate("lastEditedBy", "name email role")
      .populate("editHistory.editedBy", "name email role")
      .populate("lastStatusChangedBy", "name email role")
      .populate("statusHistory.changedBy", "name email role")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    console.error("GET ALL MANAGER LEAVES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve leave requests",
    });
  }
};

export const exportFinalLeaveApprovals = async (req, res) => {
  try {
    const range = getLeaveApprovalExportRange(req.query);
    const visibilityFilter = getLeaveApprovalVisibilityFilter(req.user);
    const statusFilter = getLeaveApprovalStatusFilter(req.query.statusFilter);
    const search = String(req.query.search || "").trim();

    if (search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search text cannot exceed 100 characters",
      });
    }

    const leaveRequests = await LeaveRequest.find({
      ...visibilityFilter,
      ...statusFilter,
      startDate: { $lte: range.endDate },
      endDate: { $gte: range.startDate },
    })
      .populate("employeeId", "name email employeeId designation role")
      .populate("subcategoryId", "name")
      .populate("teamId", "name")
      .populate("teamLeaderId", "name email role")
      .populate("managerApprovedBy", "name email role")
      .populate("hrApprovedBy", "name email role")
      .sort({ startDate: 1, updatedAt: -1 })
      .lean();

    const matchingRequests = leaveRequests.filter((request) =>
      leaveRequestMatchesSearch(request, search)
    );

    return res.status(200).json({
      success: true,
      filter: {
        filterType: range.filterType,
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      },
      leaveRequests: matchingRequests,
    });
  } catch (error) {
    if (error instanceof RangeError) {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error("EXPORT FINAL LEAVE APPROVALS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to export final leave approvals",
    });
  }
};
