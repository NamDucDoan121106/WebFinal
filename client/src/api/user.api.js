import http from "./http.js";

export const userApi = {
    updateProfile(data) {
        return http.put("/users/profile", data);
    },

    changePassword(data) {
        return http.put("/users/password", data);
    },

    updatePreferences(data) {
        return http.put("/users/preferences", data);
    }
};