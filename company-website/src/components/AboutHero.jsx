// ============================================================
// ABOUT PAGE HERO
// Full-width background image with a premium dark overlay.
// ============================================================

import { motion } from "framer-motion";
import "./AboutHero.css";

function AboutHero() {
  return (
    <section
      className="about-hero-section"
      style={{
        backgroundImage: "url(/aboutupsilon.png)",
      }}
      aria-labelledby="about-hero-heading"
    >
      <div className="about-hero-overlay"></div>

      <div className="about-hero-container">
        <motion.div
          className="about-hero-copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
        >
          <span className="about-hero-label">
            ABOUT UPSILON SERVICES
          </span>

          <h1 id="about-hero-heading">
            Trusted Accounting & Tax Outsourcing Partner for CPA Firms
          </h1>

          <p>
            Upsilon Services helps CPA and accounting firms across the United
            States expand capacity through secure, scalable, and reliable
            accounting outsourcing, tax preparation, bookkeeping, audit
            support, and back-office solutions.
          </p>

          <p>
            We become an extension of your firm by integrating with your
            existing team, software, and workflows while maintaining the
            highest standards of quality, confidentiality, responsiveness,
            and client service.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default AboutHero;