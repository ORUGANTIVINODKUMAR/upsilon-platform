// ============================================================
// OUR STORY
// Two-column section with company story and supporting image.
// ============================================================

import { motion } from "framer-motion";
import "./OurStory.css";

function OurStory() {
  return (
    <section
      className="story-section"
      aria-labelledby="our-story-heading"
    >
      <div className="story-container">
        <motion.div
          className="story-copy"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="story-label">OUR STORY</span>

          <h2 id="our-story-heading">
            Built Around the Staffing and Delivery Needs of CPA Firms
          </h2>

          <p>
            Upsilon Services was founded with a clear purpose: to help CPA
            and accounting firms overcome staffing shortages, seasonal
            workload pressure, and capacity constraints without compromising
            quality, confidentiality, or client service.
          </p>

          <p>
            As firms face increasing tax workloads, tighter deadlines, rising
            operating costs, and ongoing hiring challenges, we recognized the
            need for an outsourcing partner that understands the realities of
            public accounting—not just task completion.
          </p>

          <p>
            Today, Upsilon Services supports CPA firms across the United
            States with dedicated professionals experienced in accounting,
            bookkeeping, tax preparation, audit support, and administrative
            services.
          </p>

          <p>
            Our professionals integrate with each firm's existing software,
            workflows, communication procedures, and review standards,
            allowing the internal team to maintain control while gaining
            dependable additional capacity.
          </p>

          <p>
            Our goal is not simply to complete assigned work. We aim to become
            a reliable extension of your team and support sustainable,
            long-term growth through secure and scalable offshore accounting
            services.
          </p>
        </motion.div>

        <motion.div
          className="story-media"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <img
            src="/ourstory.png"
            alt="Upsilon Services accounting professionals collaborating in a business meeting"
            loading="lazy"
            decoding="async"
          />
        </motion.div>
      </div>
    </section>
  );
}

export default OurStory;