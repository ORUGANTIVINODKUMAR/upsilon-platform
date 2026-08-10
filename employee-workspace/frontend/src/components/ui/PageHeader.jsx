const PageHeader = ({ eyebrow, title, description, icon: Icon, actions }) => (
  <header className="ui-page-header">
    <div className="ui-page-heading">
      {Icon && (
        <span className="ui-page-icon" aria-hidden="true">
          <Icon size={20} strokeWidth={2} />
        </span>
      )}

      <div>
        {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>

    {actions && <div className="ui-page-actions">{actions}</div>}
  </header>
);

export default PageHeader;
