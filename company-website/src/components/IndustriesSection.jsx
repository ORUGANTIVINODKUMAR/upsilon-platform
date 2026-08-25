// ============================================================
// WHO WE SERVE
// Premium cards highlighting the accounting professionals
// and firms supported by Upsilon Services.
// ============================================================

import { motion } from "framer-motion";
import {
  LuLandmark,
  LuBuilding,
  LuCalculator,
  LuReceipt,
  LuScrollText,
  LuBriefcase,
} from "react-icons/lu";
import "./IndustriesSection.css";

const industries = [
  {
    icon: <LuLandmark aria-hidden="true" />,
    label: "CPA Firms",
    description:
      "Flexible accounting, tax, audit, and back-office support for growing CPA firms.",
  },
  {
    icon: <LuBuilding aria-hidden="true" />,
    label: "Public Accounting Firms",
    description:
      "Scalable delivery support for firms managing complex workloads and seasonal deadlines.",
  },
  {
    icon: <LuCalculator aria-hidden="true" />,
    label: "Accounting Practices",
    description:
      "Reliable bookkeeping, monthly close, reporting, and client accounting support.",
  },
  {
    icon: <LuReceipt aria-hidden="true" />,
    label: "Tax Professionals",
    description:
      "Tax preparation and workpaper support designed to improve capacity during busy season.",
  },
  {
    icon: <LuScrollText aria-hidden="true" />,
    label: "Enrolled Agent Firms",
    description:
      "Dedicated support for tax compliance, return preparation, documentation, and review.",
  },
  {
    icon: <LuBriefcase aria-hidden="true" />,
    label: "CAS & Advisory Practices",
    description:
      "Ongoing client accounting services support for advisory-focused accounting practices.",
  },
];

function IndustriesSection() {
  return (
    <section
      className="industries-section"
      aria-labelledby="industries-heading"
    >
      <div className="industries-container">
        <span className="industries-label">WHO WE SERVE</span>

        <h2 id="industries-heading">
          Accounting and Tax Professionals We Support
        </h2>

        <p className="industries-subtitle">
          Upsilon Services partners with CPA firms, accounting practices, tax
          professionals, and advisory teams across the United States that need
          secure, dependable, and scalable offshore support.
        </p>

        <div className="industries-grid">
          {industries.map((item, index) => (
            <motion.article
              className="industries-card"
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.4,
                delay: index * 0.06,
              }}
            >
              <div className="industries-icon" aria-hidden="true">
                {item.icon}
              </div>

              <h3>{item.label}</h3>

              <p>{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default IndustriesSection;