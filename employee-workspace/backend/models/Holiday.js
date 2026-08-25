import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    holidayDate: {
      type: Date,
      required: true,
    },

    type: {
      type: String,
      enum: ["National", "Festival", "Company", "Optional"],
      default: "Company",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Holiday = mongoose.model("Holiday", holidaySchema);

export default Holiday;