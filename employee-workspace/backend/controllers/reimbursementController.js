import ReimbursementRequest from "../models/ReimbursementRequest.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import Team from "../models/Team.js";
import {
  sendDecisionEmail,
  sendFinanceReimbursementEmail,
  sendReimbursementRequestEmail,
} from "../services/emailService.js";
import {
  canDeleteOwnReimbursement,
  canEditOwnReimbursement,
  validateReimbursementInput,
} from "../services/reimbursementRequestPolicy.js";

const reimbursementSnapshot = (request) => ({
  expenseFrom: request.expenseFrom,
  expenseTo: request.expenseTo,
  businessPurpose: request.businessPurpose,
  items: request.items?.map((item) => ({
    description: item.description,
    category: item.category,
    cost: item.cost,
  })) || [],
  subtotal: request.subtotal,
  lessCashAdvance: request.lessCashAdvance,
  totalReimbursement: request.totalReimbursement,
  receiptFiles: [...(request.receiptFiles || [])],
});

const notifyReimbursementApprovers = async ({ request, employee, title, message }) => {
  const hrUsers = await User.find({ role: "HR", isActive: true }).select("_id name email role isActive");
  const approverIds = [request.teamLeaderId, request.managerId, ...hrUsers.map((hr) => hr._id)]
    .filter(Boolean)
    .map((id) => id.toString());
  const approvers = await User.find({ _id: { $in: [...new Set(approverIds)] }, isActive: true })
    .select("_id name email role isActive");

  await Promise.all(approvers.map((approver) => createNotification({
    recipientId: approver._id,
    type: "Reimbursement",
    title,
    message,
    link: "/dashboard",
  })));

  const emailResults = await Promise.allSettled(approvers.filter((approver) => approver.email).map((approver) =>
    sendReimbursementRequestEmail({
      to: approver.email,
      employeeName: employee.name,
      businessPurpose: request.businessPurpose,
      totalReimbursement: request.totalReimbursement,
      expenseFrom: request.expenseFrom,
      expenseTo: request.expenseTo,
      notificationTitle: title,
    })
  ));
  const failed = emailResults.filter((result) => result.status === "rejected");
  if (failed.length) {
    console.error("[email] Reimbursement approver notification incomplete", {
      reimbursementRequestId: request._id.toString(),
      attempted: emailResults.length,
      failed: failed.length,
      messages: failed.map((result) => result.reason?.message),
    });
  }
};

