import { useState } from "react";

import {
    Link,
    Navigate,
    useLocation
} from "react-router-dom";

import { useAuth } from "./AuthContext.jsx";

import "./auth.css";

export default function AuthPage({ mode }) {
    const isRegister = mode === "register";
    const location = useLocation();

    const successMessage =
    location.state?.message || "";

    const {
        status,
        login,
        register
    } = useAuth();

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        if (submitting) return;

        setError("");

        const formData = new FormData(
            event.currentTarget
        );

        const data = Object.fromEntries(
            formData.entries()
        );

        if (
            isRegister &&
            data.password !== data.confirm_password
        ) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            if (isRegister) {
                await register(data);
            } else {
                await login(data);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to complete your request. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (status === "loading") {
        return (
            <div className="auth-status">
                Checking your session...
            </div>
        );
    }

    if (status === "authenticated") {
        return <Navigate to="/" replace />;
    }

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-brand">
                    <span className="auth-logo">N</span>
                    <span>Note App</span>
                </div>

                <header className="auth-heading">
                    <h1>
                        {isRegister
                            ? "Create your account"
                            : "Welcome back"}
                    </h1>
                    <p>
                        {isRegister
                            ? "A space for your ideas and notes."
                            : "Sign in to access your notes."}
                    </p>
                </header>
                {!isRegister && successMessage && (
                    <div
                        className="auth-success"
                        role="status"
                    >
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div
                        className="auth-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <div className="auth-field">
                        <label htmlFor="email">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            maxLength={254}
                            required
                        />
                    </div>

                    {isRegister && (
                        <div className="auth-field">
                            <label htmlFor="display_name">
                                Display name
                            </label>
                            <input
                                id="display_name"
                                name="display_name"
                                type="text"
                                autoComplete="nickname"
                                placeholder="Your name"
                                minLength={2}
                                maxLength={100}
                                required
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={
                                isRegister
                                    ? "new-password"
                                    : "current-password"
                            }
                            placeholder="Enter your password"
                            minLength={
                                isRegister ? 8 : undefined
                            }
                            required
                        />
                        {isRegister && (
                            <small>
                                At least 8 characters.
                            </small>
                        )}
                    </div>

                    {isRegister && (
                        <div className="auth-field">
                            <label htmlFor="confirm_password">
                                Confirm password
                            </label>
                            <input
                                id="confirm_password"
                                name="confirm_password"
                                type="password"
                                autoComplete="new-password"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    )}

                    <button
                        className="auth-button"
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Please wait..."
                            : isRegister
                                ? "Create account"
                                : "Sign in"}
                    </button>
                </form>

                <footer className="auth-footer">
                    {!isRegister && (
                        <div style={{ textAlign: "right" }}>
                            <Link
                                to="/forgot-password"
                                style={{
                                    color: "#2563eb",
                                    fontSize: "14px",
                                    textDecoration: "none"
                                }}
                            >
                                Forgot password?
                            </Link>
                        </div>
                    )}
                    {isRegister ? (
                        <>
                            Already have an account?{" "}
                            <Link to="/login">
                                Sign in
                            </Link>
                        </>
                    ) : (
                        <>
                            Don't have an account?{" "}
                            <Link to="/register">
                                Create account
                            </Link>
                        </>
                    )}
                </footer>
            </section>
        </main>
    );
}
