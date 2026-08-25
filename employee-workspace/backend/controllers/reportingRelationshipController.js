import ReportingRelationship from "../models/ReportingRelationship.js";

export const createRelationship = async (req, res) => {
  try {
    const {
      employeeId,
      reportsToId,
      relationshipType,
      isPrimary,
    } = req.body;

    const exists = await ReportingRelationship.findOne({
      employeeId,
      reportsToId,
      relationshipType,
      isActive: true,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Relationship already exists",
      });
    }

    const relationship =
      await ReportingRelationship.create({
        employeeId,
        reportsToId,
        relationshipType,
        isPrimary: isPrimary ?? true,
      });

    res.status(201).json({
      success: true,
      message: "Relationship created successfully",
      relationship,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEmployeeHierarchy = async (req, res) => {
  try {
    const hierarchy =
      await ReportingRelationship.find({
        employeeId: req.params.employeeId,
        isActive: true,
      })
        .populate(
          "employeeId",
          "name email role"
        )
        .populate(
          "reportsToId",
          "name email role"
        );

    res.status(200).json({
      success: true,
      hierarchy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deactivateRelationship =
  async (req, res) => {
    try {
      const relationship =
        await ReportingRelationship.findById(
          req.params.id
        );

      if (!relationship) {
        return res.status(404).json({
          success: false,
          message: "Relationship not found",
        });
      }

      relationship.isActive = false;

      await relationship.save();

      res.status(200).json({
        success: true,
        message:
          "Relationship deactivated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };