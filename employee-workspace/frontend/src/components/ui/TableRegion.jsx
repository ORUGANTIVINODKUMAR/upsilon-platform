export default function TableRegion({ children, className = "table-wrapper", label = "Data table", ...props }) {
  return <div {...props} className={`${className} ui-table-region`} role="region" aria-label={label} tabIndex={0}>{children}</div>;
}
