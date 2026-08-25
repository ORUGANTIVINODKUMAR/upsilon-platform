// ============================================================
// HOW WE WORK -- 5-step animated process timeline
// ============================================================
import { motion } from "framer-motion";
import {
  LuSearch,
  LuShieldCheck,
  LuBookOpenCheck,
  LuUsers,
  LuHeadset,
} from "react-icons/lu";
import "./ProcessSection.css";

const steps = [
  {
    icon: <LuSearch />,
    title: "Discovery",
    description:
      "We learn your firm's workflows, software stack, review standards, and where you need the most support.",
  },
  {
    icon: <LuShieldCheck />,
    title: "Secure Onboarding",
    description:
      "NDAs, access controls, and secure infrastructure are set up before any client data changes hands.",
  },
  {
    icon: <LuBookOpenCheck />,
    title: "Knowledge Transfer",
    description:
      "Your SOPs, templates, and checklists are documented so our team works exactly the way yours does.",
  },
  {
    icon: <LuUsers />,
    title: "Dedicated Team",
    description:
      "A consistent team is assigned to your firm, so you build familiarity instead of starting over each engagement.",
  },
  {
    icon: <LuHeadset />,
    title: "Continuous Support",
    description:
      "Ongoing communication, reporting, and quality checks keep the partnership accountable as your needs evolve.",
  },
];

function ProcessSection() {
  return (
    <section className="process-section">
      <div className="process-container">
        <span className="process-label">HOW WE WORK</span>
        <h2>A Clear Path From First Call to Delivery</h2>

        <div className="process-timeline">
          {steps.map((step, index) => (
            <motion.div
              className="process-step"
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
            >
              <div className="process-step-marker">
                <div className="process-step-icon">{step.icon}</div>
                <span className="process-step-number">{index + 1}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProcessSection;
