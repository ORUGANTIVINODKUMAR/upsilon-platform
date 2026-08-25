// ============================================================
// SECURITY & COMPLIANCE SECTION
// Left: heading + four certification/security cards.
// Right: supporting security and compliance content.
// ============================================================

import { motion } from "framer-motion";
import { LuShieldCheck } from "react-icons/lu";
import ScrollRevealHeading, { toWords } from "./ScrollRevealHeading";
import "./SecuritySection.css";

const cards = [
  {
    type: "image",
    src: "/iso.png",
    label: "ISO 27001",
    subtitle: "Information Security Management",
  },
  {
    type: "image",
    src: "/cmmi.png",
    label: "CMMI Level 3",
    subtitle: "Process Quality Assurance",
  },
  {
    type: "image",
    src: "/nda.png",
    label: "NDA Agreement",
    subtitle: "Every engagement is backed by an NDA",
  },
  {
    type: "icon",
    icon: <LuShieldCheck aria-hidden="true" />,
    label: "Controlled Access",
    subtitle: "Role-based access using least-privilege principles",
  },
];

function SecuritySection() {
  return (
    <section
      className="security-section"
      aria-labelledby="security-compliance-heading"
    >
      <div className="security-container">
        <div className="security-left" data-aos="fade-right">
          <span className="security-tag">
            SECURITY &amp; COMPLIANCE
          </span>

          <ScrollRevealHeading
            id="security-compliance-heading"
            words={toWords(
              "Enterprise Security & Compliance for CPA Outsourcing",
              "navy"
            )}
          />

          <div className="cert-grid">
            {cards.map((card, index) => (
              <motion.div
                className="cert-card"
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                }}
              >
                {card.type === "image" ? (
                  <div className="cert-card-media">
                    <img
                      src={card.src}
                      alt={`${card.label} security and compliance standard used by Upsilon Services`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div
                    className="cert-card-media cert-card-icon"
                    aria-hidden="true"
                  >
                    {card.icon}
                  </div>
                )}

                <div className="cert-card-text">
                  <span className="cert-card-title">
                    {card.label}
                  </span>

                  <span className="cert-card-subtitle">
                    {card.subtitle}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="security-right" data-aos="fade-left">
          <p>
            At <strong>Upsilon Services</strong>, protecting client
            financial data is a core part of every engagement. Our
            accounting, tax, audit, and back-office outsourcing services
            are supported by secure workflows, confidentiality controls,
            and clearly defined access permissions.
          </p>

          <p>
            We follow structured processes designed to protect sensitive
            financial information, maintain client confidentiality, and
            support consistent operational quality.
          </p>

          <p>
            Our security framework is supported by internationally
            recognized standards, including <strong>ISO 27001</strong> and{" "}
            <strong>CMMI Level 3</strong>.
          </p>

          <p>
            Every engagement is backed by a signed{" "}
            <strong>non-disclosure agreement</strong> and strict
            confidentiality procedures, helping ensure that client data is
            handled responsibly throughout the engagement.
          </p>

          <p>
            Through controlled access, encrypted workflows, secure
            infrastructure, and transparent communication, we provide
            dependable offshore accounting and tax support that CPA firms
            can trust.
          </p>
        </div>
      </div>
    </section>
  );
}

export default SecuritySection;