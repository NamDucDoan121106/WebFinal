import "./search.css";

export default function NoteSearchBar({ value, onChange }) {
  return (
    <div className="note-search-bar">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />

        <path d="m16 16 5 5" />
      </svg>

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search notes..."
        aria-label="Search notes"
        maxLength={255}
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
    </div>
  );
}
