import mongoose from "mongoose";

const careerApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareerJob",
      required: [true, "Job ID is required."],
    },

    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
    },

    currentLocation: {
      type: String,
      required: [true, "Current location is required."],
      trim: true,
    },

    totalExperience: {
      type: String,
      required: [true, "Total experience is required."],
      trim: true,
    },

    relevantExperience: {
      type: String,
      trim: true,
      default: "",
    },

    currentCompany: {
      type: String,
      trim: true,
      default: "",
    },

    currentSalary: {
      type: String,
      trim: true,
      default: "",
    },

    expectedSalary: {
      type: String,
      trim: true,
      default: "",
    },

    noticePeriod: {
      type: String,
      required: [true, "Notice period is required."],
      trim: true,
    },

    linkedinUrl: {
      type: String,
      trim: true,
      default: "",
    },

    portfolioUrl: {
      type: String,
      trim: true,
      default: "",
    },

    coverLetter: {
      type: String,
      trim: true,
      default: "",
    },

    additionalNotes: {
      type: String,
      trim: true,
      default: "",
    },

    resumeFileName: {
      type: String,
      required: [true, "Resume filename is required."],
    },

    resumePath: {
      type: String,
      required: [true, "Resume path is required."],
    },

    status: {
      type: String,
      enum: [
        "New",
        "Shortlisted",
        "Interview Scheduled",
        "Selected",
        "Rejected",
      ],
      default: "New",
    },
  },
  {
    timestamps: true,
  }
);

const CareerApplication = mongoose.model(
  "CareerApplication",
  careerApplicationSchema
);

export default CareerApplication;
