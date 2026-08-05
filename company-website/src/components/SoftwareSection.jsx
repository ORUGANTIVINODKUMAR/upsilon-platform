import { LuAppWindow, LuCheck } from "react-icons/lu";
import ScrollRevealHeading, { toWords } from "./ScrollRevealHeading";
import "./SoftwareSection.css";

// The heading split into scroll-revealed words. The green line breaks
// onto its own row to match the design.
const headingWords = [
  ...toWords("Compatible With the Accounting and Tax Software", "navy"),
  ...toWords("Your Firm Already Uses", "green", { breakBefore: true }),
];

const softwareList = [
  { name: "Drake Tax", logo: "/drake.jpg" },
  { name: "ProSeries", logo: "/proseries.png" },
  { name: "ProConnect", logo: "/proconnect.png" },
  { name: "QuickBooks", logo: "/quickbooks.png" },
  { name: "CCH Axcess", logo: "/cch.png" },
  { name: "UltraTax CS", logo: "/ultratax.jpeg" },
  { name: "Lacerte", logo: "/lacerte.png" },
  { name: "Xero", logo: "/xero.png" },
  { name: "Wave", logo: "/wave.png" },
  { name: "SurePrep", logo: "/sureprep.png" },
  { name: "Bloomberg Tax", logo: "/bloomberg.jpg" },
  { name: "GoSystem Tax RS", logo: "/gosystem.png" },
  { name: "Canopy", logo: "/canopy.png" },
  { name: "Thomson Reuters", logo: "/thomson.png" },
];

const marqueeItems = [...softwareList, ...softwareList];

const benefits = [
  "Work directly inside your existing systems",
  "Reduce software migration and onboarding time",
  "Maintain your firm's established workflows",
];

function SoftwareSection() {
  return (
    <section
      className="software-section"
      aria-labelledby="software-heading"
    >
      <div className="software-container">
        <div className="software-header">
          <span className="software-eyebrow" data-aos="fade-up">
            Software Compatibility
          </span>

          <ScrollRevealHeading
            id="software-heading"
            className="software-reveal-heading"
            words={headingWords}
          />

          <p className="software-subtitle" data-aos="fade-up">
            Our professionals work within your existing accounting, tax,
            document-management, and workflow platforms, helping your CPA
            firm expand capacity without changing established systems.
          </p>
        </div>

        <div
          className="software-marquee"
          data-aos="fade-up"
          aria-label="Accounting and tax software platforms supported by Upsilon Services"
        >
          <div
            className="software-fade software-fade-left"
            aria-hidden="true"
          />

          <div
            className="software-fade software-fade-right"
            aria-hidden="true"
          />

          <div className="software-marquee-track">
            {marqueeItems.map((item, index) => (
              <article
                className="software-card"
                key={`${item.name}-${index}`}
                aria-hidden={index >= softwareList.length}
              >
                <div className="software-card-logo">
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt={
                        index < softwareList.length
                          ? `${item.name} accounting or tax software logo`
                          : ""
                      }
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <LuAppWindow
                      className="software-card-placeholder"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <span className="software-card-name">
                  {item.name}
                </span>
              </article>
            ))}
          </div>
        </div>
{/* Temporarily hidden
        <div className="software-benefits" data-aos="fade-up">
          {benefits.map((benefit) => (
            <div className="software-benefit" key={benefit}>
              <span className="software-benefit-icon">
                <LuCheck aria-hidden="true" />
              </span>

              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <p className="software-note" data-aos="fade-up">
          Don&apos;t see your platform listed? Our team can adapt to many
          accounting, tax, payroll, practice-management, and document systems.
        </p>
        */}
      </div>
    </section>
  );
}

export default SoftwareSection;