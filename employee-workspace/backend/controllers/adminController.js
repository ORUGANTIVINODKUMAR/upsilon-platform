import Subcategory from "../models/Subcategory.js";
import Team from "../models/Team.js";
import LeaveRequest from "../models/LeaveRequest.js";
import ReimbursementRequest from "../models/ReimbursementRequest.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const ALLOWED_ROLES = [
  "Admin",
  "HR",
  "Manager",
  "TeamLeader",
  "Employee",
  "Finance",
];

const normalizeOptionalObjectId = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  return value;
};

const normalizeOptionalDate = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    const error = new Error("Invalid date value");
    error.statusCode = 400;
    throw error;
  }

  return parsedDate;
};

const normalizeAssignedTeamIds = (assignedTeamIds) => {
  if (assignedTeamIds === undefined) {
    return undefined;
  }

  if (!Array.isArray(assignedTeamIds)) {
    return [];
  }

  return [
    ...new Set(
      assignedTeamIds.filter(Boolean).map((teamId) => teamId.toString()),
    ),
  ];
};

const syncUserTeamRelationships = async (user) => {
  await Team.updateMany(
    {},
    {
      $pull: {
        managerIds: user._id,
        hrIds: user._id,
      },
    },
  );

  await Team.updateMany(
    {
      teamLeaderId: user._id,
    },
    {
      $set: {
        teamLeaderId: null,
      },
    },
  );

  if (user.role === "Manager" && user.assignedTeamIds?.length > 0) {
    await Team.updateMany(
      {
        _id: {
          $in: user.assignedTeamIds,
        },
      },
      {
        $addToSet: {
          managerIds: user._id,
        },
      },
    );
  }

  if (user.role === "HR" && user.assignedTeamIds?.length > 0) {
    await Team.updateMany(
      {
        _id: {
          $in: user.assignedTeamIds,
        },
      },
      {
        $addToSet: {
          hrIds: user._id,
        },
      },
    );
  }

  if (user.role === "TeamLeader" && user.teamId) {
    await Team.findByIdAndUpdate(user.teamId, {
      $set: {
        teamLeaderId: user._id,
      },
    });
  }
};

const getPopulatedUser = async (userId) => {
  return User.findById(userId)
    .select("-passwordHash")
    .populate("subcategoryId", "name")
    .populate("teamId", "name departmentId")
    .populate(
      "managerId",
      "name email employeeId designation role profilePhoto",
    )
    .populate("hrId", "name email employeeId designation role profilePhoto")
    .populate(
      "teamLeaderId",
      "name email employeeId designation role profilePhoto",
    )
    .populate("assignedTeamIds", "name departmentId");
};

export const createSubcategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subcategory name is required",
      });
    }

    const normalizedName = name.trim();

    const existingSubcategory = await Subcategory.findOne({
      name: normalizedName,
    });

    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: "Subcategory already exists",
      });
    }

    const subcategory = await Subcategory.create({
      name: normalizedName,
    });

    return res.status(201).json({
      success: true,
      message: "Subcategory created successfully",
      subcategory,
    });
  } catch (error) {
    console.error("CREATE SUBCATEGORY ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Subcategory already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create subcategory",
    });
  }
};

