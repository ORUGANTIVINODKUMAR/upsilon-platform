import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const profilePhotoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    firstName: {
      type: String,
      trim: true,
      default: "",
    },

    lastName: {
      type: String,
      trim: true,
      default: "",
    },

    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: null,
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    designation: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    dateOfJoining: {
      type: Date,
      default: null,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: [
        "Admin",
        "HR",
        "Manager",
        "TeamLeader",
        "Employee",
        "Finance",
      ],
      default: "Employee",
    },

    employmentStatus: {
      type: String,
      enum: [
        "Active",
        "Inactive",
        "On Leave",
        "Probation",
        "Notice Period",
        "Terminated",
        "Resigned",
      ],
      default: "Active",
    },

    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      default: null,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
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

    teamLeaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedTeamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    profilePhoto: {
      type: profilePhotoSchema,
      default: () => ({
        url: "",
        publicId: "",
        uploadedAt: null,
      }),
    },

    additionalInformation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    signatureFile: {
      type: String,
      default: "",
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("validate", function () {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  if (this.employeeId) {
    this.employeeId = this.employeeId.trim();
  }

  if (!this.name && (this.firstName || this.lastName)) {
    this.name = `${this.firstName || ""} ${
      this.lastName || ""
    }`
      .trim()
      .replace(/\s+/g, " ");
  }
});

userSchema.methods.matchPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

export default User;