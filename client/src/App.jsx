import ProfilePage
    from "./account/ProfilePage.jsx";

import ChangePasswordPage
    from "./account/ChangePasswordPage.jsx";

import PreferencesPage
    from "./account/PreferencesPage.jsx";

import PreferencesProvider
    from "./account/PreferencesProvider.jsx";

import Avatar
    from "./account/Avatar.jsx";
import { useState } from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Link
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

    const initial = (
        user?.display_name || "U"
    ).charAt(0).toUpperCase();

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
        <div className="workspace-layout">

            {/* SIDEBAR */}

            <aside className="workspace-sidebar">

                <Link to="/" className="workspace-brand">
                    Note App
                </Link>

                <div className="workspace-menu">

                    <span className="workspace-menu-label">
                        WORKSPACE
                    </span>

                    <Link
                        to="/"
                        className="workspace-link active"
                    >
                        Dashboard
                    </Link>

                    <span
                        className="workspace-link disabled"
                        aria-disabled="true"
                    >
                        My Notes
                        <small>Coming soon</small>
                    </span>

                    <span className="workspace-menu-label">
                        ACCOUNT
                    </span>

                    <Link
                        to="/profile"
                        className="workspace-link"
                    >
                        My Profile
                    </Link>

                    <Link
                        to="/change-password"
                        className="workspace-link"
                    >
                        Change Password
                    </Link>

                    <Link
                        to="/preferences"
                        className="workspace-link"
                    >
                        Preferences
                    </Link>

                </div>

                <button
                    type="button"
                    className="workspace-logout"
                    onClick={handleLogout}
                    disabled={submitting}
                >
                    {submitting ? "Signing out..." : "Sign out"}
                </button>

            </aside>

            {/* MAIN CONTENT */}

            <main className="workspace-main">

                <header className="workspace-header">

                    <div>
                        <h1>
                            Welcome, {user?.display_name || "User"}!
                        </h1>

                        <p>
                            Manage your account and personal workspace.
                        </p>
                    </div>

                    <Link
                        to="/profile"
                        className="workspace-avatar"
                        aria-label="Open profile"
                    >
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt="User avatar"
                            />
                        ) : (
                            initial
                        )}
                    </Link>

                </header>

                <UnverifiedBanner />

                {notice && (
                    <div className="auth-success" role="status">
                        {notice}
                    </div>
                )}

                {error && (
                    <div className="auth-error" role="alert">
                        {error}
                    </div>
                )}

                {/* ACCOUNT INFORMATION */}

                <section className="workspace-account">

                    <h2>Account overview</h2>

                    <div className="workspace-user-grid">

                        <div>
                            <span>Display name</span>
                            <strong>{user?.display_name}</strong>
                        </div>

                        <div>
                            <span>Email address</span>
                            <strong>{user?.email}</strong>
                        </div>

                        <div>
                            <span>User ID</span>
                            <strong>{user?.id}</strong>
                        </div>

                        <div>
                            <span>Account status</span>

                            <strong
                                className={
                                    user?.is_verified
                                        ? "workspace-verified"
                                        : "workspace-unverified"
                                }
                            >
                                {user?.is_verified
                                    ? "Verified"
                                    : "Not verified"}
                            </strong>

                        </div>

                    </div>

                </section>

                {/* QUICK ACTIONS */}

                <h2 className="workspace-section-title">
                    Quick actions
                </h2>

                <section className="workspace-actions">

                    <Link
                        to="/profile"
                        className="workspace-action-card"
                    >
                        <span className="workspace-action-icon">
                            👤
                        </span>

                        <h3>My Profile</h3>

                        <p>
                            Update your display name and profile picture.
                        </p>

                        <span className="workspace-action-text">
                            Manage profile →
                        </span>
                    </Link>

                    <Link
                        to="/change-password"
                        className="workspace-action-card"
                    >
                        <span className="workspace-action-icon">
                            🔒
                        </span>

                        <h3>Account Security</h3>

                        <p>
                            Change your password and secure your account.
                        </p>

                        <span className="workspace-action-text">
                            Change password →
                        </span>
                    </Link>

                    <Link
                        to="/preferences"
                        className="workspace-action-card"
                    >
                        <span className="workspace-action-icon">
                            ⚙️
                        </span>

                        <h3>Preferences</h3>

                        <p>
                            Customize your personal application settings.
                        </p>

                        <span className="workspace-action-text">
                            Open settings →
                        </span>
                    </Link>

                    <div className="workspace-action-card coming-soon">

                        <span className="workspace-action-icon">
                            📝
                        </span>

                        <h3>My Notes</h3>

                        <p>
                            Create, organize and manage your notes.
                        </p>

                        <span className="workspace-coming-soon">
                            Coming soon
                        </span>

                    </div>

                </section>

            </main>

        </div>
    );
}


// ==========================================
// APPLICATION ROUTING
// ==========================================

export default function App() {
    return (
        <BrowserRouter>

            <AuthProvider>

                <PreferencesProvider>

                    <Routes>

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

                        <Route
                            path="/verify/:token"
                            element={<VerifyPage />}
                        />

                        <Route
                            path="/forgot-password"
                            element={<ForgotPassword />}
                        />

                        <Route element={<ProtectedRoute />}>

                            <Route path="/" element={<Dashboard />} />
                            <Route
                                path="/profile"
                                element={<ProfilePage />}
                            />

                            <Route
                                path="/change-password"
                                element={<ChangePasswordPage />}
                            />

                            <Route
                                path="/preferences"
                                element={<PreferencesPage />}
                            />

                            <Route
                                path="*"
                                element={
                                    <Navigate to="/" replace />
                                }
                            />

                        </Route>

                    </Routes>

                </PreferencesProvider>

            </AuthProvider>

        </BrowserRouter>
    );
}
