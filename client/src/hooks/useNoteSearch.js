import {
    useEffect,
    useState,
    useCallback
} from "react";

import useDebounce from "./useDebounce.js";

import {
    noteSearchApi
} from "../api/note-search.api.js";

export default function useNoteSearch({
    keyword = "",
    labelIds = []
} = {}) {
    const debouncedKeyword =
        useDebounce(keyword, 300);

    const labelKey = [...new Set(labelIds)]
        .sort((a, b) => a - b)
        .join(",");

    const [notes, setNotes] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [version, setVersion] = useState(0);

    const refresh = useCallback(() => {
        setVersion(previous => previous + 1);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        let active = true;

        async function loadNotes() {
            setLoading(true);
            setError("");

            try {
                const response =
                    await noteSearchApi.search({
                        keyword: debouncedKeyword,

                        labelIds: labelKey
                            ? labelKey.split(",")
                                .map(Number)
                            : [],

                        signal: controller.signal
                    });

                if (active) {
                    setNotes(response.data.data);
                }

            } catch (err) {
                if (
                    active &&
                    !controller.signal.aborted
                ) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load notes."
                    );
                }

            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadNotes();

        return () => {
            active = false;
            controller.abort();
        };

    }, [
        debouncedKeyword,
        labelKey,
        version
    ]);

    return {
        notes,
        loading,
        error,
        refresh
    };
}