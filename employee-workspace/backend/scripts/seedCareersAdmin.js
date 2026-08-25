import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import CareersAdmin from "../models/CareersAdmin.js";
import connectDB from "../config/db.js";

dotenv.config();

/*
  Create a new admin:

  node scripts/seedCareersAdmin.js "Name" "email@example.com" "Password123!"

  Update an existing admin:

  node scripts/seedCareersAdmin.js "Name" "new@example.com" "Password123!" "old@example.com"
*/

const [
  ,
  ,
  argName,
  argEmail,
  argPassword,
  argCurrentEmail,
] = process.argv;

const name =
  argName ||
  process.env.CAREERS_ADMIN_NAME ||
  "Careers Admin";

const email = (
  argEmail ||
  process.env.CAREERS_ADMIN_EMAIL ||
  "careers-admin@upsilonservices.com"
)
  .toLowerCase()
  .trim();

const password =
  argPassword ||
  process.env.CAREERS_ADMIN_PASSWORD;

const currentEmail = (
  argCurrentEmail ||
  process.env.CAREERS_ADMIN_CURRENT_EMAIL ||
  ""
)
  .toLowerCase()
  .trim();

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const seedCareersAdmin = async () => {
  try {
    if (!password || password.length < 8) {
      throw new Error(
        "A Careers admin password of at least 8 characters is required"
      );
    }

    if (!emailPattern.test(email)) {
      throw new Error(
        "The new admin email address is invalid."
      );
    }

    if (
      currentEmail &&
      !emailPattern.test(currentEmail)
    ) {
      throw new Error(
        "The current admin email address is invalid."
      );
    }

    await connectDB();

    /*
     * UPDATE EXISTING ADMIN
     */
    if (currentEmail) {
      const existingAdmin =
        await CareersAdmin.findOne({
          email: currentEmail,
        });

      if (!existingAdmin) {
        throw new Error(
          `No Careers admin was found with email: ${currentEmail}`
        );
      }

      const duplicateAdmin =
        await CareersAdmin.findOne({
          email,
        });

      if (
        duplicateAdmin &&
        duplicateAdmin._id.toString() !==
          existingAdmin._id.toString()
      ) {
        throw new Error(
          `Another Careers admin already uses: ${email}`
        );
      }

      const passwordHash =
        await bcrypt.hash(password, 10);

      existingAdmin.name = name;
      existingAdmin.email = email;
      existingAdmin.passwordHash =
        passwordHash;
      existingAdmin.isActive = true;

      await existingAdmin.save();

      console.log(
        "Careers admin updated successfully:"
      );

      console.log(
        `  Previous email: ${currentEmail}`
      );

      console.log(`  New email:      ${email}`);

      console.log(
        "The password was also updated to the password supplied in the command."
      );

      process.exit(0);
    }

    /*
     * CREATE NEW ADMIN
     */
    const existingAdmin =
      await CareersAdmin.findOne({
        email,
      });

    if (existingAdmin) {
      console.log(
        `Careers admin already exists: ${email}`
      );

      process.exit(0);
    }

    const passwordHash =
      await bcrypt.hash(password, 10);

    await CareersAdmin.create({
      name,
      email,
      passwordHash,
      isActive: true,
    });

    console.log("Careers admin created:");

    console.log(`  Email: ${email}`);

    console.log(
      "Use the password supplied in the command to log in."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "Careers admin seed error:",
      error.message
    );

    process.exit(1);
  }
};

seedCareersAdmin();