export const createReimbursementRequest = async (req, res) => {
  try {
    if (!["Employee", "TeamLeader"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Only Employees and Team Leaders can submit reimbursement requests",
      });
    }

    const {
      expenseFrom,
      expenseTo,
      businessPurpose,
      items,
      lessCashAdvance,
    } = req.body;
    const uploadedReceiptFiles = req.files?.map((file) => file.path) || [];
    const validation = validateReimbursementInput(
      { expenseFrom, expenseTo, businessPurpose, items, lessCashAdvance },
      { newReceiptCount: uploadedReceiptFiles.length }
    );
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }
    const {
      expenseFrom: parsedExpenseFrom,
      expenseTo: parsedExpenseTo,
      businessPurpose: normalizedBusinessPurpose,
      items: normalizedItems,
      subtotal: calculatedSubtotal,
      lessCashAdvance: normalizedCashAdvance,
      totalReimbursement: calculatedTotal,
    } = validation.value;

    const employee = await User.findById(req.user._id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const team = employee.teamId
      ? await Team.findById(employee.teamId)
        .populate("teamLeaderId", "name email role isActive")
        .populate("managerIds", "name email role isActive")
        .populate("hrIds", "name email role")
      : null;

    if (!team) {
      return res.status(400).json({
        success: false,
        message: "User is not assigned to any team",
      });
    }

    const assignedTeamLeader =
      req.user.role === "TeamLeader" ? null : team.teamLeaderId;

    const assignedManager =
      team.managerIds?.find((manager) => manager.isActive !== false) || null;

    if (req.user.role !== "TeamLeader" && !assignedTeamLeader) {
      return res.status(400).json({
        success: false,
        message: "No Team Leader assigned for this team",
      });
    }

    if (!assignedManager) {
      return res.status(400).json({
        success: false,
        message: "No Manager assigned for this team",
      });
    }

    const reimbursementRequest = await ReimbursementRequest.create({
      employeeId: req.user._id,
      teamLeaderId:
        req.user.role === "TeamLeader"
          ? null
          : assignedTeamLeader?._id,

      managerId: assignedManager?._id || null,

      tlStatus:
        req.user.role === "TeamLeader"
          ? "Approved"
          : "Pending",

      managerStatus: "Pending",
      hrStatus: "Pending",

      expenseFrom: parsedExpenseFrom,
      expenseTo: parsedExpenseTo,
      businessPurpose: normalizedBusinessPurpose,
      items: normalizedItems,
      subtotal: calculatedSubtotal,
      lessCashAdvance: normalizedCashAdvance,
      totalReimbursement: calculatedTotal,
      receiptFiles: uploadedReceiptFiles,

      financeStatus: "Not Routed",
      finalStatus: "Pending Final Approval",

      approvalHistory: [
        {
          level: "TeamLeader",
          action: "Submitted",
          actedBy: req.user._id,
          remarks: "Reimbursement request submitted",
        },
      ],
    });

    const hrUsers = await User.find({
      role: "HR",
      isActive: true,
    });

    const notifyUsers = [
      assignedTeamLeader,
      assignedManager,
      ...hrUsers,
    ]
      .filter((user) => user && user.isActive !== false)
      .filter(
        (user, index, users) =>
          users.findIndex(
            (candidate) => candidate._id.toString() === user._id.toString()
          ) === index
      );

    await Promise.all(
      notifyUsers.map((user) =>
        createNotification({
          recipientId: user._id,
          type: "Reimbursement",
          title: "New Reimbursement Request",
          message: `${req.user.name} submitted a reimbursement request.`,
          link: "/dashboard",
        })
      )
    );

    Promise.all(
      notifyUsers.filter((user) => user.email).map((user) =>
        sendReimbursementRequestEmail({
          to: user.email,
          employeeName: req.user.name,
          businessPurpose,
          totalReimbursement: calculatedTotal,
          expenseFrom: parsedExpenseFrom,
          expenseTo: parsedExpenseTo,
        })
      )
    ).catch((emailError) =>
      console.log("Reimbursement request email failed:", emailError.message)
    );

    res.status(201).json({
      success: true,
      reimbursementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyReimbursementRequests = async (req, res) => {

  try {
    const reimbursementRequests = await ReimbursementRequest.find({
      employeeId: req.user._id,
    })
      .populate("teamLeaderId", "name email role")
      .populate("managerId", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reimbursementRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMyReimbursementRequest = async (req, res) => {
  try {
    const request = await ReimbursementRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Reimbursement request not found" });
    if (request.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can edit only your own reimbursement request" });
    }
    if (!canEditOwnReimbursement(request, req.user._id)) {
      return res.status(409).json({ success: false, message: "Only pending reimbursement requests can be edited" });
    }

    const newReceiptFiles = req.files?.map((file) => file.path) || [];
    const validation = validateReimbursementInput(req.body, {
      existingReceiptCount: newReceiptFiles.length ? 0 : request.receiptFiles.length,
      newReceiptCount: newReceiptFiles.length,
    });
    if (!validation.valid) return res.status(400).json({ success: false, message: validation.message });

    const previousValues = reimbursementSnapshot(request);
    const next = validation.value;
    const updatedReceiptFiles = newReceiptFiles.length ? newReceiptFiles : request.receiptFiles;
    const updatedValues = { ...next, receiptFiles: [...updatedReceiptFiles] };
    const changedFields = Object.keys(updatedValues).filter((field) =>
      JSON.stringify(previousValues[field]) !== JSON.stringify(updatedValues[field])
    );
    if (!changedFields.length) {
      return res.status(400).json({ success: false, message: "No reimbursement details were changed" });
    }

    Object.assign(request, next, { receiptFiles: updatedReceiptFiles });
    request.tlStatus = req.user.role === "TeamLeader" ? "Approved" : "Pending";
    request.tlApprovedBy = null;
    request.tlApprovedAt = null;
    request.tlRejectionReason = "";
    request.managerStatus = "Pending";
    request.managerApprovedBy = null;
    request.managerApprovedAt = null;
    request.managerRejectionReason = "";
    request.hrStatus = "Pending";
    request.hrApprovedBy = null;
    request.hrApprovedAt = null;
    request.hrRejectionReason = "";
    request.financeStatus = "Not Routed";
    request.finalStatus = "Pending Final Approval";
    request.rejectionReason = "";
    request.lastEditedBy = req.user._id;
    request.lastEditedAt = new Date();
    request.editHistory.push({
      editedBy: req.user._id,
      editedAt: request.lastEditedAt,
      changedFields,
      previousValues,
      updatedValues,
    });
    request.approvalHistory.push({
      level: req.user.role === "TeamLeader" ? "TeamLeader" : "Employee",
      action: "Edited",
      actedBy: req.user._id,
      remarks: `Updated fields: ${changedFields.join(", ")}`,
    });
    await request.save();

    await notifyReimbursementApprovers({
      request,
      employee: req.user,
      title: "Reimbursement Request Updated",
      message: `${req.user.name} updated their reimbursement request.`,
    }).catch((notificationError) => console.error(
      "REIMBURSEMENT UPDATE NOTIFICATION ERROR:",
      notificationError
    ));
    return res.status(200).json({ success: true, message: "Reimbursement request updated successfully", reimbursementRequest: request });
  } catch (error) {
    console.error("UPDATE REIMBURSEMENT ERROR:", error);
    return res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid reimbursement request ID" : error.message || "Unable to update reimbursement request",
    });
  }
};

export const deleteMyReimbursementRequest = async (req, res) => {
  try {
    const request = await ReimbursementRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Reimbursement request not found" });
    if (request.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can delete only your own reimbursement request" });
    }
    if (!canDeleteOwnReimbursement(request, req.user._id)) {
      return res.status(409).json({ success: false, message: "Approved or paid reimbursement requests cannot be deleted" });
    }

    request.isDeleted = true;
    request.deletedAt = new Date();
    request.deletedBy = req.user._id;
    await request.save();
    await notifyReimbursementApprovers({
      request,
      employee: req.user,
      title: "Reimbursement Request Deleted",
      message: `${req.user.name} deleted their reimbursement request.`,
    }).catch((notificationError) => console.error(
      "REIMBURSEMENT DELETE NOTIFICATION ERROR:",
      notificationError
    ));
    return res.status(200).json({ success: true, message: "Reimbursement request deleted successfully" });
  } catch (error) {
    console.error("DELETE REIMBURSEMENT ERROR:", error);
    return res.status(error.name === "CastError" ? 400 : 500).json({
      success: false,
      message: error.name === "CastError" ? "Invalid reimbursement request ID" : "Unable to delete reimbursement request",
    });
  }
};
export const getTLReimbursementHistory = async (req, res) => {
  try {
    if (req.user.role !== "TeamLeader") {
      return res.status(403).json({
        success: false,
        message:
          "Only Team Leaders can view reimbursement history",
      });
    }

    const reimbursementRequests =
      await ReimbursementRequest.find({
        teamLeaderId: req.user._id,
      })
        .populate(
          "employeeId",
          "name email employeeId designation"
        )
        .populate("managerId", "name email role")
        .populate("tlApprovedBy", "name")
        .populate("managerApprovedBy", "name")
        .populate("hrApprovedBy", "name")
        .populate("financeApprovedBy", "name")
        .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      reimbursementRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPendingTLReimbursements = async (req, res) => {
  try {
    if (req.user.role !== "TeamLeader") {
      return res.status(403).json({
        success: false,
        message: "Only Team Leaders can view these reimbursements",
      });
    }

    const reimbursementRequests = await ReimbursementRequest.find({
      teamLeaderId: req.user._id,
      finalStatus: "Pending Final Approval",
      tlStatus: "Pending",
    })
      .populate("employeeId", "name email employeeId designation")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reimbursementRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveReimbursementByTL = async (req, res) => {
  try {
    const reimbursementRequest = await ReimbursementRequest.findById(
      req.params.id
    ).populate("employeeId", "name email");

    if (!reimbursementRequest) {
      return res.status(404).json({
        success: false,
        message: "Reimbursement request not found",
      });
    }

    if (
      reimbursementRequest.teamLeaderId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned as TL for this request",
      });
    }

    if (
      reimbursementRequest.tlStatus !== "Pending" ||
      reimbursementRequest.finalStatus !== "Pending Final Approval"
    ) {
      return res.status(400).json({
        success: false,
        message: "This reimbursement has already been reviewed",
      });
    }

    reimbursementRequest.tlStatus = "Approved";
    reimbursementRequest.tlApprovedBy = req.user._id;
    reimbursementRequest.tlApprovedAt = new Date();

    reimbursementRequest.approvalHistory.push({
      level: "TeamLeader",
      action: "Approved",
      actedBy: req.user._id,
      remarks: "Approved by Team Leader",
    });

    await reimbursementRequest.save();

    await createNotification({
      recipientId: reimbursementRequest.employeeId._id,
      type: "Reimbursement",
      title: "Reimbursement Reviewed by TL",
      message:
        "Your reimbursement request was approved by Team Leader and is pending final approval.",
      link: "/dashboard",
    });

    res.status(200).json({
      success: true,
      message: "Reimbursement approved by Team Leader",
      reimbursementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectReimbursementByTL = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const reimbursementRequest = await ReimbursementRequest.findById(
      req.params.id
    ).populate("employeeId", "name email");

    if (!reimbursementRequest) {
      return res.status(404).json({
        success: false,
        message: "Reimbursement request not found",
      });
    }

    if (
      reimbursementRequest.teamLeaderId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned as TL for this request",
      });
    }

    if (
      reimbursementRequest.tlStatus !== "Pending" ||
      reimbursementRequest.finalStatus !== "Pending Final Approval"
    ) {
      return res.status(400).json({
        success: false,
        message: "This reimbursement has already been reviewed",
      });
    }

    reimbursementRequest.tlStatus = "Rejected";
    reimbursementRequest.tlRejectionReason = rejectionReason.trim();

    reimbursementRequest.approvalHistory.push({
      level: "TeamLeader",
      action: "Rejected",
      actedBy: req.user._id,
      remarks: rejectionReason.trim(),
    });

    await reimbursementRequest.save();

    await createNotification({
      recipientId: reimbursementRequest.employeeId._id,
      type: "Reimbursement",
      title: "Reimbursement Reviewed by TL",
      message: `Your reimbursement request was not recommended by the Team Leader. Reason: ${rejectionReason}. Manager or HR will make the final decision.`,
      link: "/dashboard",
    });

    res.status(200).json({
      success: true,
      message: "Team Leader review recorded successfully",
      reimbursementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPendingManagerReimbursements = async (req, res) => {
  try {
    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can view reimbursements",
      });
    }

    const filter =
      req.user.role === "HR"
        ? {
          finalStatus: "Pending Final Approval",
        }
        : {
          finalStatus: "Pending Final Approval",
          managerId: req.user._id,
        };

    const reimbursementRequests =
      await ReimbursementRequest.find(filter)
        .populate(
          "employeeId",
          "name email employeeId designation"
        )
        .populate("teamLeaderId", "name email role")
        .populate("managerId", "name email role")
        .populate("tlApprovedBy", "name")
        .populate("managerApprovedBy", "name")
        .populate("hrApprovedBy", "name")
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reimbursementRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getManagerReimbursementHistory = async (req, res) => {
  try {
    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can view reimbursement history",
      });
    }

    const filter =
      req.user.role === "HR"
        ? {
          finalStatus: {
            $in: [
              "Approved by Manager",
              "Approved by HR",
              "Rejected by Manager",
              "Rejected by HR",
              "Pending Finance Payment",
              "Paid by Finance",
            ],
          },
        }
        : {
          managerId: req.user._id,
          finalStatus: {
            $in: [
              "Approved by Manager",
              "Approved by HR",
              "Rejected by Manager",
              "Rejected by HR",
              "Pending Finance Payment",
              "Paid by Finance",
            ],
          },
        };

    const reimbursementRequests = await ReimbursementRequest.find(filter)
      .populate("employeeId", "name email employeeId designation")
      .populate("teamLeaderId", "name email role")
      .populate("tlApprovedBy", "name")
      .populate("managerApprovedBy", "name")
      .populate("hrApprovedBy", "name")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      reimbursementRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const approveReimbursementByManager = async (req, res) => {
  try {
    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can approve reimbursement",
      });
    }

    const reimbursementRequest = await ReimbursementRequest.findById(
      req.params.id
    ).populate("employeeId", "name email");

    if (!reimbursementRequest) {
      return res.status(404).json({
        success: false,
        message: "Reimbursement request not found",
      });
    }

    if (
      req.user.role === "Manager" &&
      reimbursementRequest.managerId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned as manager for this request",
      });
    }

    if (reimbursementRequest.finalStatus !== "Pending Final Approval") {
      return res.status(400).json({
        success: false,
        message: "This reimbursement is not awaiting final approval",
      });
    }

    if (req.user.role === "Manager") {
      reimbursementRequest.managerStatus = "Approved";
      reimbursementRequest.managerApprovedBy = req.user._id;
      reimbursementRequest.managerApprovedAt = new Date();
      reimbursementRequest.finalStatus = "Approved by Manager";
    }

    if (req.user.role === "HR") {
      reimbursementRequest.hrStatus = "Approved";
      reimbursementRequest.hrApprovedBy = req.user._id;
      reimbursementRequest.hrApprovedAt = new Date();
      reimbursementRequest.finalStatus = "Approved by HR";
    }

    reimbursementRequest.financeStatus = "Pending Payment";
    reimbursementRequest.rejectionReason = "";

    reimbursementRequest.approvalHistory.push({
      level: req.user.role === "HR" ? "HR" : "Manager",
      action: "Approved",
      actedBy: req.user._id,
      remarks: `Approved by ${req.user.role}`,
    });

    await reimbursementRequest.save();

    await createNotification({
      recipientId: reimbursementRequest.employeeId._id,
      type: "Reimbursement",
      title: "Reimbursement Approved",
      message:
        "Your reimbursement request has been finally approved and is pending finance payment.",
      link: "/dashboard",
    });

    if (reimbursementRequest.employeeId.email) {
      sendDecisionEmail({
        to: reimbursementRequest.employeeId.email,
        subject: "Reimbursement Request Approved",
        title: "Reimbursement Request Approved",
        employeeName: reimbursementRequest.employeeId.name,
        requestType: "Reimbursement",
        status: "Approved",
      }).catch((emailError) =>
        console.log(
          "Reimbursement approval email failed:",
          emailError.message
        )
      );
    }
    if (reimbursementRequest.teamLeaderId) {
      await createNotification({
        recipientId: reimbursementRequest.teamLeaderId,
        type: "Reimbursement",
        title: "Reimbursement Final Decision",
        message: `${reimbursementRequest.employeeId.name}'s reimbursement was approved by ${req.user.role}.`,
        link: "/dashboard",
      });
    }

    const financeUsers = await User.find({
      role: "Finance",
      isActive: true,
    });

    await Promise.all(
      financeUsers.map((finance) =>
        createNotification({
          recipientId: finance._id,
          type: "Reimbursement",
          title: "Reimbursement Ready for Payment",
          message: `${reimbursementRequest.employeeId.name}'s reimbursement is ready for payment.`,
          link: "/dashboard",
        })
      )
    );

    Promise.all(
      financeUsers.filter((finance) => finance.email).map((finance) =>
        sendFinanceReimbursementEmail({
          to: finance.email,
          employeeName: reimbursementRequest.employeeId.name,
          totalReimbursement: reimbursementRequest.totalReimbursement,
          businessPurpose: reimbursementRequest.businessPurpose,
          expenseFrom: reimbursementRequest.expenseFrom,
          expenseTo: reimbursementRequest.expenseTo,
          status: reimbursementRequest.finalStatus,
        })
      )
    ).catch((emailError) =>
      console.log("Finance reimbursement email failed:", emailError.message)
    );

    res.status(200).json({
      success: true,
      message: "Reimbursement approved successfully",
      reimbursementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectReimbursementByManager = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!["Manager", "HR"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Manager or HR can reject reimbursement",
      });
    }

    if (!rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const reimbursementRequest = await ReimbursementRequest.findById(
      req.params.id
    ).populate("employeeId", "name email");

    if (!reimbursementRequest) {
      return res.status(404).json({
        success: false,
        message: "Reimbursement request not found",
      });
    }

    if (
      req.user.role === "Manager" &&
      reimbursementRequest.managerId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned as manager for this request",
      });
    }

    if (reimbursementRequest.finalStatus !== "Pending Final Approval") {
      return res.status(400).json({
        success: false,
        message: "This reimbursement is not awaiting final approval",
      });
    }

    if (req.user.role === "Manager") {
      reimbursementRequest.managerStatus = "Rejected";
      reimbursementRequest.managerRejectionReason = rejectionReason.trim();
      reimbursementRequest.finalStatus = "Rejected by Manager";
    }

    if (req.user.role === "HR") {
      reimbursementRequest.hrStatus = "Rejected";
      reimbursementRequest.hrRejectionReason = rejectionReason.trim();
      reimbursementRequest.finalStatus = "Rejected by HR";
    }

    reimbursementRequest.financeStatus = "Not Routed";
    reimbursementRequest.rejectionReason = rejectionReason.trim();

    reimbursementRequest.approvalHistory.push({
      level: req.user.role === "HR" ? "HR" : "Manager",
      action: "Rejected",
      actedBy: req.user._id,
      remarks: rejectionReason.trim(),
    });

    await reimbursementRequest.save();

    await createNotification({
      recipientId: reimbursementRequest.employeeId._id,
      type: "Reimbursement",
      title: "Reimbursement Rejected",
      message: `Your reimbursement request was rejected. Reason: ${rejectionReason}`,
      link: "/dashboard",
    });
    if (reimbursementRequest.teamLeaderId) {
      await createNotification({
        recipientId: reimbursementRequest.teamLeaderId,
        type: "Reimbursement",
        title: "Reimbursement Final Decision",
        message: `${reimbursementRequest.employeeId.name}'s reimbursement was rejected by ${req.user.role}. Reason: ${rejectionReason}`,
        link: "/dashboard",
      });
    }
    if (reimbursementRequest.employeeId.email) {
      sendDecisionEmail({
        to: reimbursementRequest.employeeId.email,
        subject: "Reimbursement Request Rejected",
        title: "Reimbursement Request Rejected",
        employeeName: reimbursementRequest.employeeId.name,
        requestType: "Reimbursement",
        status: "Rejected",
        rejectionReason: rejectionReason.trim(),
      }).catch((emailError) =>
        console.log("Reimbursement rejection email failed:", emailError.message)
      );
    }

    res.status(200).json({
      success: true,
      message: "Reimbursement rejected successfully",
      reimbursementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFinanceReimbursements = async (req, res) => {
  try {
    if (req.user.role !== "Finance") {
      return res.status(403).json({
        success: false,
        message: "Only Finance can view approved reimbursements",
      });
    }

    const reimbursementRequests = await ReimbursementRequest.find({
      finalStatus: {
        $in: ["Approved by Manager", "Approved by HR", "Paid by Finance"],
      },
    })
      .populate("employeeId", "name email employeeId designation")
      .populate("managerApprovedBy", "name")
      .populate("hrApprovedBy", "name")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      reimbursementRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markReimbursementAsPaid = async (req, res) => {
  try {
    if (req.user.role !== "Finance") {
      return res.status(403).json({
        success: false,
        message: "Only Finance can update payment status",
      });
    }

    const reimbursementRequest = await ReimbursementRequest.findById(
      req.params.id
    ).populate("employeeId", "name email");

    if (!reimbursementRequest) {
      return res.status(404).json({
        success: false,
        message: "Reimbursement request not found",
      });
    }

    if (
      !["Approved by Manager", "Approved by HR"].includes(
        reimbursementRequest.finalStatus
      ) ||
      reimbursementRequest.financeStatus !== "Pending Payment"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only an approved pending reimbursement can be marked paid",
      });
    }

    reimbursementRequest.financeStatus = "Paid";
    reimbursementRequest.financeApprovedBy = req.user._id;
    reimbursementRequest.financeApprovedAt = new Date();
    reimbursementRequest.finalStatus = "Paid by Finance";

    reimbursementRequest.approvalHistory.push({
      level: "Finance",
      action: "Paid",
      actedBy: req.user._id,
      remarks: "Marked as paid by Finance",
    });

    await reimbursementRequest.save();

    await createNotification({
      recipientId: reimbursementRequest.employeeId._id,
      type: "Reimbursement",
      title: "Reimbursement Paid",
      message: "Your reimbursement payment has been processed successfully.",
      link: "/dashboard",
    });

    res.status(200).json({
      success: true,
      message: "Reimbursement marked as paid",
      reimbursementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
