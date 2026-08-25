import { FaBuilding, FaHashtag, FaSearch, FaLaptop } from "react-icons/fa";

import PageHeader from "../components/PageHeader";
import CareersSubNav from "../components/CareersSubNav";
import LegalSectionCard from "../components/LegalSectionCard";
import usePageMeta from "../hooks/usePageMeta";

import "./LegalPage.css";
import "./Careers.css";

const fraudTypes = [
  {
    icon: <FaBuilding aria-hidden="true" />,
    title: "Fake Recruitment Agencies",
    text: "Some agencies claim to represent Upsilon Services and charge candidates a fee for a “guaranteed” interview, training, or job placement. Upsilon Services does not use paid third-party recruiters who charge candidates for access to a role.",
  },
  {
    icon: <FaHashtag aria-hidden="true" />,
    title: "Social Media Job Scams",
    text: "Scammers create fake profiles or pages using the Upsilon Services name and logo to advertise job openings and lend false credibility to their offers. We do not recruit exclusively through social media messages or unofficial pages.",
  },
  {
    icon: <FaSearch aria-hidden="true" />,
    title: "Fake Listings on Job Portals",
    text: "Job boards can carry both legitimate and fraudulent postings side by side. A listing appearing on a well-known job site does not guarantee it is genuine — always confirm any role against our official openings at upsilonservices.com/careers.",
  },
  {
    icon: <FaLaptop aria-hidden="true" />,
    title: "Fake Online Tests or Assessments",
    text: "Some scams direct candidates to online “tests” or portals that collect personal information or request payment before releasing results. Any assessment we use will be communicated directly by our recruiting team from an @upsilonservices.com address.",
  },
];

const hiringSteps = [
  {
    title: "Application received",
    text: "You apply through a role listed on upsilonservices.com/careers, or we reach out from an @upsilonservices.com address.",
  },
  {
    title: "Screening conversation",
    text: "A recruiter contacts you to discuss the role, your experience, and next steps. No payment is ever requested.",
  },
  {
    title: "Interview & assessment",
    text: "You meet with the hiring team, by phone, video call, or in writing — never only through chat apps.",
  },
  {
    title: "Offer sent in writing",
    text: "A genuine offer is sent by email from an @upsilonservices.com address, with clear role and compensation details.",
  },
];

const sections = [
  {
    title: "Upsilon Services Never Asks You to Pay",
    body: (
      <>
        <p>
          Upsilon Services does not charge any fee at any stage of
          recruitment. We never ask candidates to pay for job offers,
          interviews, training materials, equipment, background checks, or
          onboarding.
        </p>
        <p>
          If anyone claiming to represent Upsilon Services asks you to send
          money, gift cards, or payment of any kind, it is not a genuine
          communication from our company.
        </p>
      </>
    ),
  },
  {
    title: "How to Recognize a Fake Offer",
    body: (
      <ul>
        <li>Requests for payment, deposits, or "processing fees."</li>
        <li>
          Job offers sent without any interview or application on our
          official channels.
        </li>
        <li>
          Communication only through personal WhatsApp, Telegram, or similar
          chat apps, with no official email.
        </li>
        <li>
          Requests for sensitive personal or banking information before any
          formal offer.
        </li>
        <li>
          Email addresses that resemble but do not exactly match
          <strong> @upsilonservices.com</strong>.
        </li>
        <li>Salary or benefits that seem unrealistic for the role.</li>
      </ul>
    ),
  },
  {
    title: "How to Verify a Genuine Communication",
    body: (
      <>
        <p>
          Genuine communication from Upsilon Services will always come from
          an <strong>@upsilonservices.com</strong> email address, and our
          current openings are always listed on this website at{" "}
          <a href="/careers">upsilonservices.com/careers</a>.
        </p>
        <p>
          If you're unsure whether a message claiming to be from Upsilon
          Services is genuine, do not respond with personal information or
          payment, and contact us directly using the details below to
          confirm.
        </p>
      </>
    ),
  },
  {
    title: "Report a Suspicious Offer",
    body: (
      <p>
        If you believe you have received a fraudulent job offer using the
        Upsilon Services name, please report it to us.
        <br />
        Email:{" "}
        <a href="mailto:info@upsilonservices.com">
          info@upsilonservices.com
        </a>
        <br />
        Phone: <a href="tel:+12098774566">+1 209 877 4566</a>
      </p>
    ),
  },
];

function CareersFakeJobAlert() {
  usePageMeta({
    title: "Fake Job Alert | Careers at Upsilon Services",
    description:
      "Learn how to identify fraudulent job offers falsely claiming to be from Upsilon Services, and how to verify or report suspicious communications.",
    path: "/careers/fake-job-alert",
  });

  return (
    <>
      <PageHeader
        eyebrow="CAREERS"
        title="Fake Job Alert"
        subtitle="Protect yourself from recruitment fraud impersonating Upsilon Services."
      />

      <CareersSubNav />

      <section
        className="careers-life-section"
        aria-labelledby="careers-fake-intro-heading"
      >
        <div className="careers-life-container">
          <div className="careers-life-copy">
            <span className="careers-life-label">STAY PROTECTED</span>

            <h2 id="careers-fake-intro-heading">
              Recruitment Fraud Is on the Rise
            </h2>

            <p>
              Scammers sometimes impersonate real companies, including
              Upsilon Services, to trick job seekers into paying fees or
              sharing personal and financial information. This page explains
              what our real hiring process looks like, so you can spot the
              difference.
            </p>

            <p className="legal-disclaimer">
              Upsilon Services never asks candidates for payment at any
              stage of recruitment. If you have been asked to pay, treat the
              offer as fraudulent and do not send any money or personal
              information.
            </p>
          </div>

          <div className="careers-life-media">
            <img
              src="/security.jpg"
              alt="Digital illustration of a security shield representing protection against recruitment fraud"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section
        className="careers-fraud-types-section"
        aria-labelledby="careers-fake-types-heading"
      >
        <div className="careers-fraud-types-container">
          <span className="careers-life-label">KNOW THE RISKS</span>

          <h2 id="careers-fake-types-heading">
            Common Types of Recruitment Fraud
          </h2>

          <p>
            Imposter job, internship, or training offers can be difficult to
            identify unless you know the common tactics scammers use to
            exploit job seekers.
          </p>

          <div className="careers-fraud-types-list">
            {fraudTypes.map((item) => (
              <article className="careers-fraud-type-row" key={item.title}>
                <div className="careers-fraud-type-icon" aria-hidden="true">
                  {item.icon}
                </div>

                <div className="careers-fraud-type-copy">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="careers-process-section"
        aria-labelledby="careers-fake-process-heading"
      >
        <div className="careers-process-container">
          <span className="careers-life-label">OUR REAL PROCESS</span>

          <h2 id="careers-fake-process-heading">
            What a Genuine Upsilon Hiring Process Looks Like
          </h2>

          <div className="careers-process-grid">
            {hiringSteps.map((step, index) => (
              <div className="careers-process-card" key={step.title}>
                <span className="careers-process-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
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
    </>
  );
}

export default CareersFakeJobAlert;
