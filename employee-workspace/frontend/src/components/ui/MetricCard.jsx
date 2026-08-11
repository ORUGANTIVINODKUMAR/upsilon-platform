const MetricCard = ({ label, value, detail, icon: Icon, tone = "neutral" }) => (
  <article className={`ui-metric-card ui-metric-card--${tone}`}>
    {Icon && (
      <span className="ui-metric-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
    )}
    <div>
      <span className="ui-metric-label">{label}</span>
      <strong className="ui-metric-value">{value}</strong>
      {detail && <span className="ui-metric-detail">{detail}</span>}
    </div>
  </article>
);

export default MetricCard;
