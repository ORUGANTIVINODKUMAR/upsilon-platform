const SkeletonLine = ({ width = "100%" }) => (
  <span className="ui-skeleton-line" style={{ width }} aria-hidden="true" />
);

const TableSkeleton = ({ columns = 6, rows = 5, label = "Loading records" }) => (
  <div
    className="ui-table-skeleton"
    role="status"
    aria-label={label}
    style={{ "--skeleton-columns": columns }}
  >
    <span className="sr-only">{label}</span>
    <div className="ui-table-skeleton-row ui-table-skeleton-head" aria-hidden="true">
      {Array.from({ length: columns }, (_, index) => (
        <SkeletonLine key={index} width={`${Math.max(42, 76 - index * 4)}%`} />
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div className="ui-table-skeleton-row" key={rowIndex} aria-hidden="true">
        {Array.from({ length: columns }, (_, columnIndex) => (
          <SkeletonLine
            key={columnIndex}
            width={`${Math.max(38, 88 - ((rowIndex + columnIndex) % 4) * 12)}%`}
          />
        ))}
      </div>
    ))}
  </div>
);

export { SkeletonLine, TableSkeleton };
