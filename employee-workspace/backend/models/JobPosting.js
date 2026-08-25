import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      default: "Full-time",
    },
    description: {
      type: String,
      required: true,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    applyEmail: {
      type: String,
      trim: true,
      default: "",
    },
    applyLink: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareersAdmin",
      default: null,
    },
  },
  { timestamps: true }
);

const JobPosting = mongoose.model("JobPosting", jobPostingSchema);

export default JobPosting;
