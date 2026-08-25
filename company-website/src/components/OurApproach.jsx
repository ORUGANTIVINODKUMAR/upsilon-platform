// ============================================================
// OUR APPROACH -- content beside a collaboration image
// ============================================================
import { motion } from "framer-motion";
import "./OurApproach.css";

function OurApproach() {
  return (
    <section className="approach-section">
      <div className="approach-container">
        <motion.div
          className="approach-media"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <img
            src="https://images.unsplash.com/photo-1707902665498-a202981fb5ac?auto=format&fit=crop&w=1200&q=80"
            alt="Collaborative financial review between teams"
            loading="lazy"
            decoding="async"
          />
        </motion.div>

        <motion.div
          className="approach-copy"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="approach-label">OUR APPROACH</span>
          <h2>How We Work</h2>

          <p>
            Every successful partnership begins with understanding how your
            firm operates.
          </p>
          <p>
            We take the time to learn your workflows, review standards,
            preferred software, communication style, and turnaround
            expectations.
          </p>
          <p>
            Our professionals then integrate with your existing processes,
            allowing you to expand capacity without changing the way your
            firm works.
          </p>
          <p>
            This collaborative approach enables us to deliver consistent
            results while maintaining the flexibility to support your
            firm's evolving needs.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default OurApproach;
