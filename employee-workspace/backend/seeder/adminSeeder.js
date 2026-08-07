import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import connectDB from "../config/db.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword || adminPassword.length < 8) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD (minimum 8 characters) are required"
      );
    }

    await connectDB();

    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await User.create({
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "Admin",
      isActive: true,
    });

    console.log("Admin seeded successfully");

    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

seedAdmin();
