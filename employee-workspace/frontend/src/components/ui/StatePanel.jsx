import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

const icons = {
  empty: Inbox,
  error: AlertCircle,
  loading: LoaderCircle,
};

const StatePanel = ({
  type = "empty",
  title,
  description,
  action,
  compact = false,
}) => {
  const Icon = icons[type] || Inbox;

  return (
    <div
      className={`ui-state ui-state--${type}${compact ? " ui-state--compact" : ""}`}
      role={type === "error" ? "alert" : type === "loading" ? "status" : undefined}
      aria-live={type === "loading" ? "polite" : undefined}
    >
      <span className="ui-state-icon" aria-hidden="true">
        <Icon className={type === "loading" ? "ui-spin" : ""} size={22} />
      </span>
      <div>
        <strong>{title}</strong>
        {description && <p>{description}</p>}
      </div>
      {type === "loading" && (
        <span className="ui-state-loading-lines" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
      {action && <div className="ui-state-action">{action}</div>}
    </div>
  );
};

const LoadingState = ({ label = "Loading workspace…", compact = false }) => (
  <StatePanel type="loading" title={label} compact={compact} />
);

const EmptyState = ({ title = "Nothing here yet", description, action, compact = false }) => (
  <StatePanel
    type="empty"
    title={title}
    description={description}
    action={action}
    compact={compact}
  />
);

const ErrorState = ({ title = "Something went wrong", description, action, compact = false }) => (
  <StatePanel
    type="error"
    title={title}
    description={description}
    action={action}
    compact={compact}
  />
);

export { EmptyState, ErrorState, LoadingState };
export default StatePanel;
