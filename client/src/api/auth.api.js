import http from "./http.js";

export const authApi = {
    register: data => http.post("/auth/register", data),

    login: data => http.post("/auth/login", data),

    logout: () => http.post("/auth/logout"),

    me: () => http.get("/auth/me"),

    verify: token => http.get(
        `/auth/verify/${token}`
    )
};