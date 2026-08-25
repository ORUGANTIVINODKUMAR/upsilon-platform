// Shared layout used by every /services/* detail page.
// Each page just passes its own content in as props.
import { FaCheckCircle } from "react-icons/fa";
import PageHeader from "./PageHeader";
import "./ServiceDetailLayout.css";

function ServiceDetailLayout({
  eyebrow,
  title,
  subtitle,
  intro,
  features,
  process,
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <section className="service-detail-section">
        <div className="service-detail-container">
          <div className="service-detail-intro">
            <p>{intro}</p>
          </div>

          <div className="service-detail-grid">
            <div className="service-detail-features">
              <h3>What's Included</h3>
              <ul>
                {features.map((item) => (
                  <li key={item}>
                    <FaCheckCircle />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="service-detail-process">
              <h3>How It Works</h3>
              {process.map((step, index) => (
                <div className="service-detail-step" key={step.title}>
                  <span className="service-detail-step-num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="service-detail-cta">
            <div>
              <h3>Ready to see if this fits your firm?</h3>
              <p>
                Tell us about your current workload and we'll recommend a
                team structure that matches it.
              </p>
            </div>
            <a href="/contact" className="service-detail-cta-btn">
              Talk to Our Experts
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default ServiceDetailLayout;
