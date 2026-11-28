import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { authApi } from "../api/auth.api.js";
import { useAuth } from "./AuthContext.jsx";
import "./auth.css";

export default function VerifyPage() {
    const { token } = useParams();
    const { refresh } = useAuth();
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("Verifying your email...");
    const requestRef = useRef(null);

    useEffect(() => {
        let active = true;

        async function verify() {
            if (!token) {
                setStatus("error");
                setMessage("Verification token is missing.");
                return;
            }

            setStatus("loading");
            setMessage("Verifying your email...");

            try {
                if (requestRef.current?.token !== token) {
                    requestRef.current = {
                        token,
                        promise: Promise.resolve().then(() => authApi.verify(token))
                    };
                }

                const response = await requestRef.current.promise;

                if (response.data.success === false) {
                    throw new Error(response.data.message || "Verification failed.");
                }

                if (!active) return;

                await refresh();
                if (!active) return;

                setStatus("success");
                setMessage(response.data.message || "Your email has been verified successfully.");
            } catch (error) {
                if (!active) return;

                setStatus("error");
                setMessage(error.response?.data?.message || error.message || "Invalid or expired verification token.");
            }
        }

        verify();
        return () => { active = false; };
    }, [token, refresh]);

    return (
        <main className="auth-page">
            <section className="auth-card">
                <div className="auth-brand">
                    <span className="auth-logo">N</span>
                    <span>Note App</span>
                </div>
                <header className="auth-heading">
                    <h1>{status === "loading" ? "Verifying email" : status === "success" ? "Email verified" : "Verification failed"}</h1>
                </header>
                <div className={status === "error" ? "auth-error" : status === "success" ? "auth-success" : "auth-status"} role={status === "error" ? "alert" : "status"}>
                    {message}
                </div>
                {status !== "loading" && (
                    <footer className="auth-footer">
                        <Link to={status === "success" ? "/" : "/login"}>
                            {status === "success" ? "Continue to Note App" : "Back to sign in"}
                        </Link>
                    </footer>
                )}
            </section>
        </main>
    );
}
