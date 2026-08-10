const getStatusTone = (status = "") => {
  const value = String(status).trim().toLowerCase();

  if (
    value.includes("approv") ||
    value.includes("paid") ||
    value.includes("active") ||
    value.includes("complete") ||
    value.includes("success")
  ) {
    return "success";
  }

  if (
    value.includes("reject") ||
    value.includes("declin") ||
    value.includes("inactive") ||
    value.includes("cancel") ||
    value.includes("lop") ||
    value.includes("unpaid") ||
    value.includes("failed")
  ) {
    return "danger";
  }

  if (
    value.includes("pending") ||
    value.includes("await") ||
    value.includes("review") ||
    value.includes("hold")
  ) {
    return "warning";
  }

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
  <span className={`ui-status ui-status--${getStatusTone(status)}`}>
    <span className="ui-status-dot" aria-hidden="true" />
    {label || prettifyStatus(status)}
  </span>
);

export default StatusBadge;
