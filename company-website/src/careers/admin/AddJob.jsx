import {
  useState,
} from "react";

import {
  useNavigate,
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

function AddJob() {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState(initialFormData);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

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
        "/api/jobs",
        {
          method: "POST",

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
            "Unable to create the job."
        );
      }

      navigate(
        "/admin/careers/manage-jobs",
        {
          replace: true,
          state: {
            message:
              "Job created successfully.",
          },
        }
      );
    } catch (error) {
      console.error(
        "Create Careers job error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to create the job."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CareersAdminLayout
      title="Add Job"
      description="Create a new job opening for the Careers page."
    >
      <CareerJobForm
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Create Job"
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

export default AddJob;