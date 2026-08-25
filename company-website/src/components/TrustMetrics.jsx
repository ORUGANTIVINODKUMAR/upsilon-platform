// ============================================================
// TRUST METRICS SECTION
// Premium animated counters, placed directly below "Why Upsilon".
// Counts up from 0 once the section scrolls into view (runs once).
// ============================================================
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import "./TrustMetrics.css";

const metrics = [
  { value: 55, suffix: "%", label: "Cost Savings" },
  { value: 24, suffix: "-Hour", label: "Turnaround Cycle" },
  { value: 99, suffix: "%", label: "On-Time Delivery" },
  { value: 500, suffix: "+", label: "Engagements Supported" },
  { value: 5, suffix: "+", label: "Years Supporting CPA Firms" },
];

function Counter({ value, suffix }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <span ref={ref} className="trust-metric-value">
      {display}
      {suffix}
    </span>
  );
}

function TrustMetrics() {
  return (
    <section className="trust-metrics-section">
      <div className="trust-metrics-container">
        {metrics.map((item, index) => (
          <motion.div
            className="trust-metric-card"
            key={item.label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <Counter value={item.value} suffix={item.suffix} />
            <span className="trust-metric-label">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default TrustMetrics;
