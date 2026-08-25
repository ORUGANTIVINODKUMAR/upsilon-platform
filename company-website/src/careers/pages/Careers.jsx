import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuArrowRight,
  LuBriefcaseBusiness,
  LuCheck,
  LuClock,
  LuGraduationCap,
  LuHeartHandshake,
  LuMapPin,
  LuSearch,
  LuShieldCheck,
  LuSparkles,
  LuTrendingUp,
  LuUsers,
  LuX,
} from "react-icons/lu";

import usePageMeta from "../../hooks/usePageMeta";
import "./Careers.css";

const benefits = [
  {
    icon: LuGraduationCap,
    title: "Keep learning",
    description:
      "Build practical expertise across accounting, tax, and audit engagements for U.S. CPA firms.",
  },
  {
    icon: LuUsers,
    title: "Grow together",
    description:
      "Learn from experienced professionals in a culture where questions, ideas, and teamwork are valued.",
  },
  {
    icon: LuTrendingUp,
    title: "Own your progress",
    description:
      "Take on meaningful responsibility with clear feedback and room to shape the next step in your career.",
  },
  {
    icon: LuShieldCheck,
    title: "Do trusted work",
    description:
      "Work in a structured, security-minded environment built around confidentiality and client trust.",
  },
];

const culturePoints = [
  "Meaningful client work from day one",
  "Supportive teams and approachable leaders",
  "A culture built on ownership and integrity",
];

