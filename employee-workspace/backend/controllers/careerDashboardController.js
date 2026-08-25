import CareerJob from "../models/CareerJob.js";
import CareerApplication from "../models/CareerApplication.js";

// Admin: dashboard totals
export const getCareerDashboardStats = async (req, res) => {
  try {
    const [
      totalJobs,
      activeJobs,
      draftJobs,
      closedJobs,
      totalApplicants,
    ] = await Promise.all([
      CareerJob.countDocuments(),
      CareerJob.countDocuments({
        jobStatus: "Active",
      }),
      CareerJob.countDocuments({
        jobStatus: "Draft",
      }),
      CareerJob.countDocuments({
        jobStatus: "Closed",
      }),
      CareerApplication.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        draftJobs,
        closedJobs,
        totalApplicants,
      },
    });
  } catch (error) {
    console.error("Career dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard statistics.",
    });
  }
};

// Admin: latest five applicants
export const getRecentCareerApplicants = async (req, res) => {
  try {
    const applicants = await CareerApplication.find()
      .populate(
        "jobId",
        "jobTitle department location"
      )
      .sort({
        createdAt: -1,
      })
      .limit(5);

    return res.status(200).json({
      success: true,
      applicants,
    });
  } catch (error) {
    console.error("Recent Career applicants error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch recent applicants.",
    });
  }
};

// Admin: data used by dashboard charts
export const getCareerDashboardCharts = async (req, res) => {
  try {
    const [
      statusData,
      departmentData,
      monthlyData,
    ] = await Promise.all([
      CareerApplication.aggregate([
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      CareerJob.aggregate([
        {
          $group: {
            _id: "$department",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      CareerApplication.aggregate([
        {
          $group: {
            _id: {
              year: {
                $year: "$createdAt",
              },
              month: {
                $month: "$createdAt",
              },
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      charts: {
        statusData,
        departmentData,
        monthlyData,
      },
    });
  } catch (error) {
    console.error("Career dashboard charts error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard chart data.",
    });
  }
};