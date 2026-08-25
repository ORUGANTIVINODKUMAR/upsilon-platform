import Holiday from "../models/Holiday.js";

const canManageHolidays = (role) =>
  ["Admin", "Manager", "HR"].includes(role);

export const createHoliday = async (req, res) => {
  try {
    if (!canManageHolidays(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create holidays",
      });
    }

    const { name, holidayDate, type, description } = req.body;

    const exists = await Holiday.findOne({
      holidayDate: new Date(holidayDate),
      name,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Holiday already exists for this date",
      });
    }

    const holiday = await Holiday.create({
      name,
      holidayDate,
      type,
      description,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Holiday added successfully",
      holiday,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({})
      .populate("createdBy", "name role")
      .sort({ holidayDate: 1 });

    res.status(200).json({
      success: true,
      holidays,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    if (!canManageHolidays(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete holidays",
      });
    }

    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    await Holiday.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};