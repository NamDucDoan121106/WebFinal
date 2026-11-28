import http from "./http.js";

export const noteSearchApi = {
    search({
        keyword = "",
        labelIds = [],
        signal
    } = {}) {
        return http.get("/notes", {
            params: {
                ...(keyword.trim()
                    ? {
                        q: keyword.trim()
                    }
                    : {}),

                ...(labelIds.length > 0
                    ? {
                        labels: labelIds.join(",")
                    }
                    : {})
            },

            signal
        });
    }
};