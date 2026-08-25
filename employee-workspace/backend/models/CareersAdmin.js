import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const careersAdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

careersAdminSchema.methods.matchPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

const CareersAdmin = mongoose.model("CareersAdmin", careersAdminSchema);

export default CareersAdmin;
