import { useAuth } from "./AuthContext.jsx";
import "./auth.css";

export default function UnverifiedBanner() {
    const { user, refresh } = useAuth();

    if (!user || user.is_verified === true || user.is_verified === 1) {
        return null;
    }

    return (
        <aside className="unverified-banner" role="status">
            <strong>Verify your email address</strong>
            <p>Please check your inbox and click the verification link. You can continue using Note App.</p>
            <button type="button" onClick={refresh}>
                I have verified my email
            </button>
        </aside>
    );
}
