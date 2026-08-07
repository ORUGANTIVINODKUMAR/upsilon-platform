import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword || adminPassword.length < 8) {
  throw new Error(
    "ADMIN_EMAIL and ADMIN_PASSWORD (minimum 8 characters) are required"
  );
}

await mongoose.connect(process.env.MONGO_URI);

const passwordHash = await bcrypt.hash(adminPassword, 10);

const admin = await User.create({
  name: "Admin",
  email: adminEmail,
  passwordHash,
  role: "Admin",
  mustChangePassword: false,
  isActive: true,
});

console.log("Admin created:", admin.email);

process.exit();
