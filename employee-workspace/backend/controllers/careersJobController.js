import JobPosting from "../models/JobPosting.js";

function toSlug(title) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(title, excludeId) {
  const baseSlug = toSlug(title) || "job";
  let slug = baseSlug;
  let counter = 2;

  while (
    await JobPosting.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

function toLineArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * GET /api/careers/jobs
 * Public: only published jobs.
 */
export const getPublishedJobs = async (req, res) => {
  try {
    const jobs = await JobPosting.find({ status: "published" })
      .sort({ createdAt: -1 })
      .select("-postedBy");

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/careers-admin/jobs
 * Admin: every job regardless of status.
 */
export const getAllJobsAdmin = async (req, res) => {
  try {
    const jobs = await JobPosting.find()
      .sort({ createdAt: -1 })
      .populate("postedBy", "name email");

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/careers-admin/jobs
 */
export const createJob = async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      employmentType,
      description,
      responsibilities,
      requirements,
      applyEmail,
      applyLink,
      status,
    } = req.body ?? {};

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    if (!applyEmail && !applyLink) {
      return res.status(400).json({
        success: false,
        message: "Provide an apply email or an apply link",
      });
    }

    const slug = await generateUniqueSlug(title);

    const job = await JobPosting.create({
      title: String(title).trim(),
      slug,
      department: department || "",
      location: location || "",
      employmentType: employmentType || "Full-time",
      description,
      responsibilities: toLineArray(responsibilities),
      requirements: toLineArray(requirements),
      applyEmail: applyEmail || "",
      applyLink: applyLink || "",
      status: ["draft", "published", "closed"].includes(status)
        ? status
        : "draft",
      postedBy: req.careersAdmin._id,
    });

    res.status(201).json({
      success: true,
      message: "Job posting created",
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * PUT /api/careers-admin/jobs/:id
 */
export const updateJob = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    const {
      title,
      department,
      location,
      employmentType,
      description,
      responsibilities,
      requirements,
      applyEmail,
      applyLink,
      status,
    } = req.body ?? {};

    const nextApplyEmail = applyEmail ?? job.applyEmail;
    const nextApplyLink = applyLink ?? job.applyLink;

    if (!nextApplyEmail && !nextApplyLink) {
      return res.status(400).json({
        success: false,
        message: "Provide an apply email or an apply link",
      });
    }

    if (title && title.trim() !== job.title) {
      job.slug = await generateUniqueSlug(title, job._id);
    }

    job.title = title ?? job.title;
    job.department = department ?? job.department;
    job.location = location ?? job.location;
    job.employmentType = employmentType ?? job.employmentType;
    job.description = description ?? job.description;

    if (responsibilities !== undefined) {
      job.responsibilities = toLineArray(responsibilities);
    }

    if (requirements !== undefined) {
      job.requirements = toLineArray(requirements);
    }

    job.applyEmail = nextApplyEmail;
    job.applyLink = nextApplyLink;

    if (["draft", "published", "closed"].includes(status)) {
      job.status = status;
    }

    await job.save();

    res.status(200).json({
      success: true,
      message: "Job posting updated",
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/careers-admin/jobs/:id
 */
export const deleteJob = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job posting deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
