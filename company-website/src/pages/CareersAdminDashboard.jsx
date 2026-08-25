import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";

import "./CareersAdmin.css";

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const STATUSES = ["draft", "published", "closed"];

const EMPTY_FORM = {
  title: "",
  department: "",
  location: "",
  employmentType: "Full-time",
  description: "",
  responsibilities: "",
  requirements: "",
  applyEmail: "",
  applyLink: "",
  status: "draft",
};

async function parseJsonResponse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function CareersAdminDashboard() {
  usePageMeta({
    title: "Careers Admin Dashboard",
    path: "/careers-admin",
    noIndex: true,
  });

  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadJobs = async () => {
    setLoadStatus("loading");

    try {
      const response = await fetch("/api/careers-admin/jobs", {
        credentials: "include",
      });

      if (response.status === 401) {
        navigate("/careers-admin/login", { replace: true });
        return;
      }

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load job postings.");
      }

      setJobs(data.jobs || []);
      setLoadStatus("ready");
    } catch (error) {
      setLoadError(error.message || "Unable to load job postings.");
      setLoadStatus("error");
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    setEditingJobId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (job) => {
    setEditingJobId(job._id);
    setForm({
      title: job.title || "",
      department: job.department || "",
      location: job.location || "",
      employmentType: job.employmentType || "Full-time",
      description: job.description || "",
      responsibilities: (job.responsibilities || []).join("\n"),
      requirements: (job.requirements || []).join("\n"),
      applyEmail: job.applyEmail || "",
      applyLink: job.applyLink || "",
      status: job.status || "draft",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const updateField = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const isEditing = Boolean(editingJobId);
    const url = isEditing
      ? `/api/careers-admin/jobs/${editingJobId}`
      : "/api/careers-admin/jobs";

    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save job posting.");
      }

      setIsModalOpen(false);
      await loadJobs();
    } catch (error) {
      setFormError(error.message || "Unable to save job posting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/careers-admin/jobs/${job._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete job posting.");
      }

      await loadJobs();
    } catch (error) {
      window.alert(error.message || "Unable to delete job posting.");
    }
  };

  const handleStatusChange = async (job, status) => {
    try {
      const response = await fetch(`/api/careers-admin/jobs/${job._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update status.");
      }

      await loadJobs();
    } catch (error) {
      window.alert(error.message || "Unable to update status.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/careers-admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      navigate("/careers-admin/login", { replace: true });
    }
  };

  return (
    <section className="careers-admin-dashboard">
      <div className="careers-admin-container">
        <div className="careers-admin-header">
          <div>
            <h1>Job Postings</h1>
            <p>Create, edit, publish, and close roles shown on /careers.</p>
          </div>

          <div className="careers-admin-header-actions">
            <button
              type="button"
              className="careers-admin-btn"
              onClick={openCreateModal}
            >
              + New Job
            </button>

            <button
              type="button"
              className="careers-admin-btn careers-admin-btn-outline"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </div>

        {loadStatus === "loading" && (
          <div className="careers-admin-empty">Loading job postings...</div>
        )}

        {loadStatus === "error" && (
          <div className="careers-admin-empty">{loadError}</div>
        )}

        {loadStatus === "ready" && jobs.length === 0 && (
          <div className="careers-admin-empty">
            No job postings yet. Click "New Job" to create one.
          </div>
        )}

        {loadStatus === "ready" && jobs.length > 0 && (
          <div className="careers-admin-table-wrap">
            <table className="careers-admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td>{job.title}</td>
                    <td>{job.department || "—"}</td>
                    <td>{job.location || "—"}</td>
                    <td>
                      <span className={`careers-admin-status ${job.status}`}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <div className="careers-admin-row-actions">
                        <button type="button" onClick={() => openEditModal(job)}>
                          Edit
                        </button>

                        {job.status !== "published" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(job, "published")
                            }
                          >
                            Publish
                          </button>
                        )}

                        {job.status === "published" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(job, "closed")}
                          >
                            Close
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(job)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="careers-admin-modal-overlay" onClick={closeModal}>
          <form
            className="careers-admin-modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <h2>{editingJobId ? "Edit Job Posting" : "New Job Posting"}</h2>

            <div className="careers-admin-field">
              <label htmlFor="job-title">Title</label>
              <input
                id="job-title"
                type="text"
                value={form.title}
                onChange={updateField("title")}
                required
              />
            </div>

            <div className="careers-admin-field-row">
              <div className="careers-admin-field">
                <label htmlFor="job-department">Department</label>
                <input
                  id="job-department"
                  type="text"
                  value={form.department}
                  onChange={updateField("department")}
                />
              </div>

              <div className="careers-admin-field">
                <label htmlFor="job-location">Location</label>
                <input
                  id="job-location"
                  type="text"
                  value={form.location}
                  onChange={updateField("location")}
                />
              </div>
            </div>

            <div className="careers-admin-field-row">
              <div className="careers-admin-field">
                <label htmlFor="job-employment-type">Employment Type</label>
                <select
                  id="job-employment-type"
                  value={form.employmentType}
                  onChange={updateField("employmentType")}
                >
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="careers-admin-field">
                <label htmlFor="job-status">Status</label>
                <select
                  id="job-status"
                  value={form.status}
                  onChange={updateField("status")}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="careers-admin-field">
              <label htmlFor="job-description">Description</label>
              <textarea
                id="job-description"
                value={form.description}
                onChange={updateField("description")}
                required
              />
            </div>

            <div className="careers-admin-field">
              <label htmlFor="job-responsibilities">Responsibilities</label>
              <textarea
                id="job-responsibilities"
                value={form.responsibilities}
                onChange={updateField("responsibilities")}
              />
              <span className="careers-admin-field-hint">
                One item per line.
              </span>
            </div>

            <div className="careers-admin-field">
              <label htmlFor="job-requirements">Requirements</label>
              <textarea
                id="job-requirements"
                value={form.requirements}
                onChange={updateField("requirements")}
              />
              <span className="careers-admin-field-hint">
                One item per line.
              </span>
            </div>

            <div className="careers-admin-field-row">
              <div className="careers-admin-field">
                <label htmlFor="job-apply-email">Apply Email</label>
                <input
                  id="job-apply-email"
                  type="email"
                  value={form.applyEmail}
                  onChange={updateField("applyEmail")}
                />
              </div>

              <div className="careers-admin-field">
                <label htmlFor="job-apply-link">Apply Link</label>
                <input
                  id="job-apply-link"
                  type="url"
                  value={form.applyLink}
                  onChange={updateField("applyLink")}
                />
              </div>
            </div>

            <span className="careers-admin-field-hint">
              Provide an apply email or an apply link (at least one is
              required).
            </span>

            {formError && <p className="careers-admin-error">{formError}</p>}

            <div className="careers-admin-modal-actions">
              <button
                type="button"
                className="careers-admin-btn careers-admin-btn-outline"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="careers-admin-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default CareersAdminDashboard;
