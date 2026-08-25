// ============================================================
// TESTIMONIALS SECTION
//
// PLACEHOLDER CONTENT -- these quotes and roles are illustrative
// examples only, not real client feedback. Replace with real,
// permissioned testimonials (named or anonymized per your
// clients' preference) before publishing this live. Presenting
// fabricated quotes as genuine client feedback on a live site
// could be misleading to visitors -- swap these out first.
// ============================================================
import { motion } from "framer-motion";
import { LuQuote } from "react-icons/lu";
import "./TestimonialsSection.css";

const testimonials = [
  {
    quote:
      "Upsilon quickly became an extension of our team. Their responsiveness, quality of work, and understanding of CPA firm workflows exceeded our expectations.",
    role: "Managing Partner",
    firm: "CPA Firm — Texas",
  },
  {
    quote:
      "The biggest advantage was scalability during tax season without compromising quality.",
    role: "Managing Partner",
    firm: "CPA Firm — Ohio",
  },
  {
    quote:
      "Turnaround times improved almost immediately, and the review process felt like working with our own staff, not an outside vendor.",
    role: "Tax Director",
    firm: "CPA Firm — California",
  },
];

function TestimonialsSection() {
  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <span className="testimonials-label">CLIENT FEEDBACK</span>
        <h2>Trusted by CPA Firms Across the U.S.</h2>
        <p className="testimonials-note">
          Illustrative example feedback — replace with real, permissioned
          client quotes.
        </p>

        <div className="testimonials-grid">
          {testimonials.map((item, index) => (
            <motion.div
              className="testimonial-card"
              key={item.firm}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
            >
              <LuQuote className="testimonial-quote-icon" />
              <p className="testimonial-quote">{item.quote}</p>
              <div className="testimonial-author">
                <span className="testimonial-role">{item.role}</span>
                <span className="testimonial-firm">{item.firm}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
