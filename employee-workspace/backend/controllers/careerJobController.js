import CareerJob from "../models/CareerJob.js";

const requiredFields = [
  "jobTitle",
  "department",
  "location",
  "employmentType",
  "experience",
  "workMode",
  "numberOfOpenings",
  "applicationDeadline",
  "shortDescription",
  "responsibilities",
  "requiredSkills",
  "education",
  "noticePeriod",
];

const validateRequiredFields = (data) => {
  return requiredFields.filter((field) => {
    const value = data[field];

    return (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    );
  });
};

// Public: get active jobs only
export const getPublishedCareerJobs = async (req, res) => {
  try {
    const jobs = await CareerJob.find({
      jobStatus: "Active",
    })
      .sort({
        postedDate: -1,
        createdAt: -1,
      })
      .select("-postedBy");

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Get published Careers jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch job openings.",
    });
  }
};

// Public: get one active job
export const getPublishedCareerJobById = async (req, res) => {
  try {
    const job = await CareerJob.findOne({
      _id: req.params.id,
      jobStatus: "Active",
    }).select("-postedBy");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found.",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Get published Careers job error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to fetch the job opening.",
    });
  }
};

// Admin: get every job
export const getAllCareerJobs = async (req, res) => {
  try {
    const jobs = await CareerJob.find()
      .sort({
        createdAt: -1,
      })
      .populate("postedBy", "name email");

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Get all Careers jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch Careers jobs.",
    });
  }
};

// Admin: get one job, including Draft or Closed
export const getCareerJobForAdmin = async (req, res) => {
  try {
    const job = await CareerJob.findById(req.params.id).populate(
      "postedBy",
      "name email"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Get Careers job for admin error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to fetch the job.",
    });
  }
};

// Admin: create a job
export const createCareerJob = async (req, res) => {
  try {
    const missingFields = validateRequiredFields(req.body);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please complete these fields: ${missingFields.join(
          ", "
        )}.`,
      });
    }

    const job = await CareerJob.create({
      jobTitle: req.body.jobTitle,
      department: req.body.department,
      location: req.body.location,
      employmentType: req.body.employmentType,
      experience: req.body.experience,
      workMode: req.body.workMode,
      numberOfOpenings: Number(req.body.numberOfOpenings),
      salaryRange: req.body.salaryRange || "",
      applicationDeadline: req.body.applicationDeadline,
      jobStatus: req.body.jobStatus || "Draft",
      shortDescription: req.body.shortDescription,
      responsibilities: req.body.responsibilities,
      requiredSkills: req.body.requiredSkills,
      education: req.body.education,
      noticePeriod: req.body.noticePeriod,
      postedBy: req.careersAdmin._id,
    });

    return res.status(201).json({
      success: true,
      message: "Job created successfully.",
      job,
    });
  } catch (error) {
    console.error("Create Careers job error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (validationError) => validationError.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join(" "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create the job.",
    });
  }
};

// Admin: update a job
export const updateCareerJob = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    delete updateData.postedBy;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (updateData.numberOfOpenings !== undefined) {
      updateData.numberOfOpenings = Number(
        updateData.numberOfOpenings
      );
    }

    const job = await CareerJob.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job updated successfully.",
      job,
    });
  } catch (error) {
    console.error("Update Careers job error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (validationError) => validationError.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join(" "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update the job.",
    });
  }
};

// Admin: delete a job
export const deleteCareerJob = async (req, res) => {
  try {
    const job = await CareerJob.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Careers job error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to delete the job.",
    });
  }
};
