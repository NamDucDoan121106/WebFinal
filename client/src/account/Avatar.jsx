import { useState } from "react";

import "./account.css";

export default function Avatar({
    src,
    name,
    size = 96
}) {
    const [failedSource, setFailedSource] =
        useState(null);

    const initials = (name || "User")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word[0]?.toUpperCase())
        .join("");

    const dimensions = {
        width: size,
        height: size
    };

    if (src && failedSource !== src) {
        return (
            <img
                className="account-avatar"
                src={src}
                alt={`${name || "User"} avatar`}
                style={dimensions}
                onError={() => setFailedSource(src)}
            />
        );
    }

    return (
        <div
            className="account-avatar account-avatar-default"
            style={dimensions}
            role="img"
            aria-label={`${name || "User"} default avatar`}
        >
            {initials || "U"}
        </div>
    );
}