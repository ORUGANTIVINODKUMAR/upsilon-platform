import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import { faqs } from "../data/faqs";
import "../components/FAQSection.css";

function FAQ() {
  // null means every FAQ is closed when the page first opens.
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex((currentIndex) =>
      currentIndex === index ? null : index
    );
  };

  return (
    <main>
      <section
        className="faq-section faq-page"
        aria-labelledby="faq-page-heading"
      >
        <div className="faq-container">
          <header className="faq-heading">
            <span className="faq-eyebrow">
              Frequently Asked Questions
            </span>

            <h1 id="faq-page-heading">
              Frequently Asked <em>Questions</em>
            </h1>

            <p>
              Everything CPA and accounting firms need to know before working
              with Upsilon Services.
            </p>
          </header>

          <div
            className="faq-list"
            aria-label="Frequently asked questions about Upsilon Services"
          >
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const questionId = `faq-page-question-${index}`;
              const answerId = `faq-page-answer-${index}`;

              return (
                <article
                  key={faq.question}
                  className={`faq-item ${isOpen ? "active" : ""}`}
                >
                  <h2 className="faq-item-heading">
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
                  </h2>

                  {isOpen && (
                    <div
                      id={answerId}
                      className="faq-answer"
                      role="region"
                      aria-labelledby={questionId}
                    >
                      <div className="faq-answer-inner">
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

export default FAQ;