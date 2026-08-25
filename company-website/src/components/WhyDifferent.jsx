import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  LuBuilding2,
  LuUserCheck,
  LuShieldCheck,
  LuLayers,
  LuBadgeCheck,
  LuPlug,
  LuArrowRight,
} from "react-icons/lu";

import "./WhyDifferent.css";

const cards = [
  {
    icon: LuBuilding2,
    title: "Built Specifically for CPA Firms",
    text:
      "Our accounting outsourcing services are designed for CPA and accounting firms that need dependable support for bookkeeping, tax preparation, audit support, and back-office operations.",
  },
  {
    icon: LuUserCheck,
    title: "Dedicated Accounting Professionals",
    text:
      "Work with professionals who understand your workflows, review standards, communication preferences, software environment, and client-service expectations.",
  },
  {
    icon: LuShieldCheck,
    title: "Security and Confidentiality",
    text:
      "Engagements are supported by confidentiality agreements, controlled access, secure operating procedures, and clearly defined responsibilities.",
  },
  {
    icon: LuLayers,
    title: "Flexible and Scalable Support",
    text:
      "Expand capacity during tax season or maintain year-round accounting support that adjusts to changing workloads, deadlines, and growth plans.",
  },
  {
    icon: LuBadgeCheck,
    title: "Reviewer-Ready Quality",
    text:
      "Structured preparation and review processes help produce organized workpapers, consistent deliverables, and cleaner files for manager and partner review.",
  },
  {
    icon: LuPlug,
    title: "Works With Your Existing Software",
    text:
      "Our team works within your accounting, tax, document-management, communication, and workflow systems to simplify onboarding and reduce disruption.",
  },
];

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

function WhyDifferent() {
  return (
    <section
      className="why-different-section"
      aria-labelledby="why-upsilon-heading"
    >
      <div className="why-different-container">
        <motion.header
          className="why-different-header"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <span className="why-different-label">
            Why Upsilon Services
          </span>

          <h2 id="why-upsilon-heading">
            More Than an Outsourcing Provider—
            <span> An Extension of Your CPA Firm</span>
          </h2>

          <p className="why-different-subtitle">
            Upsilon Services combines experienced accounting professionals,
            secure delivery practices, structured quality processes, and
            scalable support to help CPA firms increase capacity without
            compromising confidentiality, consistency, or client service.
          </p>
        </motion.header>

        <div className="why-different-grid">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.article
                className="why-different-card"
                key={card.title}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.18 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.06,
                  ease: "easeOut",
                }}
              >
                <div className="why-different-card-top">
                  <div
                    className="why-different-icon"
                    aria-hidden="true"
                  >
                    <Icon />
                  </div>

                  <span
                    className="why-different-number"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3>{card.title}</h3>

                <p>{card.text}</p>

                <span
                  className="why-different-card-line"
                  aria-hidden="true"
                />
              </motion.article>
            );
          })}
        </div>

        <motion.div
          className="why-different-cta"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5 }}
        >
          <div className="why-different-cta-copy">
            <span className="why-different-cta-label">
              Build a dependable extension of your firm
            </span>

            <h3>
              Add accounting capacity without rebuilding your internal team.
            </h3>

            <p>
              Start with a focused engagement and expand as your needs grow.
            </p>
          </div>

          <Link
            to="/contact"
            className="why-different-cta-link"
            aria-label="Talk to Upsilon Services about accounting outsourcing"
          >
            <span>Talk to Our Experts</span>
            <LuArrowRight aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default WhyDifferent;