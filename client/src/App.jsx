
import { useState } from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import {
    AuthProvider,
    useAuth
} from "./auth/AuthContext.jsx";

import AuthPage from "./auth/AuthPages.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import VerifyPage from "./auth/VerifyPage.jsx";
import UnverifiedBanner from "./auth/UnverifiedBanner.jsx";
import ForgotPassword from "./auth/ForgotPassword.jsx";

import "./App.css";
import "./auth/auth.css";

// ==========================================
// TEMPORARY DASHBOARD
// ==========================================

function Dashboard() {
    const { user, notice, logout } = useAuth();

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleLogout() {
        if (submitting) return;

        setError("");
        setSubmitting(true);

        try {
            await logout();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to sign out. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="home-page">

            <header className="home-header">
                <h1>Note App</h1>

                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={submitting}
                >
                    {submitting
                        ? "Signing out..."
                        : "Sign out"}
                </button>
            </header>

            <UnverifiedBanner />

            {notice && (
                <div
                    className="auth-success"
                    role="status"
                >
                    {notice}
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

            <section className="welcome-card">

                <h2>
                    Welcome, {user?.display_name || "User"}!
                </h2>

                <p>
                    Your account is connected successfully.
                </p>

                <div className="user-information">

                    <p>
                        <strong>User ID:</strong>{" "}
                        {user?.id}
                    </p>

                    <p>
                        <strong>Display name:</strong>{" "}
                        {user?.display_name}
                    </p>

                    <p>
                        <strong>Email:</strong>{" "}
                        {user?.email}
                    </p>

                    <p>
                        <strong>Account status:</strong>{" "}
                        {user?.is_verified
                            ? "Verified"
                            : "Not verified"}
                    </p>

                </div>

                <hr />

                <h3>Your notes</h3>

                <p>
                    Note management features will be
                    integrated in the next phase.
                </p>

            </section>

        </main>
    );
}

// ==========================================
// APPLICATION ROUTING
// ==========================================

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>

                    {/* ========================== */}
                    {/* PUBLIC ROUTES              */}
                    {/* ========================== */}

                    <Route
                        path="/login"
                        element={
                            <AuthPage
                                key="login"
                                mode="login"
                            />
                        }
                    />

                    <Route
                        path="/register"
                        element={
                            <AuthPage
                                key="register"
                                mode="register"
                            />
                        }
                    />

                    {/* Email verification */}

                    <Route
                        path="/verify/:token"
                        element={<VerifyPage />}
                    />

                    {/* Forgot and reset password */}

                    <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                    />

                    {/* ========================== */}
                    {/* PROTECTED ROUTES           */}
                    {/* ========================== */}

                    <Route element={<ProtectedRoute />}>

                        <Route
                            path="/"
                            element={<Dashboard />}
                        />

                    </Route>

                    {/* ========================== */}
                    {/* FALLBACK ROUTE             */}
                    {/* ========================== */}

                    <Route
                        path="*"
                        element={
                            <Navigate to="/" replace />
                        }
                    />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
