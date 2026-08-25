// =========================================================
// CLIENTS / TRUSTED BY SECTION — Upsilon Services
// Paste this file at: src/components/ClientsSection.jsx
//
// NOTE: We can't fabricate real client logos, so this uses styled
// wordmark placeholders. Swap each <span> wordmark for a real
// <img src="/clients/logo.png" /> once you have client permission
// to display their logo — the grid and hover effect will still work.
// =========================================================
import "./ClientsSection.css";

const clients = [
  "Harborview CPA",
  "Meridian Tax Group",
  "Ashford & Pine",
  "Northgate Accounting",
  "Bellweather Partners",
  "Summit Ledger Co.",
  "Clearwater Advisors",
  "Fairmont & Co.",
];

const trustPoints = [
  { value: "40+", label: "Accounting firms served" },
  { value: "12+", label: "U.S. states represented" },
  { value: "4.9 / 5", label: "Average client rating" },
];

function ClientsSection() {
  return (
    <section className="clients-pro-section" id="clients">
      <div className="clients-pro-container">
        <span className="clients-pro-eyebrow">TRUSTED BY</span>
        <h2>Trusted by Growing CPA & Accounting Firms Across the U.S.</h2>
        <p className="clients-pro-subtitle">
          From single-partner practices to multi-office firms, accounting
          leaders rely on Upsilon to extend their team without extending
          their overhead.
        </p>

        <div className="clients-pro-grid">
          {clients.map((name) => (
            <div className="client-logo-tile" key={name}>
              <span>{name}</span>
            </div>
          ))}
        </div>

        <div className="clients-pro-trust">
          {trustPoints.map((point) => (
            <div className="clients-pro-trust-item" key={point.label}>
              <span className="clients-pro-trust-value">{point.value}</span>
              <span className="clients-pro-trust-label">{point.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ClientsSection;
