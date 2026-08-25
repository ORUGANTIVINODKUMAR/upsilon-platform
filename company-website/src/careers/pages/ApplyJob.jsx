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
  LuUpload,
} from "react-icons/lu";

import "./ApplyJob.css";

const initialFormData = {
  fullName: "",
  email: "",
  phone: "",
  currentLocation: "",
  totalExperience: "",
  relevantExperience: "",
  currentCompany: "",
  currentSalary: "",
  expectedSalary: "",
  noticePeriod: "",
  linkedinUrl: "",
  portfolioUrl: "",
  coverLetter: "",
  additionalNotes: "",
};

function ApplyJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [formData, setFormData] = useState(
    initialFormData
  );

  const [resume, setResume] = useState(null);

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
              "Unable to load the job."
          );
        }

        setJob(data.job);
      } catch (error) {
        console.error(
          "Fetch application job error:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to load the job."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleResumeChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      setResume(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
      !allowedTypes.includes(selectedFile.type)
    ) {
      setErrorMessage(
        "Please upload only a PDF, DOC or DOCX resume."
      );

      event.target.value = "";
      setResume(null);
      return;
    }

    if (
      selectedFile.size >
      5 * 1024 * 1024
    ) {
      setErrorMessage(
        "Resume size must be 5 MB or less."
      );

      event.target.value = "";
      setResume(null);
      return;
    }

    setErrorMessage("");
    setResume(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!resume) {
      setErrorMessage(
        "Please upload your resume."
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const applicationData = new FormData();

      Object.entries(formData).forEach(
        ([key, value]) => {
          applicationData.append(key, value);
        }
      );

      applicationData.append("jobId", id);
      applicationData.append(
        "resume",
        resume
      );

      const response = await fetch(
        "/api/applications",
        {
          method: "POST",
          body: applicationData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to submit the application."
        );
      }

      setSuccessMessage(
        "Your application was submitted successfully."
      );

      setFormData(initialFormData);
      setResume(null);

      const resumeInput =
        document.getElementById(
          "career-resume"
        );

      if (resumeInput) {
        resumeInput.value = "";
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Submit Career application error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to submit the application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="career-apply-state">
        Loading application form...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="career-apply-state">
        <h1>Unable to Apply</h1>

        <p>
          {errorMessage ||
            "The selected job was not found."}
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
    <div className="career-apply-page">
      <section className="career-apply-hero">
        <div className="career-apply-container">
          <button
            type="button"
            className="career-apply-back-button"
            onClick={() =>
              navigate(`/careers/job/${id}`)
            }
          >
            <LuArrowLeft
              size={18}
              aria-hidden="true"
            />
            Back to Job Details
          </button>

          <p>APPLY FOR THIS POSITION</p>

          <h1>{job.jobTitle}</h1>

          <div className="career-apply-job-meta">
            <span>{job.department}</span>
            <span>{job.location}</span>
            <span>{job.employmentType}</span>
          </div>
        </div>
      </section>

      <section className="career-apply-section">
        <div className="career-apply-container">
          <div className="career-apply-heading">
            <p>CAREER APPLICATION</p>

            <h2>Submit Your Application</h2>

            <span>
              Fields marked with an asterisk (*) are
              required.
            </span>
          </div>

          {successMessage && (
            <div className="career-apply-success">
              <h3>Application Submitted</h3>

              <p>{successMessage}</p>

              <button
                type="button"
                onClick={() =>
                  navigate("/careers")
                }
              >
                Return to Careers
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="career-apply-error">
              {errorMessage}
            </div>
          )}

          {!successMessage && (
            <form
              className="career-apply-form"
              onSubmit={handleSubmit}
            >
              <div className="career-apply-form-section">
                <h3>Personal Information</h3>

                <div className="career-apply-fields-grid">
                  <div className="career-apply-field">
                    <label htmlFor="fullName">
                      Full Name <span>*</span>
                    </label>

                    <input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="career-apply-field">
                    <label htmlFor="email">
                      Email Address <span>*</span>
                    </label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="career-apply-field">
                    <label htmlFor="phone">
                      Phone Number <span>*</span>
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      required
                    />
                  </div>

                  <div className="career-apply-field">
                    <label htmlFor="currentLocation">
                      Current Location <span>*</span>
                    </label>

                    <input
                      id="currentLocation"
                      name="currentLocation"
                      value={
                        formData.currentLocation
                      }
                      onChange={handleChange}
                      autoComplete="address-level2"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="career-apply-form-section">
                <h3>Professional Information</h3>

                <div className="career-apply-fields-grid">
                  <div className="career-apply-field">
                    <label htmlFor="totalExperience">
                      Total Experience <span>*</span>
                    </label>

                    <input
                      id="totalExperience"
                      name="totalExperience"
                      value={
                        formData.totalExperience
                      }
                      onChange={handleChange}
                      placeholder="Example: 3 years"
                      required
                    />
                  </div>

                  <div className="career-apply-field">
                    <label htmlFor="relevantExperience">
                      Relevant Experience
                    </label>

                    <input
                      id="relevantExperience"
                      name="relevantExperience"
                      value={
                        formData.relevantExperience
                      }
                      onChange={handleChange}
                      placeholder="Example: 2 years"
                    />
                  </div>

                  <div className="career-apply-field">
                    <label htmlFor="currentCompany">
                      Current Company
                    </label>

                    <input
                      id="currentCompany"
                      name="currentCompany"
                      value={
                        formData.currentCompany
                      }
                      onChange={handleChange}
                    />
                  </div>

                  <div className="career-apply-field">
                    <label htmlFor="noticePeriod">
                      Notice Period <span>*</span>
                    </label>

                    <input
                      id="noticePeriod"
                      name="noticePeriod"
                      value={formData.noticePeriod}
                      onChange={handleChange}
                      placeholder="Example: 30 days"
                      required
                    />
                  </div>

                  <div className="career-apply-field">
                    <label htmlFor="currentSalary">
                      Current Salary
                    </label>

                    <input
                      id="currentSalary"
                      name="currentSalary"
                      value={
                        formData.currentSalary
                      }
                      onChange={handleChange}
                    />
                  </div>

                  <div className="career-apply-field">
                    <label htmlFor="expectedSalary">
                      Expected Salary
                    </label>

                    <input
                      id="expectedSalary"
                      name="expectedSalary"
                      value={
                        formData.expectedSalary
                      }
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="career-apply-form-section">
                <h3>Professional Links</h3>

                <div className="career-apply-fields-grid">
                  <div className="career-apply-field">
                    <label htmlFor="linkedinUrl">
                      LinkedIn Profile
                    </label>

                    <input
                      id="linkedinUrl"
                      type="url"
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div className="career-apply-field">
                    <label htmlFor="portfolioUrl">
                      Portfolio or Website
                    </label>

                    <input
                      id="portfolioUrl"
                      type="url"
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div className="career-apply-form-section">
                <h3>Resume and Additional Details</h3>

                <div className="career-apply-field career-apply-full-width">
                  <label htmlFor="career-resume">
                    Resume <span>*</span>
                  </label>

                  <label
                    htmlFor="career-resume"
                    className="career-resume-upload"
                  >
                    <LuUpload
                      size={27}
                      aria-hidden="true"
                    />

                    <strong>
                      {resume
                        ? resume.name
                        : "Choose your resume"}
                    </strong>

                    <small>
                      PDF, DOC or DOCX — maximum 5 MB
                    </small>
                  </label>

                  <input
                    id="career-resume"
                    className="career-resume-input"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeChange}
                    required
                  />
                </div>

                <div className="career-apply-field career-apply-full-width">
                  <label htmlFor="coverLetter">
                    Cover Letter
                  </label>

                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Tell us why you are interested in this opportunity."
                  />
                </div>

                <div className="career-apply-field career-apply-full-width">
                  <label htmlFor="additionalNotes">
                    Additional Notes
                  </label>

                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    value={
                      formData.additionalNotes
                    }
                    onChange={handleChange}
                    rows="4"
                  />
                </div>
              </div>

              <div className="career-apply-submit-row">
                <button
                  type="button"
                  className="career-apply-cancel"
                  onClick={() =>
                    navigate(
                      `/careers/job/${id}`
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="career-apply-submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Application"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

export default ApplyJob;