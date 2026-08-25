import Team from "../models/Team.js";

export const createTeam = async (req, res) => {
  try {
    const {
      name,
      departmentId,
      managerIds,
      hrIds,
      description,
    } = req.body;

    if (!name || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "Team name and department are required",
      });
    }

    const exists = await Team.findOne({
      name,
      departmentId,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Team already exists in this department",
      });
    }

    const team = await Team.create({
      name,
      departmentId,
      managerIds: managerIds || [],
      hrIds: hrIds || [],
      description: description || "",
    });

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("departmentId", "name")
      .populate("managerIds", "name email role")
      .populate("hrIds", "name email role")
      .populate("teamLeaderId", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const {
      name,
      departmentId,
      managerIds,
      hrIds,
      teamLeaderId,
      description,
      isActive,
    } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    team.name = name ?? team.name;
    team.departmentId = departmentId ?? team.departmentId;
    team.managerIds = managerIds ?? team.managerIds;
    team.hrIds = hrIds ?? team.hrIds;
    team.teamLeaderId = teamLeaderId ?? team.teamLeaderId;
    team.description = description ?? team.description;

    if (typeof isActive === "boolean") {
      team.isActive = isActive;
    }

    await team.save();

    res.status(200).json({
      success: true,
      message: "Team updated successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};