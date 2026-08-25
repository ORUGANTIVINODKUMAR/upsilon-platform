import { useState } from "react";
import {
  FaFilePdf,
  FaFilePowerpoint,
  FaDownload,
} from "react-icons/fa";

import PageHeader from "../components/PageHeader";
import DownloadModal from "../components/DownloadModal";
import usePageMeta from "../hooks/usePageMeta";

import "./Resources.css";

const downloadableResources = [
  {
    key: "offshoring-guide",
    title: "Choose If Offshoring Fits Your Firm",
    description:
      "A practical decision guide to help CPA firm owners evaluate whether offshore accounting support is the right next capacity move.",
    file: "/resources/choose-if-offshoring-fits-your-firm.pdf",
    type: "pdf",
  },
  {
    key: "pilot-playbook",
    title: "Offshore Accounting Pilot Playbook",
    description:
      "A step-by-step framework for running a low-risk offshore accounting pilot before expanding firm-wide.",
    file: "/resources/offshore-accounting-pilot-playbook.pdf",
    type: "pdf",
  },
];

function Resources() {
  usePageMeta({
    title: "CPA Firm Resources, Guides & Outsourcing Insights",
    description:
      "Explore accounting outsourcing guides, CPA firm resources, practical insights, downloadable playbooks, and articles from Upsilon Services.",
    path: "/resources",
  });

  const [activeResource, setActiveResource] = useState(null);

  return (
    <>
      <PageHeader
        eyebrow="RESOURCES"
        title="Guides & Insights for Accounting Firms"
        subtitle="Explore practical resources, downloadable guides, and articles for CPA firms seeking secure and scalable accounting outsourcing support."
      />

      <section
        className="resources-section downloadable-resources-section"
        aria-labelledby="downloadable-resources-heading"
      >
        <div className="resources-container">
          <div className="resources-intro">
            <span className="resources-label">FREE DOWNLOADS</span>

            <h2 id="downloadable-resources-heading">
              Downloadable Guides for CPA Firm Owners
            </h2>

            <p>
              Download practical guides designed to help your firm evaluate,
              test, and implement accounting outsourcing successfully.
            </p>
          </div>

          <div className="resources-grid">
            {downloadableResources.map((resource) => (
              <article className="pdf-card" key={resource.key}>
                <div className="pdf-card-icon" aria-hidden="true">
                  {resource.type === "ppt" ? (
                    <FaFilePowerpoint />
                  ) : (
                    <FaFilePdf />
                  )}
                </div>

                <h3>{resource.title}</h3>

                <p>{resource.description}</p>

                <button
                  type="button"
                  className="pdf-download-btn"
                  onClick={() => setActiveResource(resource)}
                  aria-label={`Download ${resource.title}`}
                >
                  <FaDownload aria-hidden="true" />
                  Get Now
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {activeResource && (
        <DownloadModal
          resource={activeResource}
          onClose={() => setActiveResource(null)}
        />
      )}
    </>
  );
}

export default Resources;
