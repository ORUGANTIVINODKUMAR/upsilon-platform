// ============================================================
// WHY UPSILON SECTION
// Premium two-column layout: copy + bullet list on the left,
// a collaboration image on the right. Six detail cards are kept
// below in a unified panel.
// ============================================================
import { motion } from "framer-motion";
import { LuCoins, LuTarget, LuGlobe, LuTrendingUp, LuHandshake, LuRocket } from "react-icons/lu";
import ScrollRevealHeading, { toWords } from "./ScrollRevealHeading";
import "./WhyUpsilon.css";

const benefits = [
  {
    icon: <LuCoins />,
    title: "Up to 35-55% Cost Savings",
    description:
      "Reduce staffing and overhead costs significantly compared to local hiring, without compromising on quality.",
  },
  {
    icon: <LuTarget />,
    title: "Focus on High-Value Client Work",
    description:
      "Offload routine production work so your partners and staff can concentrate on advisory and client relationships.",
  },
  {
    icon: <LuGlobe />,
    title: "Time Zone Advantage",
    description:
      "Work keeps moving while your office is closed, so tasks are often ready for review before your team logs on.",
  },
  {
    icon: <LuTrendingUp />,
    title: "Competitive Business Edge",
    description:
      "Scale capacity quickly to take on more clients without the lag time of traditional hiring cycles.",
  },
  {
    icon: <LuHandshake />,
    title: "Experienced & Trusted Professionals",
    description:
      "Every team member is trained specifically on U.S. tax, accounting, and audit support standards.",
  },
  {
    icon: <LuRocket />,
    title: "Scale Your Firm with Confidence",
    description:
      "Grow at your own pace with a flexible team structure that expands or contracts with your workload.",
  },
];

function WhyUpsilon() {
  return (
    <section className="why-section">
      <div className="why-intro-grid">
        <motion.div
          className="why-intro-copy"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="why-label">WHY UPSILON</span>
          <ScrollRevealHeading
            words={toWords(
              "More Than an Outsourcing Provider - An Extension of Your Firm",
              "navy"
            )}
          />
          <p>
            Every CPA firm has its own workflows, review standards, and client expectations. Upsilon integrates seamlessly with your existing processes to provide accounting, tax, audit, and back-office support that feels like an extension of your in-house team. By combining experienced professionals, secure delivery practices, and flexible engagement models, we help firms increase capacity, reduce operational costs, improve turnaround times, and free partners to focus on client relationships and business growth.
          </p>


          
        </motion.div>

        <motion.div
          className="why-intro-media"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <img
            src="/whyupsilon.png"
            alt="US CPA firm collaborating virtually with an offshore accounting team"
            loading="lazy"
            decoding="async"
          />
        </motion.div>
      </div>

      {/* ---- Single unified premium container holding all six benefits ---- */}
      <motion.div
        className="why-panel"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
      >
        <div className="why-panel-grid">
          {benefits.map((item, index) => (
            <motion.div
              className="why-benefit"
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <div className="why-benefit-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export default WhyUpsilon;
