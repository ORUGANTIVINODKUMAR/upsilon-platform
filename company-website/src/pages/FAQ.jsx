import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { faqs } from "../data/faqs";
import usePageMeta from "../hooks/usePageMeta";
import useStructuredData from "../hooks/useStructuredData";
import { buildFaqSchema } from "../data/schema";
import "../components/FAQSection.css";

function FAQ() {
  usePageMeta({
    title: "Frequently Asked Questions",
    description:
      "Answers to common questions about outsourcing tax, accounting, and audit support to Upsilon Services, including how engagements, security, and pricing work.",
    path: "/faq",
  });
  useStructuredData(buildFaqSchema(faqs), "faq-schema");

  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <main>
      <section className="faq-section faq-page">
        <div className="faq-container">
          <div className="faq-heading">
            <span>FAQ</span>
            <h2>
              Frequently Asked <em>Questions.</em>
            </h2>
            <p>
              Everything CPA and accounting firms need to know before working
              with Upsilon.
            </p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className={`faq-item ${openIndex === index ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                >
                  <span>{faq.question}</span>
                  <LuPlus className="faq-icon" />
                </button>

                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default FAQ;