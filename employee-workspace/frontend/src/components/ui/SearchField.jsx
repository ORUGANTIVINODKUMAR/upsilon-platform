import { Search, X } from "lucide-react";

const SearchField = ({
  id,
  label = "Search",
  placeholder = "Search…",
  value,
  onChange,
  onClear,
  disabled = false,
}) => (
  <label className="ui-search-field" htmlFor={id}>
    <span className="sr-only">{label}</span>
    <Search size={17} aria-hidden="true" />
    <input
      id={id}
      type="search"
      autoComplete="off"
      enterKeyHint="search"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      disabled={disabled}
    />
    {value && (
      <button
        type="button"
        className="ui-search-clear"
        onClick={onClear}
        aria-label={`Clear ${label.toLowerCase()}`}
        disabled={disabled}
      >
        <X size={15} aria-hidden="true" />
      </button>
    )}
  </label>
);

export default SearchField;
