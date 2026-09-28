const getStatusTone = (status = "") => {
  const value = String(status).trim().toLowerCase();

  // Check negative and pending states before substrings such as paid/active/approval.
  if (/reject|declin|inactive|cancel|lop|unpaid|failed/.test(value)) return "danger";
  if (/pending|await|review|hold/.test(value)) return "warning";
  if (/approv|paid|active|complete|success/.test(value)) return "success";

  if (
    value.includes("processing") ||
    value.includes("submitted") ||
    value.includes("routed")
  ) {
    return "info";
  }

  return "neutral";
};

const prettifyStatus = (status) =>
  String(status || "Not available")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const StatusBadge = ({ status, label }) => (
  <span
    className={`ui-status ui-status--${getStatusTone(status)}`}
    title={label || prettifyStatus(status)}
    aria-label={`Status: ${label || prettifyStatus(status)}`}
  >
    <span className="ui-status-dot" aria-hidden="true" />
    {label || prettifyStatus(status)}
  </span>
);

export default StatusBadge;
