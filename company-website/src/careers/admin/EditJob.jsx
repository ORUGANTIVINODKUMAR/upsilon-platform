import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import CareersAdminLayout from "../components/CareersAdminLayout";
import CareerJobForm from "../components/CareerJobForm";

const initialFormData = {
  jobTitle: "",
  department: "",
  location: "",
  employmentType: "",
  experience: "",
  workMode: "",
  numberOfOpenings: "1",
  salaryRange: "",
  applicationDeadline: "",
  jobStatus: "Draft",
  shortDescription: "",
  responsibilities: "",
  requiredSkills: "",
  education: "",
  noticePeriod: "",
};

function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState(initialFormData);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `/api/jobs/admin/${id}`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load the job."
          );
        }

        const job = data.job;

        setFormData({
          jobTitle: job.jobTitle || "",
          department: job.department || "",
          location: job.location || "",
          employmentType:
            job.employmentType || "",
          experience: job.experience || "",
          workMode: job.workMode || "",
          numberOfOpenings: String(
            job.numberOfOpenings || 1
          ),
          salaryRange:
            job.salaryRange || "",
          applicationDeadline:
            job.applicationDeadline
              ? new Date(
                  job.applicationDeadline
                )
                  .toISOString()
                  .split("T")[0]
              : "",
          jobStatus:
            job.jobStatus || "Draft",
          shortDescription:
            job.shortDescription || "",
          responsibilities:
            job.responsibilities || "",
          requiredSkills:
            job.requiredSkills || "",
          education: job.education || "",
          noticePeriod:
            job.noticePeriod || "",
        });
      } catch (error) {
        console.error(
          "Fetch Careers job for editing:",
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/jobs/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update the job."
        );
      }

      navigate(
        "/admin/careers/manage-jobs",
        {
          replace: true,
          state: {
            message:
              "Job updated successfully.",
          },
        }
      );
    } catch (error) {
      console.error(
        "Update Careers job error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to update the job."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <CareersAdminLayout
        title="Edit Job"
        description="Loading the selected job."
      >
        <div className="careers-dashboard-message">
          Loading job...
        </div>
      </CareersAdminLayout>
    );
  }

  if (
    errorMessage &&
    !formData.jobTitle
  ) {
    return (
      <CareersAdminLayout
        title="Edit Job"
        description="The selected job could not be loaded."
      >
        <div className="careers-dashboard-message careers-dashboard-error">
          <h3>Unable to Load Job</h3>

          <p>{errorMessage}</p>

          <button
            type="button"
            className="careers-admin-secondary-button"
            onClick={() =>
              navigate(
                "/admin/careers/manage-jobs"
              )
            }
          >
            Back to Manage Jobs
          </button>
        </div>
      </CareersAdminLayout>
    );
  }

  return (
    <CareersAdminLayout
      title="Edit Job"
      description="Update the selected job opening."
    >
      <CareerJobForm
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Save Changes"
        errorMessage={errorMessage}
        onCancel={() =>
          navigate(
            "/admin/careers/manage-jobs"
          )
        }
      />
    </CareersAdminLayout>
  );
}

export default EditJob;