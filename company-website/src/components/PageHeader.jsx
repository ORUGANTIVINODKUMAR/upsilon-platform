// Reusable banner used at the top of inner pages
import "./PageHeader.css";

function PageHeader({ eyebrow, title, subtitle, backgroundImage }) {
  return (
    <section
      className={`page-header${backgroundImage ? " has-image" : ""}`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      {backgroundImage && (
        <div className="page-header-overlay" aria-hidden="true" />
      )}

      <div className="page-header-container">
        {eyebrow && <span className="page-header-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}

export default PageHeader;
