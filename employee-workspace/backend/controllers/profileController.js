import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import cloudinary from "../config/cloudinary.js";

const getPopulatedProfile = async (userId) => {
  return User.findById(userId)
    .select("-passwordHash")
    .populate("subcategoryId", "name")
    .populate("teamId", "name departmentId")
    .populate(
      "managerId",
      "name email employeeId designation role profilePhoto"
    )
    .populate(
      "hrId",
      "name email employeeId designation role profilePhoto"
    )
    .populate(
      "teamLeaderId",
      "name email employeeId designation role profilePhoto"
    )
    .populate("assignedTeamIds", "name departmentId");
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await getPopulatedProfile(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GET MY PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve profile",
    });
  }
};

export const updateMyMobile = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const normalizedPhone = phone.trim();

    if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid Indian mobile number in +91XXXXXXXXXX format",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        phone: normalizedPhone,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Mobile number updated successfully",
      user,
    });
  } catch (error) {
    console.error("UPDATE MOBILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update mobile number",
    });
  }
};

export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least 8 characters",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from the current password",
      });
    }

    const user = await User.findById(
      req.user._id
    ).select("+passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.passwordHash) {
      return res.status(500).json({
        success: false,
        message:
          "This account does not have a valid password configured",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.passwordHash = await bcrypt.hash(
      newPassword,
      10
    );

    user.mustChangePassword = false;

    await user.save();

    const admins = await User.find({
      role: "Admin",
      isActive: true,
      _id: {
        $ne: user._id,
      },
    }).select("_id");

    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map((admin) => ({
          recipientId: admin._id,
          title: "Employee Password Changed",
          message: `${user.name} changed their password.`,
          link: "/notifications",
        }))
      );
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("CHANGE MY PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};

export const uploadSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Signature file is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        signatureFile: req.file.path,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Signature uploaded successfully",
      user,
    });
  } catch (error) {
    console.error("UPLOAD SIGNATURE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to upload signature",
    });
  }
};

export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile photo is required",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      if (req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const previousPublicId =
      user.profilePhoto?.publicId || "";

    user.profilePhoto = {
      url: req.file.path,
      publicId: req.file.filename,
      uploadedAt: new Date(),
    };

    await user.save();

    if (previousPublicId) {
      try {
        await cloudinary.uploader.destroy(
          previousPublicId
        );
      } catch (cloudinaryError) {
        console.error(
          "DELETE OLD PROFILE PHOTO ERROR:",
          cloudinaryError
        );
      }
    }

    const updatedUser = await getPopulatedProfile(
      user._id
    );

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPLOAD PROFILE PHOTO ERROR:", error);

    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(
          req.file.filename
        );
      } catch (cleanupError) {
        console.error(
          "PROFILE PHOTO CLEANUP ERROR:",
          cleanupError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to upload profile photo",
    });
  }
};

export const removeProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const previousPublicId =
      user.profilePhoto?.publicId || "";

    if (
      !user.profilePhoto?.url &&
      !previousPublicId
    ) {
      return res.status(400).json({
        success: false,
        message: "No profile photo is currently set",
      });
    }

    user.profilePhoto = {
      url: "",
      publicId: "",
      uploadedAt: null,
    };

    await user.save();

    if (previousPublicId) {
      try {
        await cloudinary.uploader.destroy(
          previousPublicId
        );
      } catch (cloudinaryError) {
        console.error(
          "REMOVE CLOUDINARY PROFILE PHOTO ERROR:",
          cloudinaryError
        );
      }
    }

    const updatedUser = await getPopulatedProfile(
      user._id
    );

    return res.status(200).json({
      success: true,
      message: "Profile photo removed successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("REMOVE PROFILE PHOTO ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove profile photo",
    });
  }
};