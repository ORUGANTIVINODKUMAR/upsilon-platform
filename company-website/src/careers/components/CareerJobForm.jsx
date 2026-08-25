import "./CareerJobForm.css";

function CareerJobForm({
  formData,
  onChange,
  onSubmit,
  submitting,
  submitLabel,
  onCancel,
  errorMessage,
}) {
  return (
    <form
      className="career-admin-job-form"
      onSubmit={onSubmit}
    >
      {errorMessage && (
        <div className="career-admin-form-error">
          {errorMessage}
        </div>
      )}

      <section className="career-admin-form-section">
        <h2>Basic Job Information</h2>

        <div className="career-admin-form-grid">
          <div className="career-admin-form-field">
            <label htmlFor="jobTitle">
              Job Title <span>*</span>
            </label>

            <input
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={onChange}
              placeholder="Example: Senior Tax Associate"
              required
            />
          </div>

          <div className="career-admin-form-field">
            <label htmlFor="department">
              Department <span>*</span>
            </label>

            <input
              id="department"
              name="department"
              value={formData.department}
              onChange={onChange}
              placeholder="Example: Tax"
              required
            />
          </div>

          <div className="career-admin-form-field">
            <label htmlFor="location">
              Location <span>*</span>
            </label>

            <input
              id="location"
              name="location"
              value={formData.location}
              onChange={onChange}
              placeholder="Example: Hyderabad"
              required
            />
          </div>

          <div className="career-admin-form-field">
            <label htmlFor="employmentType">
              Employment Type <span>*</span>
            </label>

            <select
              id="employmentType"
              name="employmentType"
              value={formData.employmentType}
              onChange={onChange}
              required
            >
              <option value="">
                Select employment type
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

          <div className="career-admin-form-field">
            <label htmlFor="experience">
              Experience Required <span>*</span>
            </label>

            <input
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={onChange}
              placeholder="Example: 2–4 years"
              required
            />
          </div>

          <div className="career-admin-form-field">
            <label htmlFor="workMode">
              Work Mode <span>*</span>
            </label>

            <select
              id="workMode"
              name="workMode"
              value={formData.workMode}
              onChange={onChange}
              required
            >
              <option value="">
                Select work mode
              </option>

              <option value="Onsite">
                Onsite
              </option>

              <option value="Remote">
                Remote
              </option>

              <option value="Hybrid">
                Hybrid
              </option>
            </select>
          </div>

          <div className="career-admin-form-field">
            <label htmlFor="education">
              Education Qualification{" "}
              <span>*</span>
            </label>

            <select
              id="education"
              name="education"
              value={formData.education}
              onChange={onChange}
              required
            >
              <option value="">
                Select qualification
              </option>

              <option value="Degree">
                Degree
              </option>

              <option value="MBA">
                MBA
              </option>
              <option value="MCA">
                MCA
              </option>

              <option value="Degree or MBA">
                Degree or MBA
              </option>
            </select>
          </div>

          <div className="career-admin-form-field">
            <label htmlFor="numberOfOpenings">
              Number of Openings <span>*</span>
            </label>

            <input
              id="numberOfOpenings"
              type="number"
              name="numberOfOpenings"
              value={formData.numberOfOpenings}
              onChange={onChange}
              min="1"
              required
            />
          </div>

          <div className="career-admin-form-field">
            <label htmlFor="salaryRange">
              Salary Range
            </label>

            <input
              id="salaryRange"
              name="salaryRange"
              value={formData.salaryRange}
              onChange={onChange}
              placeholder="Example: ₹5–7 LPA"
            />
          </div>

          <div className="career-admin-form-field">
            <label htmlFor="applicationDeadline">
              Application Deadline <span>*</span>
            </label>

            <input
              id="applicationDeadline"
              type="date"
              name="applicationDeadline"
              value={formData.applicationDeadline}
              onChange={onChange}
              required
            />
          </div>

          <div className="career-admin-form-field">
            <label htmlFor="jobStatus">
              Job Status <span>*</span>
            </label>

            <select
              id="jobStatus"
              name="jobStatus"
              value={formData.jobStatus}
              onChange={onChange}
              required
            >
              <option value="Draft">
                Draft
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Closed">
                Closed
              </option>
            </select>
          </div>

          <div className="career-admin-form-field">
            <label htmlFor="noticePeriod">
              Preferred Notice Period{" "}
              <span>*</span>
            </label>

            <input
              id="noticePeriod"
              name="noticePeriod"
              value={formData.noticePeriod}
              onChange={onChange}
              placeholder="Example: Immediate to 30 days"
              required
            />
          </div>
        </div>
      </section>

      <section className="career-admin-form-section">
        <h2>Job Description</h2>

        <div className="career-admin-form-field">
          <label htmlFor="shortDescription">
            Short Description <span>*</span>
          </label>

          <textarea
            id="shortDescription"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={onChange}
            rows="4"
            placeholder="Provide a short summary of the position."
            required
          />
        </div>

        <div className="career-admin-form-field">
          <label htmlFor="responsibilities">
            Roles and Responsibilities{" "}
            <span>*</span>
          </label>

          <textarea
            id="responsibilities"
            name="responsibilities"
            value={formData.responsibilities}
            onChange={onChange}
            rows="8"
            placeholder="Enter each responsibility on a new line."
            required
          />
        </div>

        <div className="career-admin-form-field">
          <label htmlFor="requiredSkills">
            Required Skills <span>*</span>
          </label>

          <textarea
            id="requiredSkills"
            name="requiredSkills"
            value={formData.requiredSkills}
            onChange={onChange}
            rows="6"
            placeholder="Enter each required skill on a new line."
            required
          />
        </div>
      </section>

      <div className="career-admin-form-actions">
        <button
          type="button"
          className="career-admin-form-cancel"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="career-admin-form-submit"
          disabled={submitting}
        >
          {submitting
            ? "Saving..."
            : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default CareerJobForm;