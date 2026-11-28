import { useState } from "react";

import { Link } from "react-router-dom";

import {
    useAuth
} from "../auth/AuthContext.jsx";

import {
    userApi
} from "../api/user.api.js";

import "./account.css";

export default function ChangePasswordPage() {
    const { refresh } = useAuth();

    const [error, setError] = useState("");

    const [message, setMessage] = useState("");

    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        if (loading) return;

        const form = event.currentTarget;

        const data = Object.fromEntries(
            new FormData(form)
        );

        setError("");
        setMessage("");

        if (
            data.password !== data.confirm_password
        ) {
            setError("Passwords do not match.");
            return;
        }

        if (
            data.current_password === data.password
        ) {
            setError(
                "New password must be different."
            );

            return;
        }

        setLoading(true);

        try {
            const response =
                await userApi.changePassword(data);

            form.reset();

            await refresh();

            setMessage(response.data.message);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to change your password."
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="account-page">

            <section className="account-card">

                <h1>Change password</h1>

                <p className="account-muted">
                    Other existing sessions will be signed out
                    after you change your password.
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

                        <label htmlFor="current-password">
                            Current password
                        </label>

                        <input
                            id="current-password"
                            name="current_password"
                            type="password"
                            autoComplete="current-password"
                            required
                        />

                    </div>

                    <div className="account-field">

                        <label htmlFor="new-password">
                            New password
                        </label>

                        <input
                            id="new-password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />

                        <small className="account-muted">
                            At least 8 characters.
                        </small>

                    </div>

                    <div className="account-field">

                        <label htmlFor="confirm-password">
                            Confirm new password
                        </label>

                        <input
                            id="confirm-password"
                            name="confirm_password"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />

                    </div>

                    <button
                        className="account-primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Updating..."
                            : "Change password"}
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

        </main>
    );
}