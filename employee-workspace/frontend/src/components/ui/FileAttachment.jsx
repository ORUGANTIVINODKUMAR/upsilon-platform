import { ExternalLink, FileText } from "lucide-react";

const getAttachmentName = (url, fallback) => {
  try {
    const pathname = new URL(url).pathname;
    const name = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
    return name || fallback;
  } catch {
    return fallback;
  }
};

const FileAttachment = ({ url, label = "Attachment", compact = false }) => {
  const fileName = getAttachmentName(url, label);
  const extension = fileName.includes(".") ? fileName.split(".").pop().toUpperCase() : "FILE";

  return (
    <a
      className={`ui-attachment${compact ? " ui-attachment--compact" : ""}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open ${fileName}`}
    >
      <span className="ui-attachment-icon" aria-hidden="true">
        <FileText size={16} />
      </span>
      <span className="ui-attachment-copy">
        <strong>{compact ? label : fileName}</strong>
        {!compact && <small>{extension} document</small>}
      </span>
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
};

export default FileAttachment;
