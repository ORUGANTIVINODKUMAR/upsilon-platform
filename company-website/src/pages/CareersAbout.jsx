import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import CareersSubNav from "../components/CareersSubNav";
import LegalSectionCard from "../components/LegalSectionCard";
import CTA from "../components/CTA";
import usePageMeta from "../hooks/usePageMeta";

import "./LegalPage.css";
import "./Careers.css";

const stats = [
  { value: "5+ Yrs", label: "Supporting U.S. accounting firms" },
  { value: "4,000+", label: "Engagements delivered" },
  { value: "92%", label: "On-time delivery rate" },
];

const leaders = [
  {
    photo: "/1.png",
    name: "Sai Teja Kukudala, EA",
    role: "Managing Partner & Operational Head",
  },
  {
    photo: "/2.jpg",
    name: "Koren S. Cranford, CPA",
    role: "Strategic Advisor",
  },
  {
    photo: "/3.png",
    name: "Michael Bradford, CPA",
    role: "Chief Growth Officer",
  },
  {
    photo: "/4.jpg",
    name: "Aditya Kalidindi",
    role: "Strategic Advisor & Board Member",
  },
];

const sections = [
  {
    title: "Our Mission",
    body: (
      <p>
        Our mission is to help CPA and accounting firms expand their
        capacity through secure, scalable, and reliable accounting
        outsourcing, tax preparation, bookkeeping, audit support, and
        back-office solutions &mdash; while enabling our own team to grow,
        develop real expertise, and build lasting careers.
      </p>
    ),
  },
  {
    title: "Our Vision",
    body: (
      <p>
        We want to be the most trusted accounting outsourcing partner for
        CPA firms, and the employer of choice for accounting and tax
        professionals who want structured growth, meaningful client work,
        and a team that invests in their development.
      </p>
    ),
  },
  {
    title: "What We Look For",
    body: (
      <>
        <p>
          We hire for accuracy, accountability, and a genuine interest in
          U.S. accounting and tax work. Most roles benefit from:
        </p>
        <ul>
          <li>
            A background in accounting, bookkeeping, tax preparation, or
            audit support.
          </li>
          <li>
            Comfort working with U.S. accounting and tax software and
            terminology.
          </li>
          <li>
            Strong attention to detail and clear, professional
            communication.
          </li>
          <li>
            A collaborative mindset &mdash; our teams work closely with
            client-facing CPA firm staff.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "What You Can Expect From Us",
    body: (
      <ul>
        <li>Clear expectations and structured onboarding for every role.</li>
        <li>
          Real client engagements from early on &mdash; not just training
          exercises.
        </li>
        <li>
          Direct feedback from experienced reviewers, so you know where you
          stand.
        </li>
        <li>
          A defined path to take on more responsibility as you build
          expertise.
        </li>
      </ul>
    ),
  },
  {
    title: "Careers Questions",
    body: (
      <p>
        If you have a question about a role or your application, contact
        our recruiting team.
        <br />
        Email:{" "}
        <a href="mailto:info@upsilonservices.com">
          info@upsilonservices.com
        </a>
      </p>
    ),
  },
];

function CareersAbout() {
  usePageMeta({
    title: "About Us | Careers at Upsilon Services",
    description:
      "Learn who Upsilon Services is, what we look for in candidates, and how we support the accounting and tax professionals who work with us.",
    path: "/careers/about",
  });

  return (
    <>
      <PageHeader
        eyebrow="CAREERS"
        title="About Upsilon Services"
        subtitle="Who we are, what we do, and what we look for in the people who join us."
        backgroundImage="/aboutus1.avif"
      />

      <CareersSubNav />

      <section
        className="careers-life-section"
        aria-labelledby="careers-about-who-heading"
      >
        <div className="careers-life-container">
          <div className="careers-life-copy">
            <span className="careers-life-label">WHO WE ARE</span>

            <h2 id="careers-about-who-heading">
              An Accounting Outsourcing Partner Built on Its People
            </h2>

            <p>
              Upsilon Services is an accounting, tax, and audit outsourcing
              partner for CPA and accounting firms across the United
              States. We help firms expand capacity through dedicated
              professionals who integrate with their existing teams,
              software, and workflows.
            </p>

            <p>
              Our people are at the center of that work. Every engagement
              is delivered by professionals experienced in accounting,
              bookkeeping, tax preparation, audit support, and
              administrative services for U.S. public accounting practices.
            </p>
          </div>

          <div className="careers-life-media">
            <img
              src="/whyupsilon1.jpg"
              alt="An Upsilon Services professional working at a desk with accounting reports"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section
        className="careers-stats-strip"
        aria-label="Upsilon Services experience and delivery statistics"
      >
        <div className="careers-stats-container">
          {stats.map((stat) => (
            <div className="careers-stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
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
        className="careers-leaders-section"
        aria-labelledby="careers-about-leaders-heading"
      >
        <div className="careers-leaders-container">
          <span className="careers-life-label">LEADERSHIP</span>

          <h2 id="careers-about-leaders-heading">
            The Team Guiding Upsilon Services
          </h2>

          <div className="careers-leaders-grid">
            {leaders.map((leader) => (
              <div className="careers-leader-card" key={leader.name}>
                <div className="careers-leader-photo">
                  <img
                    src={leader.photo}
                    alt={leader.name}
                    loading="lazy"
                    decoding="async"
                    width="96"
                    height="96"
                  />
                </div>

                <h3>{leader.name}</h3>
                <span>{leader.role}</span>
              </div>
            ))}
          </div>

          <Link to="/about" className="careers-leaders-link">
            Learn more about our team
          </Link>
        </div>
      </section>

      <CTA
        title="Ready to Explore Open Roles?"
        description="See current openings at Upsilon Services and find where you fit."
        primaryLabel="View Open Roles"
        primaryTo="/careers#open-roles"
      />
    </>
  );
}

export default CareersAbout;
