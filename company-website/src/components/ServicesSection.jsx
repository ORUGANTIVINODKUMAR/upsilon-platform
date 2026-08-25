// ============================================================
// SERVICES FOR ACCOUNTING & CPA FIRMS
// Auto-sliding service tabs with accessible controls,
// internal routing, optimized headings, and descriptive images.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuCalculator,
  LuBookOpenCheck,
  LuClipboardList,
  LuFolderOpen,
  LuCheck,
} from "react-icons/lu";

import ScrollRevealHeading, { toWords } from "./ScrollRevealHeading";
import "./ServicesSection.css";

const services = [
  {
    title: "Tax Compliance",
    icon: <LuCalculator aria-hidden="true" />,
    image: "/taxcompliance.png",
    imageAlt:
      "Tax compliance and tax preparation outsourcing services for CPA firms",
    description:
      "Reduce tax season pressure with experienced professionals supporting individual, business, partnership, nonprofit, and fiduciary tax returns.",
    bullets: [
      "Form 1040, 1120, 1120S, and 1065 preparation support",
      "Form 990 and Form 1041 preparation support",
      "Extensions, estimates, and amended returns",
      "Tax notice resolution and correspondence support",
      "Tax research and technical support",
    ],
    link: "/services/tax",
  },
  {
    title: "Accounting & Bookkeeping",
    icon: <LuBookOpenCheck aria-hidden="true" />,
    image: "/accounting&bookkeeping.png",
    imageAlt:
      "Accounting and bookkeeping outsourcing services for CPA firms",
    description:
      "Keep your clients' financial records accurate and current while your internal team focuses on advisory services and client relationships.",
    bullets: [
      "Monthly and quarterly bookkeeping",
      "Bank and credit card reconciliations",
      "Accounts payable, accounts receivable, and general ledger maintenance",
      "Financial statement preparation",
    ],
    link: "/services/accounting-bookkeeping",
  },
  {
    title: "Audit & Assurance",
    icon: <LuClipboardList aria-hidden="true" />,
    image: "/audit&assurance.png",
    imageAlt:
      "Audit and assurance support services for accounting and CPA firms",
    description:
      "Receive dependable audit support for your CPA firm, from fieldwork documentation and workpaper preparation through final review.",
    bullets: [
      "Trial balance tie-outs",
      "Prepared-by-client list coordination",
      "Lead schedule preparation",
      "Internal control documentation",
      "Audit workpaper organization and review support",
    ],
    link: "/services/auditing-assurance",
  },
  {
    title: "Admin Support",
    icon: <LuFolderOpen aria-hidden="true" />,
    image: "/adminsupport.png",
    imageAlt:
      "Administrative and back-office support services for CPA firms",
    description:
      "Reduce non-billable administrative work with dedicated support professionals who integrate with your firm's processes and systems.",
    bullets: [
      "Engagement letter preparation",
      "Billing and invoicing support",
      "Client communication and follow-up",
      "Workpaper compilation and organization",
      "Document management and administrative assistance",
    ],
    link: "/services/admin-support",
  },
];

function ServicesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef(null);

  const activeService = services[activeIndex];

  const stopAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoSlide = useCallback(() => {
    stopAutoSlide();

    intervalRef.current = setInterval(() => {
      setActiveIndex((previousIndex) =>
        previousIndex === services.length - 1
          ? 0
          : previousIndex + 1
      );
    }, 2500);
  }, [stopAutoSlide]);

  useEffect(() => {
    startAutoSlide();

    return () => {
      stopAutoSlide();
    };
  }, [startAutoSlide, stopAutoSlide]);

  const handleTabClick = (index) => {
    setActiveIndex(index);
    startAutoSlide();
  };

  const handleFocus = () => {
    stopAutoSlide();
  };

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      startAutoSlide();
    }
  };

  return (
    <section
      className="services-section"
      aria-labelledby="services-heading"
      onMouseEnter={stopAutoSlide}
      onMouseLeave={startAutoSlide}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="services-container">
        <span className="services-tag" data-aos="fade-up">
          OUR SERVICES
        </span>

        <ScrollRevealHeading
          id="services-heading"
          words={toWords(
            "Accounting, Tax and Audit Outsourcing Solutions for CPA Firms",
            "navy"
          )}
        />

        <p className="services-subtitle" data-aos="fade-up">
          Whether you need seasonal tax support or year-round accounting
          assistance, Upsilon Services provides dedicated professionals who
          integrate with your team, software, and workflows. Our flexible
          delivery model helps CPA firms increase capacity, improve turnaround
          times, maintain quality standards, and reduce operating costs.
        </p>

        <div
          className="service-tabs"
          role="tablist"
          aria-label="Upsilon Services categories"
          data-aos="fade-up"
        >
          {services.map((service, index) => {
            const isActive = activeIndex === index;

            return (
              <button
                key={service.title}
                id={`service-tab-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`service-panel-${index}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabClick(index)}
                className={isActive ? "active" : ""}
              >
                {service.title}
              </button>
            );
          })}
        </div>

        <div
          id={`service-panel-${activeIndex}`}
          className="services-content"
          key={activeIndex}
          role="tabpanel"
          aria-labelledby={`service-tab-${activeIndex}`}
        >
          <div className="services-left">
            <div className="service-icon" aria-hidden="true">
              {activeService.icon}
            </div>

            <h3>{activeService.title}</h3>

            <p>{activeService.description}</p>

            <ul>
              {activeService.bullets.map((item) => (
                <li key={item}>
                  <LuCheck
                    className="check-icon"
                    aria-hidden="true"
                  />

                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              to={activeService.link}
              className="know-btn"
              aria-label={`Learn more about ${activeService.title} services`}
            >
              Learn More
            </Link>
          </div>

          <div className="services-right">
            <div className="service-image-card">
              <div className="service-image-stage">
                <img
                  src={activeService.image}
                  alt={activeService.imageAlt}
                  className="service-image"
                  loading="lazy"
                  decoding="async"
                  width="640"
                  height="480"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="all-services-link">
          <Link to="/services">
            Explore All CPA Outsourcing Services
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