function Careers() {
  usePageMeta({
    title: "Careers at Upsilon Services | Grow With Us",
    description:
      "Explore open roles at Upsilon Services and build your career in accounting, tax, audit, and professional support services.",
    path: "/careers",
  });

  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/jobs", {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to fetch job openings.");
        }

        setJobs(data.jobs || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setErrorMessage("We couldn't load the open roles right now.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchJobs();
    return () => controller.abort();
  }, [retryCount]);

  const filterOptions = useMemo(
    () => ({
      departments: [...new Set(jobs.map((job) => job.department).filter(Boolean))],
      locations: [...new Set(jobs.map((job) => job.location).filter(Boolean))],
      employmentTypes: [
        ...new Set(jobs.map((job) => job.employmentType).filter(Boolean)),
      ],
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    return jobs.filter((job) => {
      const searchableText = [
        job.jobTitle,
        job.department,
        job.location,
        job.shortDescription,
        job.employmentType,
        job.workMode,
        job.experience,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!searchValue || searchableText.includes(searchValue)) &&
        (!departmentFilter || job.department === departmentFilter) &&
        (!locationFilter || job.location === locationFilter) &&
        (!employmentFilter || job.employmentType === employmentFilter)
      );
    });
  }, [jobs, searchTerm, departmentFilter, locationFilter, employmentFilter]);

  const hasActiveFilters = Boolean(
    searchTerm || departmentFilter || locationFilter || employmentFilter
  );

  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setLocationFilter("");
    setEmploymentFilter("");
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Recently posted";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Recently posted";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="career-module-page">
      <section className="career-module-hero" aria-labelledby="career-title">
        <div className="career-module-container career-module-hero-layout">
          <div className="career-module-hero-content" data-aos="fade-up">
            <p className="career-module-eyebrow">Careers at Upsilon</p>
            <h1 id="career-title">
              Do work that matters. <span>Grow while you do it.</span>
            </h1>
            <p className="career-module-hero-description">
              Join a thoughtful, ambitious team helping U.S. accounting firms
              work smarter. Bring your curiosity—we'll give it room to grow.
            </p>
            <div className="career-module-hero-actions">
              <a className="career-module-primary-button" href="#open-positions">
                Explore open roles <LuArrowRight aria-hidden="true" />
              </a>
              <a className="career-module-text-link" href="#life-at-upsilon">
                Life at Upsilon
              </a>
            </div>
          </div>

          <div className="career-module-hero-visual" data-aos="fade-left">
            <div className="career-module-hero-image-frame">
              <img
                src="/carrersbg.png"
                alt="Upsilon team members collaborating at work"
              />
            </div>
            <div className="career-module-floating-note">
              <span><LuSparkles aria-hidden="true" /></span>
              <p><strong>Build what comes next</strong> with people who want you to succeed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="career-module-proof" aria-label="Why people choose Upsilon">
        <div className="career-module-container career-module-proof-grid">
          <div><strong>Real impact</strong><span>Meaningful client work</span></div>
          <div><strong>Shared growth</strong><span>Mentorship and feedback</span></div>
          <div><strong>Strong values</strong><span>Trust, care, and ownership</span></div>
        </div>
      </section>

      <section className="career-module-benefits" aria-labelledby="benefits-title">
        <div className="career-module-container">
          <div className="career-module-section-heading" data-aos="fade-up">
            <p className="career-module-eyebrow">Why join us</p>
            <h2 id="benefits-title">A place to build your best work</h2>
            <p>
              We pair high standards with real support, so you can contribute
              with confidence and keep moving forward.
            </p>
          </div>

          <div className="career-module-benefits-grid">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <article className="career-module-benefit-card" key={benefit.title} data-aos="fade-up" data-aos-delay={index * 60}>
                  <div className="career-module-benefit-icon"><Icon aria-hidden="true" /></div>
                  <span className="career-module-benefit-number">0{index + 1}</span>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="open-positions" className="career-module-jobs-section" aria-labelledby="jobs-title">
        <div className="career-module-container">
          <div className="career-module-jobs-heading">
            <div>
              <p className="career-module-eyebrow">Open positions</p>
              <h2 id="jobs-title">Find your next opportunity</h2>
              <p>Search our current openings and find a role where you can make an impact.</p>
            </div>
            {!loading && !errorMessage && (
              <span className="career-module-job-count">
                {filteredJobs.length} {filteredJobs.length === 1 ? "role" : "roles"}
              </span>
            )}
          </div>

          <div className="career-module-filters" aria-label="Job filters">
            <label className="career-module-search">
              <span className="career-module-sr-only">Search roles</span>
              <LuSearch aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by role or keyword"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <label>
              <span>Department</span>
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                <option value="">All departments</option>
                {filterOptions.departments.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span>Location</span>
              <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
                <option value="">All locations</option>
                {filterOptions.locations.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span>Work type</span>
              <select value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)}>
                <option value="">All work types</option>
                {filterOptions.employmentTypes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            {hasActiveFilters && (
              <button className="career-module-clear" type="button" onClick={clearFilters}>
                <LuX aria-hidden="true" /> Clear
              </button>
            )}
          </div>

          {loading && (
            <div className="career-module-loading" aria-live="polite">
              {[1, 2].map((item) => <div className="career-module-skeleton" key={item} />)}
            </div>
          )}

          {!loading && errorMessage && (
            <div className="career-module-message career-module-error" role="alert">
              <span><LuBriefcaseBusiness aria-hidden="true" /></span>
              <h3>We hit a small snag</h3>
              <p>{errorMessage} Please try again in a moment.</p>
              <button type="button" onClick={() => setRetryCount((value) => value + 1)}>Try again</button>
            </div>
          )}

          {!loading && !errorMessage && filteredJobs.length === 0 && (
            <div className="career-module-message">
              <span><LuSearch aria-hidden="true" /></span>
              <h3>{hasActiveFilters ? "No matching roles yet" : "New opportunities are on the way"}</h3>
              <p>{hasActiveFilters ? "Try a different keyword or clear your filters." : "We don't have an open role right now, but we'd still love to hear from you."}</p>
              {hasActiveFilters ? (
                <button type="button" onClick={clearFilters}>Clear all filters</button>
              ) : (
                <Link to="/contact">Introduce yourself</Link>
              )}
            </div>
          )}

          {!loading && !errorMessage && filteredJobs.length > 0 && (
            <div className="career-module-jobs-grid">
              {filteredJobs.map((job) => (
                <article className="career-module-job-card" key={job._id}>
                  <div className="career-module-job-card-top">
                    <span>{job.department || "Upsilon Services"}</span>
                    {job.jobStatus && <em>{job.jobStatus}</em>}
                  </div>
                  <h3>{job.jobTitle}</h3>
                  <div className="career-module-job-meta">
                    {job.location && <span><LuMapPin aria-hidden="true" />{job.location}</span>}
                    {job.employmentType && <span><LuBriefcaseBusiness aria-hidden="true" />{job.employmentType}</span>}
                    {job.experience && <span><LuClock aria-hidden="true" />{job.experience}</span>}
                  </div>
                  {job.shortDescription && <p>{job.shortDescription}</p>}
                  <div className="career-module-job-footer">
                    <small>Posted {formatDate(job.postedDate || job.createdAt)}</small>
                    <button type="button" onClick={() => navigate(`/careers/job/${job._id}`)}>
                      View role <LuArrowRight aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="life-at-upsilon" className="career-module-life-section" aria-labelledby="life-title">
        <div className="career-module-container career-module-life-layout">
          <div className="career-module-life-image" data-aos="fade-right">
            <img src="/lifeatupsilon.jpg" alt="Upsilon colleagues enjoying time together" loading="lazy" />
            <div><LuHeartHandshake aria-hidden="true" /><span><strong>People first</strong>Always.</span></div>
          </div>
          <div className="career-module-life-content" data-aos="fade-up">
            <p className="career-module-eyebrow">Life at Upsilon</p>
            <h2 id="life-title">Serious about the work. Human in how we do it.</h2>
            <p>
              Great work happens when people feel trusted, supported, and free
              to keep learning. That's the kind of workplace we're building—one
              conversation, challenge, and shared win at a time.
            </p>
            <ul>
              {culturePoints.map((point) => <li key={point}><LuCheck aria-hidden="true" />{point}</li>)}
            </ul>
            <Link to="/careers/the-upsilon-way">Discover the Upsilon way <LuArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="career-module-cta" aria-labelledby="career-cta-title">
        <div className="career-module-container career-module-cta-inner">
          <div>
            <p className="career-module-eyebrow">Your next chapter</p>
            <h2 id="career-cta-title">Don't see the perfect role?</h2>
            <p>Tell us what you're great at. The right opportunity may be closer than you think.</p>
          </div>
          <Link to="/contact">Start a conversation <LuArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}

export default Careers;
