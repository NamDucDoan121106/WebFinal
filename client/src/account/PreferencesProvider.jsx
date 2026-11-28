import { useEffect } from "react";

import {
    useAuth
} from "../auth/AuthContext.jsx";

const fontSizes = {
    sm: "13px",
    md: "15px",
    lg: "18px"
};

export default function PreferencesProvider({
    children
}) {
    const { user } = useAuth();

    const theme =
        user?.preferences?.theme || "light";

    const fontSize =
        user?.preferences?.font_size || "md";

    const noteColor =
        user?.preferences?.default_note_color;

    useEffect(() => {
        const root = document.documentElement;

        root.dataset.theme = theme;

        root.classList.toggle(
            "dark",
            theme === "dark"
        );

        root.style.setProperty(
            "--note-font-size",
            fontSizes[fontSize] || fontSizes.md
        );

        root.style.setProperty(
            "--default-note-color",
            noteColor || "var(--account-surface)"
        );

        return () => {
            delete root.dataset.theme;

            root.classList.remove("dark");

            root.style.removeProperty(
                "--note-font-size"
            );

            root.style.removeProperty(
                "--default-note-color"
            );
        };

    }, [theme, fontSize, noteColor]);

    return children;
}