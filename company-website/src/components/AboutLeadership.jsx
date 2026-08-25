// ============================================================
// MEET OUR LEADERSHIP
// Leadership profiles for Upsilon Services.
// ============================================================

import { motion } from "framer-motion";
import "./AboutLeadership.css";

const leaders = [
  {
    photo: "/1.png",
    name: "Sai Teja Kukudala, EA",
    role: "Managing Partner & Operational Head",
    alt: "Sai Teja Kukudala, EA, Managing Partner and Operational Head at Upsilon Services",
  },
  {
    photo: "/2.jpg",
    name: "Koren S. Cranford, CPA",
    role: "Strategic Advisor",
    alt: "Koren S. Cranford, CPA, Strategic Advisor at Upsilon Services",
  },
  {
    photo: "/3.png",
    name: "Michael Bradford, CPA",
    role: "Chief Growth Officer",
    alt: "Michael Bradford, CPA, Chief Growth Officer at Upsilon Services",
  },
  {
    photo: "/4.jpg",
    name: "Aditya Kalidindi",
    role: "Strategic Advisor & Board Member",
    alt: "Aditya Kalidindi, Strategic Advisor and Board Member at Upsilon Services",
  },
];

function AboutLeadership() {
  return (
    <section
      className="leadership-section"
      aria-labelledby="leadership-heading"
    >
      <div className="leadership-container">
        <span className="leadership-label">OUR LEADERSHIP</span>

        <h2 id="leadership-heading">
          Experienced Leadership Supporting CPA Firm Growth
        </h2>

        <p className="leadership-subtitle">
          Our leadership team brings together accounting, tax, operations,
          advisory, and business development experience to help CPA firms build
          secure, scalable, and high-quality offshore delivery teams.
        </p>

        <div className="leadership-grid">
          {leaders.map((leader, index) => (
            <motion.article
              className="leadership-card"
              key={leader.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.4,
                delay: index * 0.08,
              }}
            >
              <div className="leadership-photo">
                <img
                  src={leader.photo}
                  alt={leader.alt}
                  loading="lazy"
                  decoding="async"
                  width="320"
                  height="320"
                />
              </div>

              <h3>{leader.name}</h3>

              <p className="leadership-role">
                {leader.role}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AboutLeadership;