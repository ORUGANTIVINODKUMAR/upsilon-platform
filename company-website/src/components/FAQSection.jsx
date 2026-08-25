import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LuPlus, LuArrowRight } from "react-icons/lu";
import { faqs } from "../data/faqs";
import ScrollRevealHeading, { toWords } from "./ScrollRevealHeading";
import "./FAQSection.css";

function FAQSection() {
  // null means every FAQ is closed when the page first loads.
  const [openIndex, setOpenIndex] = useState(null);

  // Show only two questions on the homepage.
  const homeFaqs = faqs.slice(0, 2);

  const handleToggle = (index) => {
    setOpenIndex((currentIndex) =>
      currentIndex === index ? null : index
    );
  };

  return (
    <section
      className="faq-section"
      aria-labelledby="homepage-faq-heading"
    >
      <div className="faq-container">
        <header className="faq-heading" data-aos="fade-up">
          <span className="faq-eyebrow">
            Frequently Asked Questions
          </span>

          <ScrollRevealHeading
            id="homepage-faq-heading"
            words={[
              ...toWords("Questions CPA Firms Ask About", "navy"),
              ...toWords("Outsourcing Services", "green"),
            ]}
          />

          <p>
            Learn more about outsourced accounting, bookkeeping, tax
            preparation, audit support, data security, onboarding, and
            software compatibility.
          </p>
        </header>

        <div
          className="faq-list"
          data-aos="fade-up"
          aria-label="Frequently asked questions"
        >
          {homeFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const questionId = `homepage-faq-question-${index}`;
            const answerId = `homepage-faq-answer-${index}`;

            return (
              <article
                key={faq.question}
                className={`faq-item ${isOpen ? "active" : ""}`}
              >
                <h3 className="faq-item-heading">
                  <button
                    id={questionId}
                    type="button"
                    className="faq-question"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => handleToggle(index)}
                  >
                    <span>{faq.question}</span>

                    <span
                      className="faq-icon-wrap"
                      aria-hidden="true"
                    >
                      <LuPlus className="faq-icon" />
                    </span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={answerId}
                      className="faq-answer"
                      role="region"
                      aria-labelledby={questionId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="faq-answer-inner">
                        <p>{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })}
        </div>

        <div className="faq-more-wrap" data-aos="fade-up">
          <Link
            to="/faq"
            className="faq-more-btn"
            aria-label="View all frequently asked questions"
          >
            <span>View All FAQs</span>
            <LuArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FAQSection;