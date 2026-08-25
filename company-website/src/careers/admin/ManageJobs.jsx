import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LuCirclePlus,
  LuPencil,
  LuTrash2,
  LuSearch,
} from "react-icons/lu";

import CareersAdminLayout from "../components/CareersAdminLayout";

import "./ManageJobs.css";

function ManageJobs() {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState(
      location.state?.message || ""
    );

  const [deletingId, setDeletingId] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [
    employmentFilter,
    setEmploymentFilter,
  ] = useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const jobsPerPage = 10;

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        "/api/jobs/admin/all",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to fetch jobs."
        );
      }

      setJobs(data.jobs || []);
    } catch (error) {
      console.error(
        "Fetch Careers jobs error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to fetch jobs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    departmentFilter,
    statusFilter,
    employmentFilter,
  ]);

  const departments = useMemo(() => {
    return [
      ...new Set(
        jobs
          .map((job) => job.department)
          .filter(Boolean)
      ),
    ];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const searchValue = searchTerm
      .trim()
      .toLowerCase();

    return jobs.filter((job) => {
      const searchableText = [
        job.jobTitle,
        job.department,
        job.location,
        job.employmentType,
        job.experience,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue ||
        searchableText.includes(searchValue);

      const matchesDepartment =
        !departmentFilter ||
        job.department === departmentFilter;

      const matchesStatus =
        !statusFilter ||
        job.jobStatus === statusFilter;

      const matchesEmployment =
        !employmentFilter ||
        job.employmentType ===
          employmentFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus &&
        matchesEmployment
      );
    });
  }, [
    jobs,
    searchTerm,
    departmentFilter,
    statusFilter,
    employmentFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredJobs.length / jobsPerPage
    )
  );

  const startIndex =
    (currentPage - 1) * jobsPerPage;

  const currentJobs = filteredJobs.slice(
    startIndex,
    startIndex + jobsPerPage
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

  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setStatusFilter("");
    setEmploymentFilter("");
  };

  const handleDelete = async (jobId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(jobId);
      setErrorMessage("");

      const response = await fetch(
        `/api/jobs/${jobId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete the job."
        );
      }

      setJobs((currentJobsList) =>
        currentJobsList.filter(
          (job) => job._id !== jobId
        )
      );

      setSuccessMessage(
        "Job deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete Careers job error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to delete the job."
      );
    } finally {
      setDeletingId("");
    }
  };

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
      title="Manage Jobs"
      description="Search, edit and manage all job openings."
      actions={actions}
    >
      {successMessage && (
        <div className="careers-manage-success">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="careers-manage-error">
          {errorMessage}
        </div>
      )}

      <section className="careers-manage-summary">
        <article>
          <p>Total Jobs</p>
          <h2>{jobs.length}</h2>
        </article>

        <article>
          <p>Active</p>
          <h2>
            {
              jobs.filter(
                (job) =>
                  job.jobStatus === "Active"
              ).length
            }
          </h2>
        </article>

        <article>
          <p>Draft</p>
          <h2>
            {
              jobs.filter(
                (job) =>
                  job.jobStatus === "Draft"
              ).length
            }
          </h2>
        </article>

        <article>
          <p>Closed</p>
          <h2>
            {
              jobs.filter(
                (job) =>
                  job.jobStatus === "Closed"
              ).length
            }
          </h2>
        </article>
      </section>

      <section className="careers-manage-panel">
        <div className="careers-manage-filters">
          <div className="careers-manage-search">
            <LuSearch
              size={18}
              aria-hidden="true"
            />

            <input
              type="search"
              placeholder="Search jobs"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Departments
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              )
            )}
          </select>

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

            <option value="Active">
              Active
            </option>

            <option value="Draft">
              Draft
            </option>

            <option value="Closed">
              Closed
            </option>
          </select>

          <select
            value={employmentFilter}
            onChange={(event) =>
              setEmploymentFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Employment Types
            </option>

            <option value="Full Time">
              Full Time
            </option>

            <option value="Part Time">
              Part Time
            </option>

            <option value="Internship">
              Internship
            </option>

            <option value="Contract">
              Contract
            </option>

            <option value="Freelance">
              Freelance
            </option>
          </select>
        </div>

        {loading ? (
          <div className="careers-manage-empty">
            Loading jobs...
          </div>
        ) : currentJobs.length === 0 ? (
          <div className="careers-manage-empty">
            <h3>No Jobs Found</h3>

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
          <div className="careers-manage-table-wrapper">
            <table className="careers-manage-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Location</th>
                  <th>Employment</th>
                  <th>Openings</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {currentJobs.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <strong>
                        {job.jobTitle}
                      </strong>

                      <small>
                        {job.department}
                      </small>
                    </td>

                    <td>{job.location}</td>

                    <td>
                      {job.employmentType}
                    </td>

                    <td>
                      {job.numberOfOpenings}
                    </td>

                    <td>
                      <span
                        className={`careers-job-status job-status-${job.jobStatus.toLowerCase()}`}
                      >
                        {job.jobStatus}
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        job.applicationDeadline
                      )}
                    </td>

                    <td>
                      <div className="careers-manage-actions">
                        <button
                          type="button"
                          className="careers-manage-edit"
                          onClick={() =>
                            navigate(
                              `/admin/careers/edit-job/${job._id}`
                            )
                          }
                          aria-label={`Edit ${job.jobTitle}`}
                        >
                          <LuPencil
                            size={16}
                            aria-hidden="true"
                          />
                        </button>

                        <button
                          type="button"
                          className="careers-manage-delete"
                          onClick={() =>
                            handleDelete(job._id)
                          }
                          disabled={
                            deletingId === job._id
                          }
                          aria-label={`Delete ${job.jobTitle}`}
                        >
                          <LuTrash2
                            size={16}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading &&
          filteredJobs.length > 0 && (
            <div className="careers-manage-pagination">
              <p>
                Showing {startIndex + 1}–
                {Math.min(
                  startIndex + jobsPerPage,
                  filteredJobs.length
                )}{" "}
                of {filteredJobs.length}
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

export default ManageJobs;