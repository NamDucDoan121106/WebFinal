import http from "./http.js";

export const labelApi = {
    getAll() {
        return http.get("/labels");
    },

    create(name) {
        return http.post("/labels", { name });
    },

    update(id, name) {
        return http.put(`/labels/${id}`, { name });
    },

    remove(id) {
        return http.delete(`/labels/${id}`);
    }
};