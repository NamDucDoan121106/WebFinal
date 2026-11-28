import { useState } from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import { authApi } from "../api/auth.api.js";
import { useAuth } from "./AuthContext.jsx";

import "./auth.css";

export default function ForgotPassword() {
    const navigate = useNavigate();

    const { refresh } = useAuth();

    const [step, setStep] = useState(1);

    const [email, setEmail] = useState("");

    const [resetToken, setResetToken] =
        useState("");

    const [error, setError] = useState("");

    const [notice, setNotice] = useState("");

    const [loading, setLoading] = useState(false);

    const titles = {
        1: "Forgot password?",
        2: "Check your email",
        3: "Create a new password"
    };

    const descriptions = {
        1: "Enter your registered email address.",
        2: "Enter the 6-digit verification code sent to your email.",
        3: "Choose a new password for your account."
    };

    async function handleSubmit(event) {
        event.preventDefault();

        if (loading) return;

        setError("");
        setLoading(true);

        const data = Object.fromEntries(
            new FormData(event.currentTarget)
        );

        try {
            // STEP 1: Send OTP
            if (step === 1) {
                const normalizedEmail =
                    data.email.trim().toLowerCase();

                const response =
                    await authApi.forgotPassword(
                        normalizedEmail
                    );

                setEmail(normalizedEmail);

                setNotice(response.data.message);

                setStep(2);
            }

            // STEP 2: Verify OTP
            else if (step === 2) {
                const response =
                    await authApi.verifyOTP(
                        email,
                        data.otp.trim()
                    );

                setResetToken(
                    response.data.data.reset_token
                );

                setNotice("");

                setStep(3);
            }

            // STEP 3: Reset password
            else if (step === 3) {
                if (
                    data.password !==
                    data.confirm_password
                ) {
                    setError("Passwords do not match.");
                    return;
                }

                await authApi.resetPassword({
                    reset_token: resetToken,
                    password: data.password,

                    confirm_password:
                        data.confirm_password
                });

                setResetToken("");

                // Refresh the authentication state.
                await refresh();

                navigate("/login", {
                    replace: true,

                    state: {
                        message:
                            "Password reset successfully. Please sign in."
                    }
                });
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to complete your request. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    function restartProcess() {
        setStep(1);

        setResetToken("");
        setNotice("");
        setError("");
    }

    return (
        <main className="auth-page">
            <section className="auth-card">

                <div className="auth-brand">
                    <span className="auth-logo">N</span>
                    <span>Note App</span>
                </div>

                <div
                    className="reset-steps"
                    aria-label={`Step ${step} of 3`}
                >
                    {[1, 2, 3].map(number => (
                        <span
                            key={number}
                            className={
                                number <= step
                                    ? "reset-step active"
                                    : "reset-step"
                            }
                        >
                            {number}
                        </span>
                    ))}
                </div>

                <header className="auth-heading">
                    <h1>{titles[step]}</h1>

                    <p>{descriptions[step]}</p>
                </header>

                {error && (
                    <div
                        className="auth-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {notice && (
                    <div
                        className="auth-notice"
                        role="status"
                    >
                        {notice}
                    </div>
                )}

                <form
                    key={step}
                    className="auth-form"
                    onSubmit={handleSubmit}
                >

                    {step === 1 && (
                        <div className="auth-field">
                            <label htmlFor="reset-email">
                                Email address
                            </label>

                            <input
                                id="reset-email"
                                name="email"
                                type="email"
                                defaultValue={email}
                                autoComplete="email"
                                placeholder="you@example.com"
                                maxLength={254}
                                required
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <>
                            <p className="reset-email">
                                {email}
                            </p>

                            <div className="auth-field">
                                <label htmlFor="otp">
                                    Verification code
                                </label>

                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    minLength={6}
                                    placeholder="000000"
                                    className="otp-input"
                                    required
                                />

                                <small>
                                    The code expires in 10 minutes.
                                </small>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="auth-field">
                                <label htmlFor="new-password">
                                    New password
                                </label>

                                <input
                                    id="new-password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    placeholder="Enter new password"
                                    required
                                />

                                <small>
                                    At least 8 characters.
                                </small>
                            </div>

                            <div className="auth-field">
                                <label htmlFor="confirm-new-password">
                                    Confirm new password
                                </label>

                                <input
                                    id="confirm-new-password"
                                    name="confirm_password"
                                    type="password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <button
                        className="auth-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Please wait..."
                            : step === 1
                                ? "Send verification code"
                                : step === 2
                                    ? "Verify code"
                                    : "Reset password"}
                    </button>

                    {step > 1 && (
                        <button
                            className="auth-secondary-button"
                            type="button"
                            disabled={loading}
                            onClick={restartProcess}
                        >
                            Start over
                        </button>
                    )}

                </form>

                <footer className="auth-footer">
                    <Link to="/login">
                        Back to sign in
                    </Link>
                </footer>

            </section>
        </main>
    );
}