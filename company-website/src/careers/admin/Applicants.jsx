import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  LuDownload,
  LuEye,
  LuFileText,
  LuSearch,
} from "react-icons/lu";

import CareersAdminLayout from "../components/CareersAdminLayout";

import "./Applicants.css";

const applicationStatuses = [
  "New",
  "Shortlisted",
  "Interview Scheduled",
  "Selected",
  "Rejected",
];

function Applicants() {
  const navigate = useNavigate();

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [jobFilter, setJobFilter] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const applicationsPerPage = 10;

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        "/api/applications",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to fetch applications."
        );
      }

      setApplications(
        data.applications || []
      );
    } catch (error) {
      console.error(
        "Fetch Career applications:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to fetch applications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    jobFilter,
  ]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successMessage]);

  const jobs = useMemo(() => {
    const jobMap = new Map();

    applications.forEach((application) => {
      if (
        application.jobId?._id &&
        application.jobId?.jobTitle
      ) {
        jobMap.set(
          application.jobId._id,
          application.jobId.jobTitle
        );
      }
    });

    return Array.from(jobMap.entries()).map(
      ([id, title]) => ({
        id,
        title,
      })
    );
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const searchValue = searchTerm
      .trim()
      .toLowerCase();

    return applications.filter(
      (application) => {
        const searchableText = [
          application.fullName,
          application.email,
          application.phone,
          application.currentLocation,
          application.currentCompany,
          application.jobId?.jobTitle,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !searchValue ||
          searchableText.includes(
            searchValue
          );

        const matchesStatus =
          !statusFilter ||
          application.status ===
            statusFilter;

        const matchesJob =
          !jobFilter ||
          application.jobId?._id ===
            jobFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesJob
        );
      }
    );
  }, [
    applications,
    searchTerm,
    statusFilter,
    jobFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredApplications.length /
        applicationsPerPage
    )
  );

  const startIndex =
    (currentPage - 1) *
    applicationsPerPage;

  const currentApplications =
    filteredApplications.slice(
      startIndex,
      startIndex +
        applicationsPerPage
    );

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

  const getStatusClass = (status) => {
    return status
      .toLowerCase()
      .replaceAll(" ", "-");
  };

  const updateApplicationStatus = async (
    applicationId,
    status
  ) => {
    try {
      setUpdatingId(applicationId);
      setErrorMessage("");

      const response = await fetch(
        `/api/applications/${applicationId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update application status."
        );
      }

      setApplications(
        (currentApplicationsList) =>
          currentApplicationsList.map(
            (application) =>
              application._id ===
              applicationId
                ? {
                    ...application,
                    status:
                      data.application
                        .status,
                  }
                : application
          )
      );

      setSuccessMessage(
        "Application status updated successfully."
      );
    } catch (error) {
      console.error(
        "Update application status:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to update application status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const escapeCsvValue = (value) => {
    const stringValue = String(
      value ?? ""
    );

    return `"${stringValue.replaceAll(
      '"',
      '""'
    )}"`;
  };

  const exportApplications = () => {
    if (
      filteredApplications.length === 0
    ) {
      setErrorMessage(
        "There are no applications to export."
      );
      return;
    }

    const headers = [
      "Candidate Name",
      "Email",
      "Phone",
      "Current Location",
      "Job Title",
      "Department",
      "Total Experience",
      "Relevant Experience",
      "Current Company",
      "Notice Period",
      "Status",
      "Applied Date",
    ];

    const rows = filteredApplications.map(
      (application) => [
        application.fullName,
        application.email,
        application.phone,
        application.currentLocation,
        application.jobId?.jobTitle ||
          "Deleted job",
        application.jobId?.department || "",
        application.totalExperience,
        application.relevantExperience,
        application.currentCompany,
        application.noticePeriod,
        application.status,
        formatDate(application.createdAt),
      ]
    );

    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(",")
      ),
    ].join("\n");

    const csvBlob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const downloadUrl =
      URL.createObjectURL(csvBlob);

    const downloadLink =
      document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = `career-applications-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;

    document.body.appendChild(
      downloadLink
    );

    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(downloadUrl);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setJobFilter("");
  };

  const actions = (
    <button
      type="button"
      className="careers-admin-primary-button"
      onClick={exportApplications}
    >
      <LuDownload
        size={18}
        aria-hidden="true"
      />

      Export CSV
    </button>
  );

  return (
    <CareersAdminLayout
      title="Applicants"
      description="Review candidates and manage application statuses."
      actions={actions}
    >
      {successMessage && (
        <div className="careers-applicants-success">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="careers-applicants-error">
          {errorMessage}
        </div>
      )}

      <section className="careers-applicants-summary">
        <article>
          <p>Total Applicants</p>
          <h2>{applications.length}</h2>
        </article>

        <article>
          <p>New</p>
          <h2>
            {
              applications.filter(
                (application) =>
                  application.status ===
                  "New"
              ).length
            }
          </h2>
        </article>

        <article>
          <p>Shortlisted</p>
          <h2>
            {
              applications.filter(
                (application) =>
                  application.status ===
                  "Shortlisted"
              ).length
            }
          </h2>
        </article>

        <article>
          <p>Selected</p>
          <h2>
            {
              applications.filter(
                (application) =>
                  application.status ===
                  "Selected"
              ).length
            }
          </h2>
        </article>
      </section>

      <section className="careers-applicants-panel">
        <div className="careers-applicants-filters">
          <div className="careers-applicants-search">
            <LuSearch
              size={18}
              aria-hidden="true"
            />

            <input
              type="search"
              placeholder="Search applicants"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Statuses
            </option>

            {applicationStatuses.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              )
            )}
          </select>

          <select
            value={jobFilter}
            onChange={(event) =>
              setJobFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Jobs
            </option>

            {jobs.map((job) => (
              <option
                key={job.id}
                value={job.id}
              >
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="careers-applicants-empty">
            Loading applications...
          </div>
        ) : currentApplications.length ===
          0 ? (
          <div className="careers-applicants-empty">
            <h3>No Applications Found</h3>

            <p>
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="careers-applicants-table-wrapper">
            <table className="careers-applicants-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Experience</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Resume</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {currentApplications.map(
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

                        <small>
                          {application.phone}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {application.jobId
                            ?.jobTitle ||
                            "Deleted job"}
                        </strong>

                        <small>
                          {application.jobId
                            ?.department || ""}
                        </small>
                      </td>

                      <td>
                        {
                          application.totalExperience
                        }
                      </td>

                      <td>
                        {formatDate(
                          application.createdAt
                        )}
                      </td>

                      <td>
                        <select
                          className={`careers-applicant-status-select status-${getStatusClass(
                            application.status
                          )}`}
                          value={
                            application.status
                          }
                          onChange={(event) =>
                            updateApplicationStatus(
                              application._id,
                              event.target.value
                            )
                          }
                          disabled={
                            updatingId ===
                            application._id
                          }
                        >
                          {applicationStatuses.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td>
                        <a
                          href={`/api/applications/${application._id}/resume`}
                          className="careers-applicant-resume"
                          target="_blank"
                          rel="noreferrer"
                          title={
                            application.resumeFileName
                          }
                        >
                          <LuFileText
                            size={17}
                            aria-hidden="true"
                          />

                          Resume
                        </a>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="careers-applicant-view"
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

        {!loading &&
          filteredApplications.length >
            0 && (
            <div className="careers-applicants-pagination">
              <p>
                Showing {startIndex + 1}–
                {Math.min(
                  startIndex +
                    applicationsPerPage,
                  filteredApplications.length
                )}{" "}
                of{" "}
                {
                  filteredApplications.length
                }
              </p>

              <div>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(page - 1, 1)
                    )
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          page + 1,
                          totalPages
                        )
                    )
                  }
                  disabled={
                    currentPage === totalPages
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </section>
    </CareersAdminLayout>
  );
}

export default Applicants;
