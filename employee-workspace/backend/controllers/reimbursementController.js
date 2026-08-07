import ReimbursementRequest from "../models/ReimbursementRequest.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";
import Team from "../models/Team.js";
import {
  sendDecisionEmail,
  sendFinanceReimbursementEmail,
  sendReimbursementRequestEmail,
} from "../services/emailService.js";

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

    let parsedItems;

    try {
      parsedItems = typeof items === "string" ? JSON.parse(items) : items;
    } catch {
      return res.status(400).json({
        success: false,
        message: "Expense items must be valid JSON",
      });
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one expense item is required",
      });
    }

    const normalizedItems = parsedItems.map((item) => ({
      description: String(item?.description || "").trim(),
      category: String(item?.category || "").trim(),
      cost: Number(item?.cost),
    }));

    if (
      normalizedItems.some(
        (item) =>
          !item.description ||
          !item.category ||
          !Number.isFinite(item.cost) ||
          item.cost < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Each expense item requires a description, category, and valid non-negative cost",
      });
    }

    const parsedExpenseFrom = new Date(expenseFrom);
    const parsedExpenseTo = new Date(expenseTo);

    if (
      Number.isNaN(parsedExpenseFrom.getTime()) ||
      Number.isNaN(parsedExpenseTo.getTime()) ||
      parsedExpenseTo < parsedExpenseFrom
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid expense date range is required",
      });
    }

    const normalizedBusinessPurpose = String(businessPurpose || "").trim();
    const normalizedCashAdvance = Number(lessCashAdvance || 0);
    const calculatedSubtotal = normalizedItems.reduce(
      (sum, item) => sum + item.cost,
      0
    );
    const calculatedTotal = calculatedSubtotal - normalizedCashAdvance;

    if (
      !normalizedBusinessPurpose ||
      !Number.isFinite(normalizedCashAdvance) ||
      normalizedCashAdvance < 0 ||
      calculatedTotal < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Business purpose and a valid cash advance are required",
      });
    }

    const uploadedReceiptFiles = req.files?.map((file) => file.path) || [];

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
