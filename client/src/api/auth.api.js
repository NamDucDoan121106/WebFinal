import http from "./http.js";

export const authApi = {
    register(data) {
        return http.post("/auth/register", data);
    },

    login(data) {
        return http.post("/auth/login", data);
    },

    logout() {
        return http.post("/auth/logout");
    },

    me() {
        return http.get("/auth/me");
    },

    verify(token) {
        return http.get(
            `/auth/verify/${encodeURIComponent(token)}`
        );
    },

    forgotPassword(email) {
        return http.post("/auth/forgot", {
            email
        });
    },

    verifyOTP(email, otp) {
        return http.post("/auth/verify-otp", {
            email,
            otp
        });
    },

    resetPassword(data) {
        return http.post("/auth/reset", data);
    }
};