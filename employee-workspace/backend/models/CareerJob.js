import mongoose from "mongoose";

const careerJobSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: [true, "Job title is required."],
      trim: true,
    },

    department: {
      type: String,
      required: [true, "Department is required."],
      trim: true,
    },

    location: {
      type: String,
      required: [true, "Location is required."],
      trim: true,
    },

    employmentType: {
      type: String,
      required: [true, "Employment type is required."],
      enum: [
        "Full Time",
        "Part Time",
        "Internship",
        "Contract",
        "Freelance",
      ],
    },

    experience: {
      type: String,
      required: [true, "Experience is required."],
      trim: true,
    },

    workMode: {
      type: String,
      required: [true, "Work mode is required."],
      enum: ["Remote", "Hybrid", "Onsite"],
    },

    numberOfOpenings: {
      type: Number,
      required: [true, "Number of openings is required."],
      min: [1, "At least one opening is required."],
    },

    salaryRange: {
      type: String,
      trim: true,
      default: "",
    },

    applicationDeadline: {
      type: Date,
      required: [true, "Application deadline is required."],
    },

    jobStatus: {
      type: String,
      enum: ["Active", "Draft", "Closed"],
      default: "Draft",
    },

    shortDescription: {
      type: String,
      required: [true, "Short description is required."],
      trim: true,
    },

    responsibilities: {
      type: String,
      required: [true, "Responsibilities are required."],
      trim: true,
    },

    requiredSkills: {
      type: String,
      required: [true, "Required skills are required."],
      trim: true,
    },

    education: {
      type: String,
      required: [true, "Education is required."],
      trim: true,
    },

    noticePeriod: {
      type: String,
      required: [true, "Notice period is required."],
      trim: true,
    },

    postedDate: {
      type: Date,
      default: Date.now,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareersAdmin",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CareerJob = mongoose.model("CareerJob", careerJobSchema);

export default CareerJob;