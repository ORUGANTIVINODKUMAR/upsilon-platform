import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});

const seedFinanceUser = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    const financeEmail = process.env.FINANCE_EMAIL?.trim().toLowerCase();
    const financePassword = process.env.FINANCE_PASSWORD;

    if (!mongoUri) {
      throw new Error("MongoDB URI not found in backend/.env");
    }

    if (!financeEmail || !financePassword || financePassword.length < 8) {
      throw new Error(
        "FINANCE_EMAIL and FINANCE_PASSWORD (minimum 8 characters) are required"
      );
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected");

    const existingFinance = await User.findOne({
      email: financeEmail,
    });

    if (existingFinance) {
      console.log("Finance user already exists");
      await mongoose.disconnect();
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(financePassword, 10);

    await User.create({
      name: "Finance User",
      email: financeEmail,
      passwordHash,
      role: "Finance",
      isActive: true,
    });

    console.log("Finance user created successfully");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Finance user seed failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedFinanceUser();
