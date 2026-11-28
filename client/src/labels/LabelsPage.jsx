import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { labelApi } from "../api/label.api.js";

import "../account/account.css";
import "./labels.css";

function sortLabels(labels) {
    return [...labels].sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

function getError(error) {
    return (
        error.response?.data?.message ||
        "Unable to complete your request. Please try again."
    );
}

export default function LabelsPage() {
    const [labels, setLabels] = useState([]);

    const [newName, setNewName] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [editingName, setEditingName] = useState("");

    const [deletingLabel, setDeletingLabel] =
        useState(null);

    const [loading, setLoading] = useState(true);

    const [loadFailed, setLoadFailed] = useState(false);

    const [reload, setReload] = useState(0);

    const [busy, setBusy] = useState(false);

    const [error, setError] = useState("");

    const [message, setMessage] = useState("");

    // Load labels when the page opens.
    useEffect(() => {
        let active = true;

        async function loadLabels() {
            setLoading(true);
            setLoadFailed(false);
            setError("");

            try {
                const response = await labelApi.getAll();

                if (active) {
                    setLabels(
                        sortLabels(response.data.data)
                    );
                }
            } catch (err) {
                if (active) {
                    setLoadFailed(true);
                    setError(getError(err));
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

    function clearFeedback() {
        setError("");
        setMessage("");
    }

    // ====================================
    // CREATE LABEL
    // ====================================

    async function createLabel(event) {
        event.preventDefault();

        if (busy || loading || loadFailed) return;

        clearFeedback();

        const name = newName.trim();

        if (!name || name.length > 100) {
            setError(
                "Label name must contain 1 to 100 characters."
            );
            return;
        }

        setBusy(true);

        try {
            const response =
                await labelApi.create(name);

            setLabels(previous =>
                sortLabels([
                    ...previous,
                    response.data.data
                ])
            );

            setNewName("");

            setMessage(
                "Label created successfully."
            );

        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    }

    // ====================================
    // EDIT LABEL
    // ====================================

    function startEditing(label) {
        clearFeedback();

        setEditingId(label.id);
        setEditingName(label.name);
        setDeletingLabel(null);
    }

    function cancelEditing() {
        setEditingId(null);
        setEditingName("");
        clearFeedback();
    }

    async function updateLabel(event) {
        event.preventDefault();

        if (busy) return;

        clearFeedback();

        const name = editingName.trim();

        if (!name || name.length > 100) {
            setError(
                "Label name must contain 1 to 100 characters."
            );
            return;
        }

        setBusy(true);

        try {
            const response = await labelApi.update(
                editingId,
                name
            );

            const updated = response.data.data;

            setLabels(previous =>
                sortLabels(
                    previous.map(label =>
                        label.id === updated.id
                            ? updated
                            : label
                    )
                )
            );

            setEditingId(null);
            setEditingName("");

            setMessage(
                "Label updated successfully."
            );

        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    }

    // ====================================
    // DELETE LABEL
    // ====================================

    function confirmDelete(label) {
        clearFeedback();

        setDeletingLabel(label);
        setEditingId(null);
    }

    async function deleteLabel() {
        if (!deletingLabel || busy) return;

        clearFeedback();
        setBusy(true);

        const id = deletingLabel.id;

        try {
            await labelApi.remove(id);

            setLabels(previous =>
                previous.filter(
                    label => label.id !== id
                )
            );

            setDeletingLabel(null);

            setMessage(
                "Label deleted successfully."
            );

        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="account-page">

            <section className="account-card labels-card">

                <h1>Manage labels</h1>

                <p className="account-muted">
                    Create, rename and delete labels
                    to organize your notes.
                </p>

                {error && (
                    <div className="auth-error" role="alert">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="auth-success" role="status">
                        {message}
                    </div>
                )}

                <form
                    className="label-create-form"
                    onSubmit={createLabel}
                >

                    <input
                        type="text"
                        value={newName}
                        onChange={event =>
                            setNewName(event.target.value)
                        }
                        placeholder="Create new label"
                        aria-label="New label name"
                        maxLength={100}
                        required
                        disabled={
                            busy ||
                            loading ||
                            loadFailed
                        }
                    />

                    <button
                        type="submit"
                        className="label-primary"
                        disabled={
                            busy ||
                            loading ||
                            loadFailed
                        }
                    >
                        Add label
                    </button>

                </form>

                <div className="label-list-header">
                    <strong>Your labels</strong>

                    <span>
                        {labels.length} labels
                    </span>
                </div>

                {loading && (
                    <p role="status">
                        Loading labels...
                    </p>
                )}

                {loadFailed && (
                    <button
                        type="button"
                        className="label-secondary"
                        onClick={() =>
                            setReload(value => value + 1)
                        }
                    >
                        Try again
                    </button>
                )}

                {!loading &&
                    !loadFailed &&
                    labels.length === 0 && (
                        <div className="label-empty">
                            <strong>No labels yet</strong>

                            <p>
                                Create your first label
                                to organize your notes.
                            </p>
                        </div>
                    )
                }

                {!loading && !loadFailed && (
                    <div className="label-list">

                        {labels.map(label => (
                            <div
                                className="label-row"
                                key={label.id}
                            >

                                {editingId === label.id ? (
                                    <form
                                        className="label-edit-form"
                                        onSubmit={updateLabel}
                                    >

                                        <input
                                            value={editingName}
                                            onChange={event =>
                                                setEditingName(
                                                    event.target.value
                                                )
                                            }
                                            aria-label="Rename label"
                                            maxLength={100}
                                            required
                                            disabled={busy}
                                            autoFocus
                                        />

                                        <button
                                            type="submit"
                                            className="label-primary"
                                            disabled={busy}
                                        >
                                            Save
                                        </button>

                                        <button
                                            type="button"
                                            className="label-secondary"
                                            onClick={cancelEditing}
                                            disabled={busy}
                                        >
                                            Cancel
                                        </button>

                                    </form>
                                ) : (
                                    <>
                                        <div className="label-name">

                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="M20 13.5L13.5 20a2 2 0 0 1-2.8 0L3 12V4h8l9 6.7a2 2 0 0 1 0 2.8Z" />
                                                <circle
                                                    cx="7.5"
                                                    cy="8"
                                                    r="1"
                                                />
                                            </svg>

                                            <span>{label.name}</span>

                                        </div>

                                        <div className="label-actions">

                                            <button
                                                type="button"
                                                className="label-secondary"
                                                disabled={busy}
                                                onClick={() =>
                                                    startEditing(label)
                                                }
                                            >
                                                Rename
                                            </button>

                                            <button
                                                type="button"
                                                className="label-danger"
                                                disabled={busy}
                                                onClick={() =>
                                                    confirmDelete(label)
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>
                                    </>
                                )}

                            </div>
                        ))}

                    </div>
                )}

                {deletingLabel && (
                    <section
                        className="label-confirmation"
                        aria-labelledby="delete-label-heading"
                    >

                        <h3 id="delete-label-heading">
                            Delete label?
                        </h3>

                        <p>
                            Delete "{deletingLabel.name}"?
                            This label will be removed from
                            your notes. Your notes will not
                            be deleted.
                        </p>

                        <div className="label-actions">

                            <button
                                type="button"
                                className="label-secondary"
                                disabled={busy}
                                onClick={() =>
                                    setDeletingLabel(null)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="label-danger"
                                disabled={busy}
                                onClick={deleteLabel}
                            >
                                {busy
                                    ? "Deleting..."
                                    : "Confirm delete"}
                            </button>

                        </div>

                    </section>
                )}

                <div className="account-links">

                    <Link to="/">
                        Back to notes
                    </Link>

                    <Link to="/profile">
                        My profile
                    </Link>

                </div>

            </section>

        </main>
    );
}