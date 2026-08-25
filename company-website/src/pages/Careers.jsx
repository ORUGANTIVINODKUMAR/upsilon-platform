import { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaBriefcase, FaArrowRight } from "react-icons/fa";
import {
  LuGraduationCap,
  LuUsers,
  LuTrendingUp,
  LuShieldCheck,
} from "react-icons/lu";

import CTA from "../components/CTA";
import CareersSubNav from "../components/CareersSubNav";
import usePageMeta from "../hooks/usePageMeta";

import "./Careers.css";

function buildApplyHref(job) {
  if (job.applyLink) {
    return job.applyLink;
  }

  if (job.applyEmail) {
    const subject = encodeURIComponent(`Application: ${job.title}`);
    return `mailto:${job.applyEmail}?subject=${subject}`;
  }

  return null;
}

const whyJoinCards = [
  {
    icon: <LuGraduationCap aria-hidden="true" />,
    title: "Growth & Learning",
    text: "Build real, hands-on expertise across accounting, tax, and audit engagements for U.S. CPA firms.",
  },
  {
    icon: <LuUsers aria-hidden="true" />,
    title: "Collaborative Culture",
    text: "Work alongside experienced professionals in a supportive, team-oriented environment.",
  },
  {
    icon: <LuTrendingUp aria-hidden="true" />,
    title: "Real Career Growth",
    text: "Take on more responsibility as you grow, with a clear path to advance within the firm.",
  },
  {
    icon: <LuShieldCheck aria-hidden="true" />,
    title: "Security & Confidentiality",
    text: "Work within a structured, NDA-backed environment built around client trust and data security.",
  },
];

function Careers() {
  usePageMeta({
    title: "Careers at Upsilon Services | Join Our Team",
    description:
      "Explore open roles at Upsilon Services and join a team supporting CPA and accounting firms across the United States with accounting, tax, and audit outsourcing.",
    path: "/careers",
  });

  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;

    fetch("/api/careers/jobs")
      .then(async (response) => {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load open positions.");
        }

        if (isMounted) {
          setJobs(data.jobs || []);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <section
        className="careers-hero"
        aria-labelledby="careers-hero-heading"
      >
        <video
          className="careers-hero-video"
          src="/video.mp4"
          poster="/carrersbg.png"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />

        <div className="careers-hero-overlay" aria-hidden="true" />

        <div className="careers-hero-container">
          <span className="careers-hero-eyebrow">CAREERS</span>

          <h1 id="careers-hero-heading">
            Build Your Career With Upsilon Services
          </h1>

          <p>
            Join a team supporting CPA and accounting firms across the United
            States with secure, scalable accounting, tax, and audit
            outsourcing.
          </p>

          <a href="#open-roles" className="careers-hero-cta">
            <span className="careers-hero-cta-circle" aria-hidden="true">
              <FaArrowRight />
            </span>
          </a>
        </div>
      </section>

      <CareersSubNav />

      <section
        className="careers-life-section"
        id="life-at-upsilon"
        aria-labelledby="careers-life-heading"
      >
        <div className="careers-life-container">
          <div className="careers-life-copy">
            <span className="careers-life-label">LIFE AT UPSILON</span>

            <h2 id="careers-life-heading">Step Into What&apos;s Next</h2>

            <p>
              Every career journey is different, but growth stays at the
              center of each one. At Upsilon Services, we build an
              environment where people can learn, contribute, and thrive
              through meaningful work on real client engagements.
            </p>

            <p>
              With a culture that encourages curiosity, collaboration, and
              accountability, Upsilon empowers you to build a stronger,
              more capable career in accounting and tax.
            </p>
          </div>

          <div className="careers-life-media">
            <img
              src="/lifeatupsilon.jpg"
              alt="Upsilon Services team smiling together in the office"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section
        className="careers-why-band"
        id="why-join-us"
        aria-labelledby="careers-why-heading"
      >
        <div className="careers-why-container">
          <span className="careers-why-label">WHY JOIN US</span>

          <h2 id="careers-why-heading">Your Path to a Better Career</h2>

          <p className="careers-why-intro">
            Upsilon Services combines real client work, experienced
            teammates, and structured growth so your career keeps moving
            forward &mdash; not standing still.
          </p>

          <div className="careers-why-grid">
            {whyJoinCards.map((card, index) => (
              <article className="careers-why-card" key={card.title}>
                <div className="careers-why-card-top">
                  <div className="careers-why-icon" aria-hidden="true">
                    {card.icon}
                  </div>

                  <span className="careers-why-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3>{card.title}</h3>

                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="careers-section"
        id="open-roles"
        aria-labelledby="open-positions-heading"
      >
        <div className="careers-container">
          <div className="careers-intro">
            <span className="careers-label">OPEN POSITIONS</span>

            <h2 id="open-positions-heading">Current Openings</h2>

            <p>
              We&apos;re always looking for talented accounting and support
              professionals. Explore our current openings below.
            </p>
          </div>

          {status === "loading" && (
            <div className="careers-empty">
              <p>Loading open positions...</p>
            </div>
          )}

          {status === "error" && (
            <div className="careers-empty">
              <h3>Unable to load open positions</h3>
              <p>Please refresh the page or try again shortly.</p>
            </div>
          )}

          {status === "ready" && jobs.length === 0 && (
            <div className="careers-empty">
              <h3>No open positions right now</h3>
              <p>
                We don&apos;t have any open roles at the moment, but we&apos;re
                always glad to hear from talented professionals. Check back
                soon.
              </p>
            </div>
          )}

          {status === "ready" && jobs.length > 0 && (
            <div className="careers-grid">
              {jobs.map((job) => {
                const applyHref = buildApplyHref(job);
                const isExternalLink = Boolean(job.applyLink);

                return (
                  <article className="job-card" key={job._id}>
                    <div className="job-card-body">
                      <span className="job-card-type">
                        {job.employmentType}
                      </span>

                      <h3>{job.title}</h3>

                      <div className="job-card-meta">
                        {job.department && (
                          <span>
                            <FaBriefcase aria-hidden="true" />
                            {job.department}
                          </span>
                        )}

                        {job.location && (
                          <span>
                            <FaMapMarkerAlt aria-hidden="true" />
                            {job.location}
                          </span>
                        )}
                      </div>

                      <p>{job.description}</p>

                      {applyHref ? (
                        <a
                          href={applyHref}
                          className="job-apply-link"
                          target={isExternalLink ? "_blank" : undefined}
                          rel={
                            isExternalLink ? "noopener noreferrer" : undefined
                          }
                          aria-label={`Apply for ${job.title}`}
                        >
                          Apply Now
                          <FaArrowRight aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <CTA
        title="Don't See the Right Role?"
        description="We're always interested in connecting with experienced accounting and tax professionals. Reach out and tell us about yourself."
        primaryLabel="Contact Us"
        primaryTo="/contact"
      />
    </>
  );
}

export default Careers;
