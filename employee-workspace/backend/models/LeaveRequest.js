import mongoose from "mongoose";

const leaveEditHistorySchema = new mongoose.Schema(
  {
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    editedAt: {
      type: Date,
      default: Date.now,
    },

    previousValues: {
      leaveType: {
        type: String,
        default: "",
      },

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },

      reason: {
        type: String,
        default: "",
      },

      leaveExplanation: {
        type: String,
        default: "",
      },

      workingDays: {
        type: Number,
        default: 0,
      },

      proofFile: {
        type: String,
        default: "",
      },

      finalStatus: {
        type: String,
        default: "",
      },
    },

    updatedValues: {
      leaveType: {
        type: String,
        default: "",
      },

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },

      reason: {
        type: String,
        default: "",
      },

      leaveExplanation: {
        type: String,
        default: "",
      },

      workingDays: {
        type: Number,
        default: 0,
      },

      proofFile: {
        type: String,
        default: "",
      },

      finalStatus: {
        type: String,
        default: "",
      },
    },

    changedFields: [
      {
        type: String,
        trim: true,
      },
    ],

    requiredReapproval: {
      type: Boolean,
      default: false,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  },
);

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    teamLeaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    leaveType: {
      type: String,
      enum: [
        "Sick",
        "Vacation",
        "Personal",
        "Travel",
        "Casual",
        "Earned",
        "Emergency",
      ],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    requestKind: {
      type: String,
      enum: ["Standard", "Retrospective"],
      default: "Standard",
      required: true,
    },

    retrospectiveDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    workingDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    leaveExplanation: {
      type: String,
      default: "",
      trim: true,
    },

    proofFile: {
      type: String,
      default: "",
      trim: true,
    },

    tlStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Not Required"],
      default: "Pending",
    },

    tlApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    tlApprovedAt: {
      type: Date,
      default: null,
    },

    tlRejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    managerStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    managerApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    managerApprovedAt: {
      type: Date,
      default: null,
    },

    managerRejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    hrStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    hrApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    hrApprovedAt: {
      type: Date,
      default: null,
    },

    hrRejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    finalStatus: {
      type: String,
      enum: [
        "Pending Final Approval",
        "Pending Reapproval",
        "On Hold",
        "Approved by Manager",
        "Approved by HR",
        "Rejected by Team Leader",
        "Rejected by Manager",
        "Rejected by HR",
        "Cancelled",
      ],
      default: "Pending Final Approval",
    },

    approvalHistory: [
      {
        level: {
          type: String,
          enum: ["TeamLeader", "Manager", "HR", "Employee"],
          required: true,
        },

        action: {
          type: String,
          enum: [
            "Submitted",
            "Approved",
            "Rejected",
            "Edited",
            "Sent for Reapproval",
            "Put On Hold",
            "Moved to Pending",
            "Status Changed",
            "Cancelled",
          ],
          required: true,
        },

        actedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },

        actedAt: {
          type: Date,
          default: Date.now,
        },

        remarks: {
          type: String,
          default: "",
          trim: true,
        },
      },
    ],
    statusHistory: [
      {
        previousStatus: {
          type: String,
          default: "",
          trim: true,
        },

        newStatus: {
          type: String,
          enum: [
            "Pending Final Approval",
            "Pending Reapproval",
            "On Hold",
            "Approved by Manager",
            "Approved by HR",
            "Rejected by Team Leader",
            "Rejected by Manager",
            "Rejected by HR",
            "Cancelled",
          ],
          required: true,
        },

        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        changedAt: {
          type: Date,
          default: Date.now,
        },

        remarks: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    editHistory: {
      type: [leaveEditHistorySchema],
      default: [],
    },

    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastEditedAt: {
      type: Date,
      default: null,
    },
    lastStatusChangedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lastStatusChangedAt: {
      type: Date,
      default: null,
    },
    requiresReapproval: {
      type: Boolean,
      default: false,
    },

    reapprovalCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

leaveRequestSchema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted && this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
});

leaveRequestSchema.pre("validate", function () {
  if (
    this.startDate &&
    this.endDate &&
    new Date(this.endDate) < new Date(this.startDate)
  ) {
    this.invalidate("endDate", "End date cannot be earlier than start date");
  }

  if (this.finalStatus === "Pending Reapproval") {
    this.requiresReapproval = true;
  }

  if (
    [
      "Pending Final Approval",
      "On Hold",
      "Approved by Manager",
      "Approved by HR",
      "Rejected by Team Leader",
      "Rejected by Manager",
      "Rejected by HR",
      "Cancelled",
    ].includes(this.finalStatus)
  ) {
    this.requiresReapproval = false;
  }
});

leaveRequestSchema.index({
  employeeId: 1,
  createdAt: -1,
});

leaveRequestSchema.index({
  employeeId: 1,
  startDate: 1,
  endDate: 1,
  finalStatus: 1,
});

leaveRequestSchema.index({
  managerId: 1,
  finalStatus: 1,
});

leaveRequestSchema.index({
  teamLeaderId: 1,
  finalStatus: 1,
});

leaveRequestSchema.index({
  finalStatus: 1,
  updatedAt: -1,
});

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);

export default LeaveRequest;
