import "./search.css";

export default function LabelFilter({
  labels = [],
  selectedIds = [],
  onChange,
}) {
  function toggleLabel(id) {
    const nextIds = selectedIds.includes(id)
      ? selectedIds.filter((currentId) => currentId !== id)
      : [...selectedIds, id];

    onChange(nextIds);
  }

  return (
    <section className="note-filter" aria-label="Filter notes by labels">
      <button
        type="button"
        aria-pressed={selectedIds.length === 0}
        className={
          selectedIds.length === 0 ? "filter-chip active" : "filter-chip"
        }
        onClick={() => onChange([])}
      >
        All notes
      </button>

      {labels.map((label) => (
        <button
          key={label.id}
          type="button"
          aria-pressed={selectedIds.includes(label.id)}
          className={
            selectedIds.includes(label.id)
              ? "filter-chip active"
              : "filter-chip"
          }
          onClick={() => toggleLabel(label.id)}
        >
          {label.name}
        </button>
      ))}
    </section>
  );
}