export const getSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find().sort({
      name: 1,
    });

    const users = await User.find({
      role: {
        $in: ["Employee", "TeamLeader", "Manager", "HR"],
      },
    }).select(
      "name email employeeId designation role subcategoryId teamId profilePhoto isActive",
    );

    const teams = await Team.find()
      .populate(
        "managerIds",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate(
        "hrIds",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate(
        "teamLeaderId",
        "name email employeeId designation role profilePhoto isActive",
      );

    const subcategoriesWithUsers = subcategories.map((department) => {
      const departmentUsers = users.filter(
        (user) => user.subcategoryId?.toString() === department._id.toString(),
      );

      const employees = departmentUsers.filter(
        (user) => user.role === "Employee",
      );

      const departmentTeams = teams.filter(
        (team) => team.departmentId?.toString() === department._id.toString(),
      );

      const managers = [
        ...new Map(
          departmentTeams
            .flatMap((team) => team.managerIds || [])
            .filter(Boolean)
            .map((manager) => [manager._id.toString(), manager]),
        ).values(),
      ];

      const hrs = [
        ...new Map(
          departmentTeams
            .flatMap((team) => team.hrIds || [])
            .filter(Boolean)
            .map((hr) => [hr._id.toString(), hr]),
        ).values(),
      ];

      const teamLeaders = [
        ...new Map(
          departmentTeams
            .map((team) => team.teamLeaderId)
            .filter(
              (teamLeader) => teamLeader && teamLeader.role === "TeamLeader",
            )
            .map((teamLeader) => [teamLeader._id.toString(), teamLeader]),
        ).values(),
      ];

      const usersForView = [...employees, ...teamLeaders, ...managers, ...hrs];

      const teamsForView = departmentTeams.map((team) => {
        const teamEmployees = employees.filter(
          (employee) => employee.teamId?.toString() === team._id.toString(),
        );

        return {
          _id: team._id,
          name: team.name,
          managers: team.managerIds || [],
          hrs: team.hrIds || [],
          teamLeader:
            team.teamLeaderId?.role === "TeamLeader" ? team.teamLeaderId : null,
          employeeCount: teamEmployees.length,
          employees: teamEmployees,
        };
      });

      return {
        ...department.toObject(),

        users: usersForView,
        userCount: usersForView.length,

        employeeCount: employees.length,
        teamLeaderCount: teamLeaders.length,
        managerCount: managers.length,
        hrCount: hrs.length,

        teams: teamsForView,
        employees,
        teamLeaders,
        managers,
        hrs,
      };
    });

    return res.status(200).json({
      success: true,
      subcategories: subcategoriesWithUsers,
    });
  } catch (error) {
    console.error("GET SUBCATEGORIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve subcategories",
    });
  }
};
export const createTeam = async (req, res) => {
  try {
    const { name, departmentId, managerIds, hrIds, description } = req.body;

    if (!name?.trim() || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "Team name and department are required",
      });
    }

    const normalizedName = name.trim();

    const department = await Subcategory.findById(departmentId);

    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Selected department does not exist",
      });
    }

    const existingTeam = await Team.findOne({
      name: normalizedName,
      departmentId,
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: "Team already exists in this department",
      });
    }

    const normalizedManagerIds = Array.isArray(managerIds)
      ? [...new Set(managerIds.filter(Boolean).map(String))]
      : [];

    const normalizedHrIds = Array.isArray(hrIds)
      ? [...new Set(hrIds.filter(Boolean).map(String))]
      : [];

    if (normalizedManagerIds.length > 0) {
      const managerCount = await User.countDocuments({
        _id: {
          $in: normalizedManagerIds,
        },
        role: "Manager",
        isActive: true,
      });

      if (managerCount !== normalizedManagerIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected managers are invalid or inactive",
        });
      }
    }

    if (normalizedHrIds.length > 0) {
      const hrCount = await User.countDocuments({
        _id: {
          $in: normalizedHrIds,
        },
        role: "HR",
        isActive: true,
      });

      if (hrCount !== normalizedHrIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected HR users are invalid or inactive",
        });
      }
    }

    const team = await Team.create({
      name: normalizedName,
      departmentId,
      managerIds: normalizedManagerIds,
      hrIds: normalizedHrIds,
      description: description?.trim() || "",
    });

    if (normalizedManagerIds.length > 0) {
      await User.updateMany(
        {
          _id: {
            $in: normalizedManagerIds,
          },
        },
        {
          $addToSet: {
            assignedTeamIds: team._id,
          },
        },
      );
    }

    if (normalizedHrIds.length > 0) {
      await User.updateMany(
        {
          _id: {
            $in: normalizedHrIds,
          },
        },
        {
          $addToSet: {
            assignedTeamIds: team._id,
          },
        },
      );
    }

    const populatedTeam = await Team.findById(team._id)
      .populate("departmentId", "name")
      .populate(
        "managerIds",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate(
        "hrIds",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate(
        "teamLeaderId",
        "name email employeeId designation role profilePhoto isActive",
      );

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error("CREATE TEAM ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid department or user ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Team already exists in this department",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create team",
    });
  }
};

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("departmentId", "name")
      .populate(
        "managerIds",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate(
        "hrIds",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate(
        "teamLeaderId",
        "name email employeeId designation role profilePhoto isActive",
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    console.error("GET TEAMS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve teams",
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

    const previousManagerIds = (team.managerIds || []).map((id) =>
      id.toString(),
    );

    const previousHrIds = (team.hrIds || []).map((id) => id.toString());

    if (departmentId !== undefined) {
      const department = await Subcategory.findById(departmentId);

      if (!department) {
        return res.status(400).json({
          success: false,
          message: "Selected department does not exist",
        });
      }

      team.departmentId = departmentId;
    }

    if (name !== undefined) {
      const normalizedName = name.trim();

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message: "Team name cannot be empty",
        });
      }

      const duplicateTeam = await Team.findOne({
        _id: {
          $ne: team._id,
        },
        name: normalizedName,
        departmentId: team.departmentId,
      });

      if (duplicateTeam) {
        return res.status(400).json({
          success: false,
          message: "Team already exists in this department",
        });
      }

      team.name = normalizedName;
    }

    if (managerIds !== undefined) {
      const normalizedManagerIds = Array.isArray(managerIds)
        ? [...new Set(managerIds.filter(Boolean).map(String))]
        : [];

      if (normalizedManagerIds.length > 0) {
        const managerCount = await User.countDocuments({
          _id: {
            $in: normalizedManagerIds,
          },
          role: "Manager",
          isActive: true,
        });

        if (managerCount !== normalizedManagerIds.length) {
          return res.status(400).json({
            success: false,
            message: "One or more selected managers are invalid or inactive",
          });
        }
      }

      team.managerIds = normalizedManagerIds;
    }

    if (hrIds !== undefined) {
      const normalizedHrIds = Array.isArray(hrIds)
        ? [...new Set(hrIds.filter(Boolean).map(String))]
        : [];

      if (normalizedHrIds.length > 0) {
        const hrCount = await User.countDocuments({
          _id: {
            $in: normalizedHrIds,
          },
          role: "HR",
          isActive: true,
        });

        if (hrCount !== normalizedHrIds.length) {
          return res.status(400).json({
            success: false,
            message: "One or more selected HR users are invalid or inactive",
          });
        }
      }

      team.hrIds = normalizedHrIds;
    }

    if (teamLeaderId !== undefined) {
      if (teamLeaderId) {
        const teamLeader = await User.findOne({
          _id: teamLeaderId,
          role: "TeamLeader",
          isActive: true,
        });

        if (!teamLeader) {
          return res.status(400).json({
            success: false,
            message: "Selected Team Lead is invalid or inactive",
          });
        }

        await Team.updateMany(
          {
            _id: {
              $ne: team._id,
            },
            teamLeaderId,
          },
          {
            $set: {
              teamLeaderId: null,
            },
          },
        );

        await User.findByIdAndUpdate(teamLeaderId, {
          $set: {
            teamId: team._id,
            subcategoryId: team.departmentId,
          },
        });

        team.teamLeaderId = teamLeaderId;
      } else {
        team.teamLeaderId = null;
      }
    }

    if (description !== undefined) {
      team.description = description?.trim() || "";
    }

    if (typeof isActive === "boolean") {
      team.isActive = isActive;
    }

    await team.save();

    const currentManagerIds = (team.managerIds || []).map((id) =>
      id.toString(),
    );

    const currentHrIds = (team.hrIds || []).map((id) => id.toString());

    const removedManagerIds = previousManagerIds.filter(
      (id) => !currentManagerIds.includes(id),
    );

    const removedHrIds = previousHrIds.filter(
      (id) => !currentHrIds.includes(id),
    );

    if (removedManagerIds.length > 0) {
      await User.updateMany(
        {
          _id: {
            $in: removedManagerIds,
          },
        },
        {
          $pull: {
            assignedTeamIds: team._id,
          },
        },
      );
    }

    if (removedHrIds.length > 0) {
      await User.updateMany(
        {
          _id: {
            $in: removedHrIds,
          },
        },
        {
          $pull: {
            assignedTeamIds: team._id,
          },
        },
      );
    }

    if (currentManagerIds.length > 0) {
      await User.updateMany(
        {
          _id: {
            $in: currentManagerIds,
          },
        },
        {
          $addToSet: {
            assignedTeamIds: team._id,
          },
        },
      );
    }

    if (currentHrIds.length > 0) {
      await User.updateMany(
        {
          _id: {
            $in: currentHrIds,
          },
        },
        {
          $addToSet: {
            assignedTeamIds: team._id,
          },
        },
      );
    }

    const populatedTeam = await Team.findById(team._id)
      .populate("departmentId", "name")
      .populate(
        "managerIds",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate(
        "hrIds",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate(
        "teamLeaderId",
        "name email employeeId designation role profilePhoto isActive",
      );

    return res.status(200).json({
      success: true,
      message: "Team updated successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error("UPDATE TEAM ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid team, department, or user ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Team already exists in this department",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update team",
    });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const assignedUsers = await User.countDocuments({
      $or: [
        {
          teamId: team._id,
        },
        {
          assignedTeamIds: team._id,
        },
      ],
    });

    if (assignedUsers > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete team because users are still assigned to it",
      });
    }

    await Team.findByIdAndDelete(team._id);

    return res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("DELETE TEAM ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to delete team",
    });
  }
};
export const createUser = async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      employeeId,
      designation,
      phone,
      dateOfJoining,
      dateOfBirth,
      email,
      password,
      role = "Employee",
      subcategoryId,
      teamId,
      managerId,
      hrId,
      teamLeaderId,
      assignedTeamIds,
    } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedEmployeeId = employeeId?.trim() || null;
    const normalizedFirstName = firstName?.trim() || "";
    const normalizedLastName = lastName?.trim() || "";

    const normalizedName =
      name?.trim() ||
      `${normalizedFirstName} ${normalizedLastName}`
        .trim()
        .replace(/\s+/g, " ");

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: "User name is required",
      });
    }

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!normalizedEmail.endsWith("@upsilonservices.com")) {
      return res.status(400).json({
        success: false,
        message: "Only @upsilonservices.com email addresses are allowed",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const duplicateConditions = [
      {
        email: normalizedEmail,
      },
    ];

    if (normalizedEmployeeId) {
      duplicateConditions.push({
        employeeId: normalizedEmployeeId,
      });
    }

    const existingUser = await User.findOne({
      $or: duplicateConditions,
    });

    if (existingUser) {
      const duplicateEmail =
        existingUser.email?.toLowerCase() === normalizedEmail;

      return res.status(400).json({
        success: false,
        message: duplicateEmail
          ? "Email already used by another user"
          : "Employee ID already used by another user",
      });
    }

    if (
      dateOfJoining !== undefined &&
      dateOfJoining !== null &&
      dateOfJoining !== ""
    ) {
      normalizeOptionalDate(dateOfJoining);
    }

    if (
      dateOfBirth !== undefined &&
      dateOfBirth !== null &&
      dateOfBirth !== ""
    ) {
      normalizeOptionalDate(dateOfBirth);
    }

    if (managerId) {
      const manager = await User.findOne({
        _id: managerId,
        role: "Manager",
        isActive: true,
      });

      if (!manager) {
        return res.status(400).json({
          success: false,
          message: "Selected reporting manager is invalid or inactive",
        });
      }
    }

    if (hrId) {
      const hr = await User.findOne({
        _id: hrId,
        role: "HR",
        isActive: true,
      });

      if (!hr) {
        return res.status(400).json({
          success: false,
          message: "Selected HR user is invalid or inactive",
        });
      }
    }

    if (teamLeaderId) {
      const teamLeader = await User.findOne({
        _id: teamLeaderId,
        role: "TeamLeader",
        isActive: true,
      });

      if (!teamLeader) {
        return res.status(400).json({
          success: false,
          message: "Selected Team Lead is invalid or inactive",
        });
      }
    }

    if (subcategoryId) {
      const department = await Subcategory.findById(subcategoryId);

      if (!department) {
        return res.status(400).json({
          success: false,
          message: "Selected department does not exist",
        });
      }
    }

    if (teamId) {
      const selectedTeam = await Team.findById(teamId);

      if (!selectedTeam) {
        return res.status(400).json({
          success: false,
          message: "Selected team does not exist",
        });
      }

      if (
        subcategoryId &&
        selectedTeam.departmentId?.toString() !== subcategoryId.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Selected team does not belong to the selected department",
        });
      }
    }

    const normalizedAssignedTeamIds =
      normalizeAssignedTeamIds(assignedTeamIds) || [];

    if (normalizedAssignedTeamIds.length > 0) {
      const assignedTeamsCount = await Team.countDocuments({
        _id: {
          $in: normalizedAssignedTeamIds,
        },
      });

      if (assignedTeamsCount !== normalizedAssignedTeamIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more assigned teams are invalid",
        });
      }
    }

    const isStandaloneRole = role === "Admin" || role === "Finance";

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: normalizedName,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      employeeId: normalizedEmployeeId,
      designation: designation?.trim() || "",
      phone: phone?.trim() || "",
      dateOfJoining:
        dateOfJoining === undefined ||
        dateOfJoining === null ||
        dateOfJoining === ""
          ? null
          : normalizeOptionalDate(dateOfJoining),
      dateOfBirth:
        dateOfBirth === undefined || dateOfBirth === null || dateOfBirth === ""
          ? null
          : normalizeOptionalDate(dateOfBirth),
      email: normalizedEmail,
      passwordHash,
      role,

      subcategoryId: isStandaloneRole || !subcategoryId ? null : subcategoryId,

      teamId: isStandaloneRole || !teamId ? null : teamId,

      managerId: isStandaloneRole || !managerId ? null : managerId,

      hrId: isStandaloneRole || !hrId ? null : hrId,

      teamLeaderId: role === "Employee" && teamLeaderId ? teamLeaderId : null,

      assignedTeamIds:
        role === "HR" || role === "Manager" ? normalizedAssignedTeamIds : [],

      isActive: true,
      mustChangePassword: true,
    });

    await syncUserTeamRelationships(user);

    const populatedUser = await getPopulatedUser(user._id);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: populatedUser,
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid department, team, or reporting user ID",
      });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message: `${duplicateField || "Value"} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create user",
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .populate("subcategoryId", "name")
      .populate("teamId", "name departmentId")
      .populate(
        "managerId",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate(
        "hrId",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate(
        "teamLeaderId",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate("assignedTeamIds", "name departmentId isActive")
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve users",
    });
  }
};
export const updateUser = async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      employeeId,
      designation,
      phone,
      dateOfJoining,
      dateOfBirth,
      email,
      role,
      subcategoryId,
      isActive,
      teamId,
      managerId,
      hrId,
      teamLeaderId,
      assignedTeamIds,
    } = req.body;

    const user = await User.findById(req.params.id).select("+passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedRole = role ?? user.role;

    if (!ALLOWED_ROLES.includes(updatedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    if (email !== undefined) {
      const normalizedEmail = email?.trim().toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      if (!normalizedEmail.endsWith("@upsilonservices.com")) {
        return res.status(400).json({
          success: false,
          message: "Only @upsilonservices.com email addresses are allowed",
        });
      }

      const existingEmailUser = await User.findOne({
        email: normalizedEmail,
        _id: {
          $ne: user._id,
        },
      });

      if (existingEmailUser) {
        return res.status(400).json({
          success: false,
          message: "Email already used by another user",
        });
      }

      user.email = normalizedEmail;
    }

    if (employeeId !== undefined) {
      const normalizedEmployeeId = employeeId?.trim() || null;

      if (normalizedEmployeeId) {
        const existingEmployee = await User.findOne({
          employeeId: normalizedEmployeeId,
          _id: {
            $ne: user._id,
          },
        });

        if (existingEmployee) {
          return res.status(400).json({
            success: false,
            message: "Employee ID already used by another user",
          });
        }
      }

      user.employeeId = normalizedEmployeeId;
    }

    const normalizedManagerId = normalizeOptionalObjectId(managerId);

    const normalizedHrId = normalizeOptionalObjectId(hrId);

    const normalizedTeamLeaderId = normalizeOptionalObjectId(teamLeaderId);

    const normalizedTeamId = normalizeOptionalObjectId(teamId);

    const normalizedSubcategoryId = normalizeOptionalObjectId(subcategoryId);

    const normalizedAssignedTeamIds = normalizeAssignedTeamIds(assignedTeamIds);

    if (
      normalizedManagerId &&
      normalizedManagerId.toString() === user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "A user cannot be their own reporting manager",
      });
    }

    if (normalizedHrId && normalizedHrId.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "A user cannot be assigned as their own HR",
      });
    }

    if (
      normalizedTeamLeaderId &&
      normalizedTeamLeaderId.toString() === user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "A user cannot be their own Team Lead",
      });
    }

    if (normalizedManagerId) {
      const manager = await User.findOne({
        _id: normalizedManagerId,
        role: "Manager",
        isActive: true,
      });

      if (!manager) {
        return res.status(400).json({
          success: false,
          message: "Selected reporting manager is invalid or inactive",
        });
      }
    }

    if (normalizedHrId) {
      const hr = await User.findOne({
        _id: normalizedHrId,
        role: "HR",
        isActive: true,
      });

      if (!hr) {
        return res.status(400).json({
          success: false,
          message: "Selected HR user is invalid or inactive",
        });
      }
    }

    if (normalizedTeamLeaderId) {
      const teamLeader = await User.findOne({
        _id: normalizedTeamLeaderId,
        role: "TeamLeader",
        isActive: true,
      });

      if (!teamLeader) {
        return res.status(400).json({
          success: false,
          message: "Selected Team Lead is invalid or inactive",
        });
      }
    }

    if (normalizedSubcategoryId) {
      const department = await Subcategory.findById(normalizedSubcategoryId);

      if (!department) {
        return res.status(400).json({
          success: false,
          message: "Selected department does not exist",
        });
      }
    }

    let selectedTeam = null;

    if (normalizedTeamId) {
      selectedTeam = await Team.findById(normalizedTeamId);

      if (!selectedTeam) {
        return res.status(400).json({
          success: false,
          message: "Selected team does not exist",
        });
      }

      const departmentToCheck =
        normalizedSubcategoryId === undefined
          ? user.subcategoryId
          : normalizedSubcategoryId;

      if (
        departmentToCheck &&
        selectedTeam.departmentId?.toString() !== departmentToCheck.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Selected team does not belong to the selected department",
        });
      }
    }

    if (normalizedAssignedTeamIds?.length > 0) {
      const assignedTeams = await Team.find({
        _id: {
          $in: normalizedAssignedTeamIds,
        },
      }).select("_id");

      if (assignedTeams.length !== normalizedAssignedTeamIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more assigned teams are invalid",
        });
      }
    }

    if (name !== undefined) {
      const normalizedName = name?.trim();

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message: "User name cannot be empty",
        });
      }

      user.name = normalizedName;
    }

    if (firstName !== undefined) {
      user.firstName = firstName?.trim() || "";
    }

    if (lastName !== undefined) {
      user.lastName = lastName?.trim() || "";
    }

    if (
      name === undefined &&
      (firstName !== undefined || lastName !== undefined)
    ) {
      const combinedName = `${user.firstName || ""} ${user.lastName || ""}`
        .trim()
        .replace(/\s+/g, " ");

      if (combinedName) {
        user.name = combinedName;
      }
    }

    if (designation !== undefined) {
      user.designation = designation?.trim() || "";
    }

    if (phone !== undefined) {
      user.phone = phone?.trim() || "";
    }

    if (dateOfJoining !== undefined) {
      user.dateOfJoining = normalizeOptionalDate(dateOfJoining);
    }

    if (dateOfBirth !== undefined) {
      user.dateOfBirth = normalizeOptionalDate(dateOfBirth);
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    user.role = updatedRole;

    const isStandaloneRole =
      updatedRole === "Admin" || updatedRole === "Finance";

    if (isStandaloneRole) {
      user.subcategoryId = null;
      user.teamId = null;
      user.managerId = null;
      user.hrId = null;
      user.teamLeaderId = null;
      user.assignedTeamIds = [];
    } else {
      if (normalizedSubcategoryId !== undefined) {
        user.subcategoryId = normalizedSubcategoryId;
      }

      if (normalizedTeamId !== undefined) {
        user.teamId = normalizedTeamId;
      }

      if (normalizedManagerId !== undefined) {
        user.managerId = normalizedManagerId;
      }

      if (normalizedHrId !== undefined) {
        user.hrId = normalizedHrId;
      }

      if (updatedRole === "Employee") {
        if (normalizedTeamLeaderId !== undefined) {
          user.teamLeaderId = normalizedTeamLeaderId;
        }
      } else {
        user.teamLeaderId = null;
      }

      if (updatedRole === "Manager" || updatedRole === "HR") {
        if (normalizedAssignedTeamIds !== undefined) {
          user.assignedTeamIds = normalizedAssignedTeamIds;
        }
      } else {
        user.assignedTeamIds = [];
      }
    }

    if (user.role === "TeamLeader" && user.teamId) {
      const teamForLeader = selectedTeam || (await Team.findById(user.teamId));

      if (!teamForLeader) {
        return res.status(400).json({
          success: false,
          message: "Team Leader must be assigned to a valid team",
        });
      }
    }

    await user.save();

    await syncUserTeamRelationships(user);

    const updatedUser = await getPopulatedUser(user._id);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user, department, team, or reporting user ID",
      });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message: `${duplicateField || "Value"} already exists`,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          Object.values(error.errors)
            .map((item) => item.message)
            .join(", ") || "User validation failed",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update user",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("+passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "Admin") {
      return res.status(400).json({
        success: false,
        message: "Admin user cannot be deleted",
      });
    }

    /*
     * This performs a soft deletion.
     *
     * The user document is retained so that:
     * - Attendance records remain linked.
     * - Leave records remain linked.
     * - Reimbursement records remain linked.
     * - Employee IDs remain associated with history.
     * - Existing references do not become broken.
     */
    user.isActive = false;

    await user.save();

    await Team.updateMany(
      {},
      {
        $pull: {
          managerIds: user._id,
          hrIds: user._id,
        },
      },
    );

    await Team.updateMany(
      {
        teamLeaderId: user._id,
      },
      {
        $set: {
          teamLeaderId: null,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to deactivate user",
    });
  }
};
export const deleteSubcategory = async (req, res) => {
  try {
    const usersInDepartment = await User.countDocuments({
      subcategoryId: req.params.id,
    });

    if (usersInDepartment > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete department. Users are assigned to this department.",
      });
    }

    const teamsInDepartment = await Team.countDocuments({
      departmentId: req.params.id,
    });

    if (teamsInDepartment > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete department. Teams are assigned to this department.",
      });
    }

    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("DELETE SUBCATEGORY ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to delete department",
    });
  }
};

export const getAllLeaveReports = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({})
      .populate(
        "employeeId",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate("subcategoryId", "name")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      leaveRequests,
    });
  } catch (error) {
    console.error("GET ALL LEAVE REPORTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve leave reports",
    });
  }
};

export const getAllReimbursementReports = async (req, res) => {
  try {
    const reimbursements = await ReimbursementRequest.find({})
      .populate(
        "employeeId",
        "name email employeeId designation role profilePhoto isActive",
      )
      .populate("managerApprovedBy", "name email employeeId role profilePhoto")
      .populate("hrApprovedBy", "name email employeeId role profilePhoto")
      .populate("teamLeaderId", "name email employeeId role profilePhoto")
      .populate("tlApprovedBy", "name email employeeId role profilePhoto")
      .populate("financeApprovedBy", "name email employeeId role profilePhoto")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      reimbursements,
    });
  } catch (error) {
    console.error("GET ALL REIMBURSEMENT REPORTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve reimbursement reports",
    });
  }
};
