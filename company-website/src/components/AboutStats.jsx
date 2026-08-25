// ============================================================
// ABOUT PAGE CLOSING STATS
// ============================================================

import { motion } from "framer-motion";
import CountUpNumber from "./CountUpNumber";
import "./AboutStats.css";

const stats = [
  {
    end: 5,
    suffix: "+ Yrs",
    label: "Supporting U.S. accounting firms",
  },
  {
    end: 4000,
    suffix: "+",
    label: "Engagements delivered",
  },
  {
    end: 92,
    suffix: "%",
    label: "On-time delivery rate",
  },
];

function AboutStats() {
  return (
    <section
      className="about-stats-section"
      aria-label="Upsilon Services experience and delivery statistics"
    >
      <div className="about-stats-container">
        {stats.map((stat, index) => (
          <motion.div
            className="about-stats-card"
            key={stat.label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.4,
              delay: index * 0.08,
            }}
          >
            <strong className="about-stats-value">
              <CountUpNumber
                end={stat.end}
                suffix={stat.suffix}
              />
            </strong>

            <span className="about-stats-label">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default AboutStats;