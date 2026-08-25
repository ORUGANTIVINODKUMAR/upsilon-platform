// ============================================================
// WHY CPA FIRMS PARTNER WITH UPSILON
// ============================================================

import { motion } from "framer-motion";
import { LuCheck } from "react-icons/lu";
import "./WhyPartner.css";

const points = [
  "Expand your firm's capacity without the time and cost of hiring additional in-house staff.",
  "Reduce operating costs through secure and scalable offshore accounting support.",
  "Strengthen data security with NDAs, controlled access, and confidential workflows.",
  "Meet tax season deadlines and improve turnaround times during peak workloads.",
  "Work with dedicated accounting professionals who integrate with your firm's processes and review standards.",
  "Scale accounting, bookkeeping, tax, audit, and back-office support as your client base grows.",
];

function WhyPartner() {
  return (
    <section
      className="partner-section"
      aria-labelledby="partner-heading"
    >
      <div className="partner-container">
        <span className="partner-label">
          WHY CPA FIRMS CHOOSE UPSILON
        </span>

        <h2 id="partner-heading">
          Helping CPA Firms Grow with Reliable Offshore Accounting Support
        </h2>

        <p className="partner-subtitle">
          Upsilon Services enables CPA and accounting firms to increase
          capacity, improve efficiency, reduce costs, and maintain exceptional
          quality through experienced offshore accounting professionals.
        </p>

        <div className="partner-grid">
          {points.map((point, index) => (
            <motion.article
              className="partner-card"
              key={point}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
              }}
            >
              <span
                className="partner-check"
                aria-hidden="true"
              >
                <LuCheck />
              </span>

              <p>{point}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyPartner;