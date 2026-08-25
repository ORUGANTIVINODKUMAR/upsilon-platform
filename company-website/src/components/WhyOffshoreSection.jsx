// ============================================================
// WHY FIRMS CHOOSE OFFSHORE ACCOUNTING
// Four premium cards, each with an icon-led illustration treatment.
// ============================================================
import { motion } from "framer-motion";
import { LuBadgeDollarSign, LuGraduationCap, LuZap, LuLayers } from "react-icons/lu";
import "./WhyOffshoreSection.css";

const cards = [
  {
    icon: <LuBadgeDollarSign />,
    title: "Lower Operating Costs",
    description:
      "Cut staffing overhead by up to 55% compared to local hiring, without sacrificing quality or turnaround.",
  },
  {
    icon: <LuGraduationCap />,
    title: "Access to Skilled Professionals",
    description:
      "Work with accounting professionals trained specifically on U.S. tax, audit, and bookkeeping standards.",
  },
  {
    icon: <LuZap />,
    title: "Faster Turnaround",
    description:
      "Time-zone overlap keeps work moving around the clock, so tasks are often ready before your team logs on.",
  },
  {
    icon: <LuLayers />,
    title: "Scalable Capacity",
    description:
      "Flex your team up or down during tax season and slow periods, without the lag of traditional hiring cycles.",
  },
];

function WhyOffshoreSection() {
  return (
    <section className="offshore-section">
      <div className="offshore-container">
        <span className="offshore-label">THE CASE FOR OFFSHORE</span>
        <h2>Why Firms Choose Offshore Accounting</h2>

        <div className="offshore-grid">
          {cards.map((card, index) => (
            <motion.div
              className="offshore-card"
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <div className="offshore-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyOffshoreSection;
