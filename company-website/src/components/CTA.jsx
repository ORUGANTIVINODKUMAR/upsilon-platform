// ============================================================
// FULL-WIDTH CONTACT CTA BANNER
// Reusable through props
// ============================================================

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LuArrowRight } from "react-icons/lu";
import "./CTA.css";

function CTA({
  title = "Ready to Expand Your CPA Firm’s Capacity?",
  description =
    "Let’s discuss your accounting, tax, audit, and back-office support needs and build a secure delivery model around your firm’s existing workflows.",
  primaryLabel = "Schedule a Consultation",
  primaryTo = "/contact",
  secondaryLabel,
  secondaryTo,
}) {
  return (
    <section
      className="cta-banner"
      aria-labelledby="cta-banner-heading"
    >
      <div className="cta-banner-glow" aria-hidden="true" />
      <div className="cta-banner-pattern" aria-hidden="true" />

      <motion.div
        className="cta-banner-content"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span className="cta-banner-label">
          Start a Conversation
        </span>

        <h2 id="cta-banner-heading">{title}</h2>

        <p>{description}</p>

        <div className="cta-banner-buttons">
          <Link to={primaryTo} className="cta-banner-btn">
            <span>{primaryLabel}</span>
            <LuArrowRight aria-hidden="true" />
          </Link>

          {secondaryLabel && secondaryTo && (
            <Link
              to={secondaryTo}
              className="cta-banner-btn-outline"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>

        <div className="cta-banner-trust">
          Secure workflows · Flexible support · CPA-focused delivery
        </div>
      </motion.div>
    </section>
  );
}

export default CTA;