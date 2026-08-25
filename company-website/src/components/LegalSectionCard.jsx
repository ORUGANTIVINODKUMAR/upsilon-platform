// Heading + paragraph block used to present one section of a legal
// document (Terms of Use, Privacy Policy).
import "./LegalSectionCard.css";

function LegalSectionCard({ title, children }) {
  return (
    <div className="legal-card">
      <h2 className="legal-card-title">{title}</h2>
      <div className="legal-card-body">{children}</div>
    </div>
  );
}

export default LegalSectionCard;
