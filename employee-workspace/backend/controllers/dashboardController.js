import User from "../models/User.js";
import Subcategory from "../models/Subcategory.js";
import LeaveRequest from "../models/LeaveRequest.js";
import ReimbursementRequest from "../models/ReimbursementRequest.js";
import Holiday from "../models/Holiday.js";
import Team from "../models/Team.js";
import {
  PERSONAL_LEAVE_ROLES,
  getLeaveBalanceForUser,
} from "../services/leaveBalanceService.js";

export const getDashboardStats = async (req, res) => {
  try {
    console.time("dashboard-stats");

    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    const tomorrow = new Date(startOfToday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const leaveFilter = {
      startDate: { $lte: endOfToday },
      endDate: { $gte: startOfToday },
      finalStatus: {
        $in: ["Approved by Manager", "Approved by HR"],
      },
    };

    if (req.user.role === "TeamLeader") {
      leaveFilter.teamLeaderId = req.user._id;
    }

    if (req.user.role === "Manager") {
      leaveFilter.managerId = req.user._id;
    }

    const managerTeamQuery =
      req.user.role === "Manager"
        ? User.countDocuments({
            managerId: req.user._id,
            isActive: true,
          })
        : Promise.resolve(0);

    const teamLeaderTeamQuery =
      req.user.role === "TeamLeader"
        ? User.countDocuments({
            teamLeaderId: req.user._id,
            isActive: true,
          })
        : Promise.resolve(0);

    const todayLeavesQuery = ["Admin", "HR", "Manager", "TeamLeader"].includes(
      req.user.role
    )
      ? LeaveRequest.find(leaveFilter)
          .populate("employeeId", "name email employeeId designation role")
          .populate("subcategoryId", "name")
          .populate("teamId", "name")
          .sort({ startDate: 1 })
          .lean()
      : Promise.resolve([]);

    const pendingManagerLeavesQuery =
      req.user.role === "HR"
        ? LeaveRequest.countDocuments({
            finalStatus: "Pending Final Approval",
          })
        : LeaveRequest.countDocuments({
            managerId: req.user._id,
            finalStatus: "Pending Final Approval",
          });

    const pendingManagerReimbursementsQuery =
      req.user.role === "HR"
        ? ReimbursementRequest.countDocuments({
            finalStatus: "Pending Final Approval",
          })
        : ReimbursementRequest.countDocuments({
            managerId: req.user._id,
            finalStatus: "Pending Final Approval",
          });

    const [
      totalEmployees,
      departments,
      managerTeamCount,
      teamLeaderTeamCount,
      todayLeaves,
      nearestUpcomingHoliday,
      tomorrowHoliday,

      pendingTLLeaves,
      pendingManagerLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,

      pendingTLReimbursements,
      pendingManagerReimbursements,
      pendingReimbursements,
      approvedReimbursements,
      paidReimbursements,

      myLeaves,
      myPendingLeaves,
      myApprovedLeaves,
      myRejectedLeaves,

      myReimbursements,
      myPendingReimbursements,
      myApprovedReimbursements,
      myRejectedReimbursements,

      todayBirthdays,

      tlTeams,
      managerTeams,
      managerEmployees,
      teamMembers,

      totalManagers,
      totalTeamLeaders,
      totalHRs,
      totalFinance,
    ] = await Promise.all([
      User.countDocuments({
        role: { $ne: "Admin" },
      }),

      Subcategory.countDocuments(),

      managerTeamQuery,

      teamLeaderTeamQuery,

      todayLeavesQuery,

      Holiday.findOne({
        holidayDate: {
          $gte: startOfToday,
        },
      })
        .sort({ holidayDate: 1 })
        .lean(),

      Holiday.findOne({
        holidayDate: {
          $gte: tomorrow,
          $lte: endOfTomorrow,
        },
      })
        .sort({ holidayDate: 1 })
        .lean(),

      LeaveRequest.countDocuments({
        teamLeaderId: req.user._id,
        finalStatus: "Pending Final Approval",
        tlStatus: "Pending",
      }),

      pendingManagerLeavesQuery,

      LeaveRequest.countDocuments({
        finalStatus: "Pending Final Approval",
      }),

      LeaveRequest.countDocuments({
        finalStatus: {
          $in: ["Approved by Manager", "Approved by HR"],
        },
      }),

      LeaveRequest.countDocuments({
        finalStatus: {
          $in: ["Rejected by Team Leader", "Rejected by Manager", "Rejected by HR"],
        },
      }),

      ReimbursementRequest.countDocuments({
        teamLeaderId: req.user._id,
        finalStatus: "Pending Final Approval",
        tlStatus: "Pending",
      }),

      pendingManagerReimbursementsQuery,

      ReimbursementRequest.countDocuments({
        finalStatus: "Pending Final Approval",
      }),

      ReimbursementRequest.countDocuments({
        finalStatus: {
          $in: ["Approved by Manager", "Approved by HR"],
        },
        financeStatus: "Pending Payment",
      }),

      ReimbursementRequest.countDocuments({
        finalStatus: "Paid by Finance",
      }),

      LeaveRequest.countDocuments({
        employeeId: req.user._id,
      }),

      LeaveRequest.countDocuments({
        employeeId: req.user._id,
        finalStatus: "Pending Final Approval",
      }),

      LeaveRequest.countDocuments({
        employeeId: req.user._id,
        finalStatus: {
          $in: ["Approved by Manager", "Approved by HR"],
        },
      }),

      LeaveRequest.countDocuments({
        employeeId: req.user._id,
        finalStatus: {
          $in: ["Rejected by Team Leader", "Rejected by Manager", "Rejected by HR"],
        },
      }),

      ReimbursementRequest.countDocuments({
        employeeId: req.user._id,
      }),

      ReimbursementRequest.countDocuments({
        employeeId: req.user._id,
        finalStatus: "Pending Final Approval",
      }),

      ReimbursementRequest.countDocuments({
        employeeId: req.user._id,
        finalStatus: {
          $in: ["Approved by Manager", "Approved by HR", "Paid by Finance"],
        },
      }),

      ReimbursementRequest.countDocuments({
        employeeId: req.user._id,
        finalStatus: {
          $in: ["Rejected by Team Leader", "Rejected by Manager", "Rejected by HR"],
        },
      }),

      User.find({
        isActive: true,
        role: { $ne: "Admin" },
        dateOfBirth: { $exists: true, $ne: null },
      })
        .select("name email employeeId designation dateOfBirth role")
        .lean(),

      Team.find({
        teamLeaderId: req.user._id,
      })
        .populate("departmentId", "name")
        .lean(),

      Team.find({
        managerIds: req.user._id,
      })
        .populate("departmentId", "name")
        .populate("teamLeaderId", "name email employeeId designation")
        .lean(),

      User.find({
        managerId: req.user._id,
        isActive: true,
      })
        .select("name email employeeId designation role teamId")
        .populate("teamId", "name")
        .lean(),

      User.find({
        teamLeaderId: req.user._id,
        isActive: true,
      })
        .select("name email employeeId designation role teamId")
        .populate("teamId", "name")
        .lean(),

      User.countDocuments({
        role: "Manager",
        isActive: true,
      }),

      User.countDocuments({
        role: "TeamLeader",
        isActive: true,
      }),

      User.countDocuments({
        role: "HR",
        isActive: true,
      }),

      User.countDocuments({
        role: "Finance",
        isActive: true,
      }),
    ]);

    const todaysBirthdayEmployees = todayBirthdays.filter((employee) => {
      const dob = new Date(employee.dateOfBirth);

      return (
        dob.getDate() === today.getDate() &&
        dob.getMonth() === today.getMonth()
      );
    });

    const leaveBalance = PERSONAL_LEAVE_ROLES.includes(req.user.role)
      ? await getLeaveBalanceForUser(req.user._id, { includeHistory: false })
      : null;

    const managerTeamsWithCounts = managerTeams.map((team) => {
      const employeesInTeam = managerEmployees.filter(
        (employee) =>
          employee.teamId?._id?.toString() === team._id.toString()
      );

      return {
        ...team,
        employeeCount: employeesInTeam.length,
        employees: employeesInTeam,
      };
    });

    const tlTeamsWithCounts = tlTeams.map((team) => {
      const employeesInTeam = teamMembers.filter(
        (employee) =>
          employee.teamId?._id?.toString() === team._id.toString()
      );

      return {
        ...team,
        employeeCount: employeesInTeam.length,
        employees: employeesInTeam,
      };
    });

    console.timeEnd("dashboard-stats");

    res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        departments,
        managerTeamCount,
        teamLeaderTeamCount,
        todayLeaves,
        tomorrowHoliday,
        nearestUpcomingHoliday,

        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        todaysBirthdayEmployees,
        pendingTLLeaves,
        pendingManagerLeaves,

        pendingReimbursements,
        pendingTLReimbursements,
        pendingManagerReimbursements,
        approvedReimbursements,
        paidReimbursements,

        myLeaves,
        myPendingLeaves,
        myApprovedLeaves,
        myRejectedLeaves,

        myReimbursements,
        myPendingReimbursements,
        myApprovedReimbursements,
        myRejectedReimbursements,

        leaveBalance,

        tlTeams: tlTeamsWithCounts,
        managerTeams: managerTeamsWithCounts,
        managerEmployees,
        teamMembers,

        totalManagers,
        totalTeamLeaders,
        totalHRs,
        totalFinance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
