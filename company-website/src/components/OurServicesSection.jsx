// =========================================================
// OUR SERVICES SECTION — Upsilon Services
// Paste this file at: src/components/OurServicesSection.jsx
// Requires: react-icons (already in your dependencies)
//
// Note: this is a distinct, card-grid "Our Services" section —
// separate from your existing tabbed ServicesSection on Home.
// Use whichever one fits the page, or replace one with the other.
// =========================================================
import {
  FaFileInvoiceDollar,
  FaCalculator,
  FaClipboardCheck,
  FaFolderOpen,
  FaArrowRight,
} from "react-icons/fa";
import "./OurServicesSection.css";

const services = [
  {
    icon: <FaFileInvoiceDollar />,
    title: "Tax Compliance & Preparation",
    description:
      "Individual, business, and fiduciary tax preparation, estimates, extensions, and notice response — reviewer-ready and built to your firm's checklist.",
    link: "/services/tax",
  },
  {
    icon: <FaCalculator />,
    title: "Accounting & Bookkeeping",
    description:
      "Monthly bookkeeping, reconciliations, AP/AR, and financial statement preparation across QuickBooks and Xero.",
    link: "/services/accounting-bookkeeping",
  },

  {
    icon: <FaClipboardCheck />,
    title: "Audit & Assurance Support",
    description:
      "Trial balance tie-outs, PBC coordination, lead schedules, and workpaper documentation for faster sign-off.",
    link: "/services/auditing-assurance",
  },
  {
    icon: <FaFolderOpen />,
    title: "Administrative Support",
    description:
      "Engagement letters, billing, client communication, and workpaper compilation to free up billable hours.",
    link: "/services/admin-support",
  },

];

function OurServicesSection() {
  return (
    <section className="services-pro-section" id="services">
      <div className="services-pro-container">
        <span className="services-pro-eyebrow">WHAT WE DO</span>
        <h2>Outsourced Support Across Your Entire Engagement Lifecycle</h2>
        <p className="services-pro-subtitle">
          From individual returns to full-scope audit support, our teams
          plug directly into your existing workflows and software.
        </p>

        <div className="services-pro-grid">
          {services.map((service, index) => (
            <a
              href={service.link}
              className="services-pro-card"
              key={service.title}
              data-aos="fade-up"
              data-aos-delay={index * 80}
            >
              <div className="services-pro-icon">{service.icon}</div>

              <h3>{service.title}</h3>
              <p>{service.description}</p>

              <span className="services-pro-link">
                Learn more <FaArrowRight />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default OurServicesSection;
