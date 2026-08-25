import PageHeader from "../components/PageHeader";
import CareersSubNav from "../components/CareersSubNav";
import LegalSectionCard from "../components/LegalSectionCard";
import CTA from "../components/CTA";
import usePageMeta from "../hooks/usePageMeta";

import "./LegalPage.css";
import "./Careers.css";

const certBadges = [
  { src: "/iso.png", label: "ISO 27001", subtitle: "Information Security Management" },
  { src: "/cmmi.png", label: "CMMI Level 3", subtitle: "Process Quality Assurance" },
  { src: "/nda.png", label: "NDA Agreement", subtitle: "Every engagement is backed by an NDA" },
];

const softwareList = [
  { name: "Drake Tax", logo: "/drake.jpg" },
  { name: "ProSeries", logo: "/proseries.png" },
  { name: "QuickBooks", logo: "/quickbooks.png" },
  { name: "CCH Axcess", logo: "/cch.png" },
  { name: "Xero", logo: "/xero.png" },
  { name: "UltraTax CS", logo: "/ultratax.jpeg" },
];

const sections = [
  {
    title: "Our Values",
    body: (
      <ul>
        <li>
          <strong>Accuracy first.</strong> Every deliverable represents a
          client's financial data &mdash; precision and attention to detail
          are non-negotiable.
        </li>
        <li>
          <strong>Confidentiality and trust.</strong> We handle sensitive
          financial information under strict security and confidentiality
          practices, and every engagement is backed by signed NDAs.
        </li>
        <li>
          <strong>Collaboration over silos.</strong> We work closely with
          teammates and client-facing staff rather than handing off work in
          isolation.
        </li>
        <li>
          <strong>Ownership.</strong> We expect team members to raise
          questions, flag issues early, and take responsibility for the
          quality of their work.
        </li>
      </ul>
    ),
  },
  {
    title: "Growth & Development",
    body: (
      <p>
        As you take on more responsibility, you get exposure to a wider
        range of accounting, tax, and audit engagements. We support
        continued learning on the job and give team members a clear path to
        take on more complex client work over time.
      </p>
    ),
  },
  {
    title: "Life at Upsilon",
    body: (
      <p>
        We keep communication direct, feedback constructive, and workloads
        realistic. Our goal is a team that stays because the work is
        meaningful and the growth is real &mdash; not because there's no
        alternative.
      </p>
    ),
  },
];

function CareersTheUpsilonWay() {
  usePageMeta({
    title: "The Upsilon Way | Careers at Upsilon Services",
    description:
      "See how Upsilon Services works, what we value, and how we support the growth of the accounting and tax professionals on our team.",
    path: "/careers/the-upsilon-way",
  });

  return (
    <>
      <PageHeader
        eyebrow="CAREERS"
        title="The Upsilon Way"
        subtitle="How we work, what we value, and how we support your growth."
      />

      <CareersSubNav />

      <section
        className="careers-life-section"
        aria-labelledby="careers-way-how-heading"
      >
        <div className="careers-life-container">
          <div className="careers-life-copy">
            <span className="careers-life-label">HOW WE WORK</span>

            <h2 id="careers-way-how-heading">
              An Extension of Every Client's Team
            </h2>

            <p>
              Upsilon Services professionals work as an extension of each
              CPA firm's internal team. That means learning each client's
              software, review standards, and communication preferences,
              and delivering work that is accurate, organized, and ready
              for review.
            </p>

            <p>
              We build structured preparation and review processes into
              every engagement so our team can produce consistent,
              reviewer-ready work &mdash; not just complete tasks.
            </p>
          </div>

          <div className="careers-life-media">
            <img
              src="/pic.png"
              alt="An accounting professional reviewing financial data and reports"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="legal-section">
        <div className="legal-container">
          {sections.map((section) => (
            <LegalSectionCard key={section.title} title={section.title}>
              {section.body}
            </LegalSectionCard>
          ))}
        </div>
      </section>

      <section
        className="careers-badges-section"
        aria-labelledby="careers-way-security-heading"
      >
        <div className="careers-badges-container">
          <span className="careers-life-label">SECURITY IN PRACTICE</span>

          <h2 id="careers-way-security-heading">
            Confidentiality Isn&apos;t Just a Policy Here
          </h2>

          <p>
            Every team member works within a security framework backed by
            recognized standards and signed confidentiality agreements.
          </p>

          <div className="careers-badges-grid">
            {certBadges.map((badge) => (
              <div className="careers-badge-card" key={badge.label}>
                <img
                  src={badge.src}
                  alt={badge.label}
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <strong>{badge.label}</strong>
                  <span>{badge.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="careers-software-section"
        aria-labelledby="careers-way-software-heading"
      >
        <div className="careers-software-container">
          <span className="careers-life-label">TOOLS YOU&apos;LL USE</span>

          <h2 id="careers-way-software-heading">
            Software You&apos;ll Work With Day to Day
          </h2>

          <div className="careers-software-grid">
            {softwareList.map((item) => (
              <div className="careers-software-card" key={item.name}>
                <img
                  src={item.logo}
                  alt={`${item.name} logo`}
                  loading="lazy"
                  decoding="async"
                />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA
        title="See Where You Fit"
        description="Explore current openings across accounting, tax, audit, and admin support."
        primaryLabel="View Open Roles"
        primaryTo="/careers#open-roles"
      />
    </>
  );
}

export default CareersTheUpsilonWay;
