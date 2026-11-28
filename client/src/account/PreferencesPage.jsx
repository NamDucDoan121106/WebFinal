import { useState } from "react";

import { Link } from "react-router-dom";

import {
    useAuth
} from "../auth/AuthContext.jsx";

import {
    userApi
} from "../api/user.api.js";

import "./account.css";

const fontSizes = {
    sm: "13px",
    md: "15px",
    lg: "18px"
};

const colors = [
    "#ffffff",
    "#fef3c7",
    "#dbeafe",
    "#dcfce7",
    "#fce7f3",
    "#ede9fe",
    "#fed7aa"
];

function PreferencesForm({ user, refresh }) {
    const initial = user.preferences || {};

    const [theme, setTheme] = useState(
        initial.theme || "light"
    );

    const [fontSize, setFontSize] = useState(
        initial.font_size || "md"
    );

    const [color, setColor] = useState(
        initial.default_note_color ?? null
    );

    const [error, setError] = useState("");

    const [message, setMessage] = useState("");

    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        if (loading) return;

        setError("");
        setMessage("");
        setLoading(true);

        try {
            const response =
                await userApi.updatePreferences({
                    theme,
                    font_size: fontSize,
                    default_note_color: color
                });

            await refresh();

            setMessage(response.data.message);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save preferences."
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="account-card">

            <h1>Preferences</h1>

            <p className="account-muted">
                Customize your note-taking experience.
            </p>

            {error && (
                <div
                    className="auth-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {message && (
                <div
                    className="auth-success"
                    role="status"
                >
                    {message}
                </div>
            )}

            <form
                className="account-form"
                onSubmit={handleSubmit}
            >

                <div className="account-field">

                    <label htmlFor="theme">
                        Appearance
                    </label>

                    <select
                        id="theme"
                        value={theme}
                        onChange={event =>
                            setTheme(event.target.value)
                        }
                    >
                        <option value="light">
                            Light mode
                        </option>

                        <option value="dark">
                            Dark mode
                        </option>
                    </select>

                </div>

                <div className="account-field">

                    <label htmlFor="font-size">
                        Note font size
                    </label>

                    <select
                        id="font-size"
                        value={fontSize}
                        onChange={event =>
                            setFontSize(event.target.value)
                        }
                    >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                    </select>

                </div>

                <div className="account-field">

                    <span className="account-label">
                        Default note color
                    </span>

                    <div className="color-options">

                        <button
                            type="button"
                            className={
                                color === null
                                    ? "color-default selected"
                                    : "color-default"
                            }
                            aria-pressed={color === null}
                            onClick={() => setColor(null)}
                        >
                            Default
                        </button>

                        {colors.map(value => (
                            <button
                                key={value}
                                type="button"
                                aria-label={`Note color ${value}`}
                                aria-pressed={color === value}
                                className={
                                    color === value
                                        ? "color-option selected"
                                        : "color-option"
                                }
                                style={{
                                    backgroundColor: value
                                }}
                                onClick={() => setColor(value)}
                            />
                        ))}

                    </div>

                </div>

                <div
                    className="preference-preview"
                    style={{
                        backgroundColor:
                            color ||
                            (theme === "dark"
                                ? "#334155"
                                : "#ffffff"),

                        color:
                            color || theme === "light"
                                ? "#172033"
                                : "#f8fafc",

                        fontSize: fontSizes[fontSize]
                    }}
                >

                    <strong>Note preview</strong>

                    <p>
                        This is how your new notes will look
                        with the selected preferences.
                    </p>

                </div>

                <button
                    className="account-primary"
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? "Saving..."
                        : "Apply preferences"}
                </button>

            </form>

            <div className="account-links">

                <Link to="/profile">
                    Back to profile
                </Link>

                <Link to="/">
                    Back to notes
                </Link>

            </div>

        </section>
    );
}

export default function PreferencesPage() {
    const { user, refresh } = useAuth();

    return (
        <main className="account-page">

            {user && (
                <PreferencesForm
                    key={user.id}
                    user={user}
                    refresh={refresh}
                />
            )}

        </main>
    );
}