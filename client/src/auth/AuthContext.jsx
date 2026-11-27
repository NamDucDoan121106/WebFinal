import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef
} from "react";

import { authApi } from "../api/auth.api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [session, setSession] = useState({
        user: null,
        status: "loading",
        notice: ""
    });

    const requestVersion = useRef(0);

    // ==========================================
    // INVALIDATE OLD REQUESTS
    // ==========================================

    const invalidateRequests = useCallback(() => {
        requestVersion.current++;
    }, []);

    // ==========================================
    // REFRESH CURRENT SESSION
    // ==========================================

    const refresh = useCallback(async () => {

        const version = ++requestVersion.current;

        try {

            const response = await authApi.me();

            if (version !== requestVersion.current) {
                return;
            }

            setSession(previous => ({
                ...previous,
                user: response.data.data,
                status: "authenticated"
            }));

        } catch (error) {

            if (version !== requestVersion.current) {
                return;
            }

            if (error.response?.status === 401) {

                setSession({
                    user: null,
                    status: "guest",
                    notice: ""
                });

            } else {

                setSession(previous => ({
                    ...previous,

                    status: previous.user
                        ? "authenticated"
                        : "error"
                }));

            }
        }

    }, []);

    // ==========================================
    // INITIAL SESSION AND WINDOW FOCUS
    // ==========================================

    useEffect(() => {

        refresh();

        const handleFocus = () => refresh();

        window.addEventListener(
            "focus",
            handleFocus
        );

        return () => {

            invalidateRequests();

            window.removeEventListener(
                "focus",
                handleFocus
            );

        };

    }, [refresh, invalidateRequests]);

    // ==========================================
    // APPLY AUTHENTICATION RESPONSE
    // ==========================================

    function applyAuthResponse(response) {

        invalidateRequests();

        setSession({
            user: response.data.data,
            status: "authenticated",
            notice: response.data.message || ""
        });

        return response.data;
    }

    // ==========================================
    // LOGIN
    // ==========================================

    async function login(data) {

        const response = await authApi.login(data);

        return applyAuthResponse(response);
    }

    // ==========================================
    // REGISTER
    // ==========================================

    async function register(data) {

        const response = await authApi.register(data);

        return applyAuthResponse(response);
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    async function logout() {

        await authApi.logout();

        invalidateRequests();

        setSession({
            user: null,
            status: "guest",
            notice: ""
        });
    }

    // ==========================================
    // AUTH CONTEXT PROVIDER
    // ==========================================

    return (
        <AuthContext.Provider
            value={{
                ...session,
                login,
                register,
                logout,
                refresh
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ==========================================
// CUSTOM AUTH HOOK
// ==========================================

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider."
        );
    }

    return context;
}