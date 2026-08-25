import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  LuBriefcaseBusiness,
  LuCircleCheck,
  LuCircleX,
  LuUsers,
  LuCirclePlus,
  LuEye,
} from "react-icons/lu";

import CareersAdminLayout from "../components/CareersAdminLayout";
import DashboardCharts from "./DashboardCharts";

import "./Dashboard.css";

const initialStats = {
  totalJobs: 0,
  activeJobs: 0,
  draftJobs: 0,
  closedJobs: 0,
  totalApplicants: 0,
};

const initialCharts = {
  statusData: [],
  departmentData: [],
  monthlyData: [],
};

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] =
    useState(initialStats);

  const [recentApplicants, setRecentApplicants] =
    useState([]);

  const [charts, setCharts] =
    useState(initialCharts);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          statsResponse,
          applicantsResponse,
          chartsResponse,
        ] = await Promise.all([
          fetch(
            "/api/careers-dashboard/stats",
            {
              credentials: "include",
            }
          ),

          fetch(
            "/api/careers-dashboard/recent-applicants",
            {
              credentials: "include",
            }
          ),

          fetch(
            "/api/careers-dashboard/charts",
            {
              credentials: "include",
            }
          ),
        ]);

        const statsData =
          await statsResponse.json();

        const applicantsData =
          await applicantsResponse.json();

        const chartsData =
          await chartsResponse.json();

        if (!statsResponse.ok) {
          throw new Error(
            statsData.message ||
              "Unable to fetch dashboard statistics."
          );
        }

        if (!applicantsResponse.ok) {
          throw new Error(
            applicantsData.message ||
              "Unable to fetch recent applicants."
          );
        }

        if (!chartsResponse.ok) {
          throw new Error(
            chartsData.message ||
              "Unable to fetch dashboard charts."
          );
        }

        setStats({
          totalJobs:
            statsData.stats?.totalJobs || 0,

          activeJobs:
            statsData.stats?.activeJobs || 0,

          draftJobs:
            statsData.stats?.draftJobs || 0,

          closedJobs:
            statsData.stats?.closedJobs || 0,

          totalApplicants:
            statsData.stats
              ?.totalApplicants || 0,
        });

        setRecentApplicants(
          applicantsData.applicants || []
        );

        setCharts({
          statusData:
            chartsData.charts?.statusData ||
            [],

          departmentData:
            chartsData.charts
              ?.departmentData || [],

          monthlyData:
            chartsData.charts?.monthlyData ||
            [],
        });
      } catch (error) {
        console.error(
          "Careers dashboard error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to load the dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    return new Date(dateValue).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const statCards = [
    {
      label: "Total Jobs",
      value: stats.totalJobs,
      icon: LuBriefcaseBusiness,
      color: "gold",
    },
    {
      label: "Active Jobs",
      value: stats.activeJobs,
      icon: LuCircleCheck,
      color: "green",
    },
    {
      label: "Closed Jobs",
      value: stats.closedJobs,
      icon: LuCircleX,
      color: "red",
    },
    {
      label: "Total Applicants",
      value: stats.totalApplicants,
      icon: LuUsers,
      color: "purple",
    },
  ];

  const actions = (
    <Link
      to="/admin/careers/add-job"
      className="careers-admin-primary-button"
    >
      <LuCirclePlus
        size={18}
        aria-hidden="true"
      />
      Add New Job
    </Link>
  );

  return (
    <CareersAdminLayout
      title="Dashboard"
      description="Overview of Careers activity and recent applications."
      actions={actions}
    >
      {loading && (
        <div className="careers-dashboard-message">
          Loading dashboard...
        </div>
      )}

      {!loading && errorMessage && (
        <div className="careers-dashboard-message careers-dashboard-error">
          <h3>
            Unable to Load Dashboard
          </h3>

          <p>{errorMessage}</p>
        </div>
      )}

      {!loading && !errorMessage && (
        <>
          <section className="careers-dashboard-stats">
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.label}
                  className="careers-dashboard-stat-card"
                >
                  <div
                    className={`careers-dashboard-stat-icon ${card.color}`}
                  >
                    <Icon
                      size={22}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p>{card.label}</p>
                    <h2>{card.value}</h2>
                  </div>
                </article>
              );
            })}
          </section>

          <DashboardCharts
            charts={charts}
          />

          <section className="careers-dashboard-panel">
            <div className="careers-dashboard-panel-heading">
              <div>
                <h2>Recent Applicants</h2>

                <p>
                  The latest candidate applications.
                </p>
              </div>

              <Link
                to="/admin/careers/applicants"
                className="careers-admin-secondary-button"
              >
                View All
              </Link>
            </div>

            {recentApplicants.length === 0 ? (
              <div className="careers-dashboard-empty">
                No applications have been received.
              </div>
            ) : (
              <div className="careers-dashboard-table-wrapper">
                <table className="careers-dashboard-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Job</th>
                      <th>Status</th>
                      <th>Applied</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentApplicants.map(
                      (application) => (
                        <tr
                          key={application._id}
                        >
                          <td>
                            <strong>
                              {
                                application.fullName
                              }
                            </strong>

                            <small>
                              {application.email}
                            </small>
                          </td>

                          <td>
                            {application.jobId
                              ?.jobTitle ||
                              "Deleted job"}
                          </td>

                          <td>
                            <span
                              className={`careers-application-status status-${application.status
                                .toLowerCase()
                                .replaceAll(
                                  " ",
                                  "-"
                                )}`}
                            >
                              {application.status}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              application.createdAt
                            )}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="careers-dashboard-view-button"
                              onClick={() =>
                                navigate(
                                  `/admin/careers/applicants/${application._id}`
                                )
                              }
                              aria-label={`View ${application.fullName}`}
                            >
                              <LuEye
                                size={17}
                                aria-hidden="true"
                              />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </CareersAdminLayout>
  );
}

export default Dashboard;