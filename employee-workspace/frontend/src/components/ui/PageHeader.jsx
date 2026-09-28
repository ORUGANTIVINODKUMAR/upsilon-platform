// The workspace shell renders the page's h1, so section headers default to h2.
const PageHeader = ({ eyebrow, title, description, icon: Icon, actions, level = 2 }) => {
  const Heading = level === 1 ? "h1" : "h2";
  return (
  <header className="ui-page-header">
    <div className="ui-page-heading">
      {Icon && (
        <span className="ui-page-icon" aria-hidden="true">
          <Icon size={20} strokeWidth={2} />
        </span>
      )}

      <div>
        {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
        <Heading>{title}</Heading>
        {description && <p>{description}</p>}
      </div>
    </div>

    {actions && <div className="ui-page-actions">{actions}</div>}
  </header>
  );
};

export default PageHeader;
