import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  LuArrowLeft,
  LuMapPin,
  LuBriefcaseBusiness,
  LuClock,
  LuBuilding2,
  LuUsers,
  LuCalendarDays,
  LuIndianRupee,
} from "react-icons/lu";

import "./JobDetails.css";

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `/api/jobs/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load job details."
          );
        }

        setJob(data.job);
      } catch (error) {
        console.error(
          "Fetch job details error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to load job details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not specified";
    }

    return new Date(dateValue).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  if (loading) {
    return (
      <div className="career-job-details-state">
        Loading job details...
      </div>
    );
  }

  if (errorMessage || !job) {
    return (
      <div className="career-job-details-state">
        <h1>Unable to Load Job</h1>

        <p>
          {errorMessage || "Job not found."}
        </p>

        <button
          type="button"
          onClick={() => navigate("/careers")}
        >
          Back to Careers
        </button>
      </div>
    );
  }

  return (
    <div className="career-job-details-page">
      <section className="career-job-details-hero">
        <div className="career-job-details-container">
          <button
            type="button"
            className="career-job-back-button"
            onClick={() => navigate("/careers")}
          >
            <LuArrowLeft
              size={18}
              aria-hidden="true"
            />
            Back to Careers
          </button>

          <p className="career-job-eyebrow">
            {job.department}
          </p>

          <h1>{job.jobTitle}</h1>

          <div className="career-job-hero-meta">
            <span>
              <LuMapPin
                size={18}
                aria-hidden="true"
              />
              {job.location}
            </span>

            <span>
              <LuBriefcaseBusiness
                size={18}
                aria-hidden="true"
              />
              {job.employmentType}
            </span>

            <span>
              <LuBuilding2
                size={18}
                aria-hidden="true"
              />
              {job.workMode}
            </span>

            <span>
              <LuClock
                size={18}
                aria-hidden="true"
              />
              {job.experience}
            </span>
          </div>
        </div>
      </section>

      <section className="career-job-details-content">
        <div className="career-job-details-container career-job-details-layout">
          <main className="career-job-details-main">
            <article className="career-job-details-card">
              <h2>Job Description</h2>

              <p>{job.shortDescription}</p>
            </article>

            <article className="career-job-details-card">
              <h2>
                Roles and Responsibilities
              </h2>

              <div className="career-job-preformatted-text">
                {job.responsibilities}
              </div>
            </article>

            <article className="career-job-details-card">
              <h2>Required Skills</h2>

              <div className="career-job-preformatted-text">
                {job.requiredSkills}
              </div>
            </article>

            <article className="career-job-details-card">
              <h2>Education</h2>

              <p>{job.education}</p>
            </article>
          </main>

          <aside className="career-job-details-sidebar">
            <div className="career-job-summary-card">
              <h2>Job Overview</h2>

              <div className="career-job-summary-item">
                <LuBuilding2
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <span>Department</span>
                  <strong>
                    {job.department}
                  </strong>
                </div>
              </div>

              <div className="career-job-summary-item">
                <LuMapPin
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <span>Location</span>
                  <strong>{job.location}</strong>
                </div>
              </div>

              <div className="career-job-summary-item">
                <LuBriefcaseBusiness
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <span>Employment</span>
                  <strong>
                    {job.employmentType}
                  </strong>
                </div>
              </div>

              <div className="career-job-summary-item">
                <LuClock
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <span>Experience</span>
                  <strong>
                    {job.experience}
                  </strong>
                </div>
              </div>

              <div className="career-job-summary-item">
                <LuUsers
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <span>Openings</span>
                  <strong>
                    {job.numberOfOpenings}
                  </strong>
                </div>
              </div>

              <div className="career-job-summary-item">
                <LuIndianRupee
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <span>Salary</span>
                  <strong>
                    {job.salaryRange ||
                      "Not disclosed"}
                  </strong>
                </div>
              </div>

              <div className="career-job-summary-item">
                <LuCalendarDays
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <span>Apply Before</span>
                  <strong>
                    {formatDate(
                      job.applicationDeadline
                    )}
                  </strong>
                </div>
              </div>

              <div className="career-job-summary-item">
                <LuClock
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <span>Notice Period</span>
                  <strong>
                    {job.noticePeriod}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="career-job-apply-button"
                onClick={() =>
                  navigate(
                    `/careers/job/${job._id}/apply`
                  )
                }
              >
                Apply for This Position
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default JobDetails;