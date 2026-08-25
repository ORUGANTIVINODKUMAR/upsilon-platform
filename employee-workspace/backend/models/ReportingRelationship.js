import mongoose from "mongoose";

const reportingRelationshipSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reportsToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    relationshipType: {
      type: String,
      enum: [
        "TeamLeader",
        "Manager",
        "HR",
        "FinanceApprover",
        "ProjectManager",
      ],
      required: true,
    },

    isPrimary: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

reportingRelationshipSchema.index({
  employeeId: 1,
  reportsToId: 1,
  relationshipType: 1,
});

export default mongoose.model(
  "ReportingRelationship",
  reportingRelationshipSchema
);