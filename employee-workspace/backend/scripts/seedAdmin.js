import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import "../config/env.js";
import connectDB from "../config/db.js";
import User from "../models/User.js";

const seedAdmin = async () => {
  try {
    const adminName = process.env.ADMIN_NAME || "System Administrator";
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
      existingAdmin.name = adminName;
      existingAdmin.passwordHash = await bcrypt.hash(adminPassword, 10);
      existingAdmin.role = "Admin";
      existingAdmin.isActive = true;
      existingAdmin.mustChangePassword = false;
      await existingAdmin.save();
      console.log("Admin credentials updated successfully");
      await mongoose.disconnect();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash: hashedPassword,
      role: "Admin",
      isActive: true,
      mustChangePassword: false,
    });

    console.log("Admin created successfully");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
