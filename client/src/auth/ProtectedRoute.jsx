import UnverifiedBanner from "./UnverifiedBanner.jsx";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute() {
    const { status, refresh } = useAuth();

    if (status === "loading") {
        return (
            <div className="auth-status" role="status">
                Checking your session...
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="auth-status">
                <p>Unable to connect to the server.</p>

                <button onClick={refresh}>
                    Try again
                </button>
            </div>
        );
    }

    if (status === "guest") {
        return <Navigate to="/login" replace />;
    }

    return (
    <>
        <UnverifiedBanner />

        <Outlet />
    </>
);
}
