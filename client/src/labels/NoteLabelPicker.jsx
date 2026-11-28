import { useEffect, useState } from "react";

import { labelApi } from "../api/label.api.js";

import { noteLabelApi } from "../api/note-label.api.js";

import "./labels.css";

export default function NoteLabelPicker({
  noteId,
  selectedLabels = [],
  disabled = false,
  onLabelsChange,
}) {
  const [labels, setLabels] = useState([]);

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadLabels() {
      setLoading(true);
      setError("");

      try {
        const response = await labelApi.getAll();

        if (active) {
          setLabels(response.data.data);
        }
      } catch (err) {
        if (active) {
          setError(err.response?.data?.message || "Unable to load labels.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLabels();

    return () => {
      active = false;
    };
  }, [reload]);

  const selectedIds = new Set(selectedLabels.map((label) => label.id));

  async function toggleLabel(labelId) {
    if (busy || disabled || !noteId) return;

    setBusy(true);
    setError("");

    const nextIds = selectedIds.has(labelId)
      ? [...selectedIds].filter((id) => id !== labelId)
      : [...selectedIds, labelId];

    try {
      const response = await noteLabelApi.update(noteId, nextIds);

      onLabelsChange?.(response.data.data.labels);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update note labels.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="note-label-picker">
      <h3>Labels</h3>

      {error && (
        <div className="auth-error" role="alert">
          {error}

          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            disabled={busy}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p role="status">Loading labels...</p>
      ) : labels.length === 0 ? (
        <p className="account-muted">No labels available.</p>
      ) : (
        <div className="note-label-options">
          {labels.map((label) => (
            <label className="note-label-option" key={label.id}>
              <input
                type="checkbox"
                checked={selectedIds.has(label.id)}
                disabled={busy || disabled || !noteId}
                onChange={() => toggleLabel(label.id)}
              />

              <span>{label.name}</span>
            </label>
          ))}
        </div>
      )}

      {busy && <small role="status">Updating labels...</small>}
    </section>
  );
}
