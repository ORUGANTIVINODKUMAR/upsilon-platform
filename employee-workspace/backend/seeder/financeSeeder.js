import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../../config/db.js";
import User from "../../models/User.js";

dotenv.config();

connectDB();

const seedFinanceUser = async () => {
  try {
    const financeEmail = process.env.FINANCE_EMAIL?.trim().toLowerCase();
    const financePassword = process.env.FINANCE_PASSWORD;

    if (!financeEmail || !financePassword || financePassword.length < 8) {
      throw new Error(
        "FINANCE_EMAIL and FINANCE_PASSWORD (minimum 8 characters) are required"
      );
    }

    const existingFinance = await User.findOne({
      email: financeEmail,
    });

    if (existingFinance) {
      console.log("Finance user already exists");
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
    process.exit(0);
  } catch (error) {
    console.error("Finance user seed failed:", error.message);
    process.exit(1);
  }
};

seedFinanceUser();
