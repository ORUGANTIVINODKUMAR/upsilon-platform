import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ApplicantDetails.css";

function DetailItem({ label, value }) {
  return (
    <div className="applicant-detail-item">
      <strong>{label}</strong>
      <p>{value || "—"}</p>
    </div>
  );
}

export default function ApplicantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchApplication = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/applications/${id}`, {
          credentials: "include",
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load applicant details."
          );
        }

        setApplication(data.application);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          console.error("Applicant details error:", requestError);
          setError(requestError.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchApplication();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="applicant-details-message">
        Loading applicant details...
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="applicant-details-error">
        <p>{error || "Applicant not found."}</p>

        <button
          type="button"
          onClick={() => navigate("/admin/careers/applicants")}
        >
          Back to Applicants
        </button>
      </div>
    );
  }

  const hasResume = Boolean(application.resumePath);

  const appliedDate = application.createdAt
    ? new Date(application.createdAt).toLocaleString()
    : "—";

  return (
    <div className="applicant-details-page">
      <div className="applicant-details-topbar">
        <button
          type="button"
          className="applicant-back-button"
          onClick={() => navigate("/admin/careers/applicants")}
        >
          ← Back to Applicants
        </button>

        <span
          className={`applicant-status applicant-status-${String(
            application.status || "new"
          )
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
        >
          {application.status || "New"}
        </span>
      </div>

      <div className="applicant-details-header">
        <p>RECRUITMENT</p>
        <h1>{application.fullName}</h1>

        <span>
          Applied for{" "}
          <strong>
            {application.jobId?.jobTitle || "Unavailable position"}
          </strong>
        </span>
      </div>

      <section className="applicant-details-section">
        <h2>Personal Information</h2>

        <div className="applicant-details-grid">
          <DetailItem
            label="Full Name"
            value={application.fullName}
          />

          <DetailItem
            label="Email Address"
            value={application.email}
          />

          <DetailItem
            label="Phone Number"
            value={application.phone}
          />

          <DetailItem
            label="Current Location"
            value={application.currentLocation}
          />

          <DetailItem
            label="Applied On"
            value={appliedDate}
          />

          <DetailItem
            label="Application Status"
            value={application.status}
          />
        </div>
      </section>

      <section className="applicant-details-section">
        <h2>Professional Information</h2>

        <div className="applicant-details-grid">
          <DetailItem
            label="Total Experience"
            value={application.totalExperience}
          />

          <DetailItem
            label="Relevant Experience"
            value={application.relevantExperience}
          />

          <DetailItem
            label="Current Company"
            value={application.currentCompany}
          />

          <DetailItem
            label="Current Salary"
            value={application.currentSalary}
          />

          <DetailItem
            label="Expected Salary"
            value={application.expectedSalary}
          />

          <DetailItem
            label="Notice Period"
            value={application.noticePeriod}
          />
        </div>
      </section>

      <section className="applicant-details-section">
        <h2>Job Information</h2>

        <div className="applicant-details-grid">
          <DetailItem
            label="Job Title"
            value={application.jobId?.jobTitle}
          />

          <DetailItem
            label="Department"
            value={application.jobId?.department}
          />

          <DetailItem
            label="Job Location"
            value={application.jobId?.location}
          />

          <DetailItem
            label="Employment Type"
            value={application.jobId?.employmentType}
          />

          <DetailItem
            label="Work Mode"
            value={application.jobId?.workMode}
          />

          <DetailItem
            label="Experience Required"
            value={application.jobId?.experience}
          />

          <DetailItem
            label="Salary Range"
            value={application.jobId?.salaryRange}
          />
        </div>
      </section>

      <section className="applicant-details-section">
        <h2>Professional Links</h2>

        <div className="applicant-links">
          {application.linkedinUrl ? (
            <a
              href={application.linkedinUrl}
              target="_blank"
              rel="noreferrer"
            >
              View LinkedIn Profile
            </a>
          ) : (
            <span>LinkedIn profile not provided</span>
          )}

          {application.portfolioUrl ? (
            <a
              href={application.portfolioUrl}
              target="_blank"
              rel="noreferrer"
            >
              View Portfolio
            </a>
          ) : (
            <span>Portfolio not provided</span>
          )}
        </div>
      </section>

      <section className="applicant-details-section">
        <h2>Cover Letter</h2>

        <div className="applicant-long-text">
          {application.coverLetter ||
            "No cover letter was provided."}
        </div>
      </section>

      <section className="applicant-details-section">
        <h2>Additional Notes</h2>

        <div className="applicant-long-text">
          {application.additionalNotes ||
            "No additional notes were provided."}
        </div>
      </section>

      <section className="applicant-details-section">
        <h2>Resume</h2>

        {hasResume ? (
          <a
            className="applicant-resume-button"
            href={`/api/applications/${application._id}/resume`}
            target="_blank"
            rel="noreferrer"
          >
            View or Download Resume
          </a>
        ) : (
          <p className="applicant-no-resume">
            Resume is not available.
          </p>
        )}
      </section>
    </div>
  );
}
