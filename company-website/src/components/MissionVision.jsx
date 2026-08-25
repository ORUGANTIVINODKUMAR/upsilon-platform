// ============================================================
// MISSION & VISION
// Two premium cards highlighting Upsilon's purpose and long-term vision.
// ============================================================

import { motion } from "framer-motion";
import { LuTarget, LuTelescope } from "react-icons/lu";
import "./MissionVision.css";

function MissionVision() {
  return (
    <section
      className="mv-section"
      aria-labelledby="mission-vision-heading"
    >
      <div className="mv-container">
        <h2 id="mission-vision-heading" className="sr-only">
          Upsilon Services Mission and Vision
        </h2>

        <motion.div
          className="mv-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
        >
          <div className="mv-icon" aria-hidden="true">
            <LuTarget />
          </div>

          <h3>Our Mission</h3>

          <p>
            Our mission is to help CPA and accounting firms expand their
            capacity through secure, scalable, and reliable accounting
            outsourcing, tax preparation, bookkeeping, audit support, and
            back-office solutions. We enable firms to improve efficiency,
            maintain quality, and achieve sustainable long-term growth while
            delivering exceptional client service.
          </p>
        </motion.div>

        <motion.div
          className="mv-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <div className="mv-icon" aria-hidden="true">
            <LuTelescope />
          </div>

          <h3>Our Vision</h3>

          <p>
            Our vision is to become the most trusted accounting outsourcing
            partner for CPA firms by building long-term relationships founded
            on quality, security, transparency, innovation, and exceptional
            client service. We strive to be a seamless extension of every
            firm's team and contribute to their continued success.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default MissionVision;