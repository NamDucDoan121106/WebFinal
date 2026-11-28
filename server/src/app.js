import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import noteLabelRoutes
    from "./routes/note-label.routes.js";
import labelRoutes from "./routes/label.routes.js";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

import {
    AppError,
    notFound,
    errorHandler
} from "./middleware/error.middleware.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDist = path.resolve(
    __dirname,
    "../../client/dist"
);

const serveClient =
    env.NODE_ENV === "production" ||
    process.env.SERVE_CLIENT === "true";
// ==========================================
// SECURITY AND GLOBAL MIDDLEWARE
// ==========================================

app.disable("x-powered-by");

app.use(helmet({
    referrerPolicy: {
        policy: "no-referrer"
    },

    contentSecurityPolicy: {
        directives: {
            imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https://res.cloudinary.com"
            ],

            mediaSrc: [
                "'self'",
                "blob:",
                "https://res.cloudinary.com"
            ]
        }
    }
}));

app.use(
    express.json({
        limit: "100kb"
    })
);

app.use(cookieParser());

// ==========================================
// SAME-ORIGIN PROTECTION
// ==========================================

app.use("/api", (req, res, next) => {
    const safeMethods = [
        "GET",
        "HEAD",
        "OPTIONS"
    ];

    if (safeMethods.includes(req.method)) {
        return next();
    }

    const origin = req.get("origin");

    const allowedOrigin =
        new URL(env.APP_URL).origin;

    if (
        req.get("sec-fetch-site") === "cross-site" ||
        (origin && origin !== allowedOrigin)
    ) {
        return next(
            new AppError(
                "Forbidden request origin.",
                403
            )
        );
    }

    next();
});

// ==========================================
// CACHE PROTECTION
// ==========================================

app.use("/api/auth", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.use("/api/users", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// ==========================================
// API ROUTES
// ==========================================

// Authentication:
// Register, login, logout, current user,
// email verification and password recovery.

app.use("/api/auth", authRoutes);

// User account:
// Profile, avatar, password and preferences.

app.use("/api/users", userRoutes);

app.use("/api/labels", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.use("/api/labels", labelRoutes);

app.use("/api/notes", noteLabelRoutes);
// ==========================================
// FUTURE MODULES
// ==========================================

// app.use("/api/labels", labelRoutes);
// app.use("/api/notes", noteRoutes);
// app.use("/api/attachments", attachmentRoutes);
// app.use("/api/shares", shareRoutes);

// ==========================================
// UNKNOWN ROUTES
// ==========================================
app.get("/healthz", (req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy"
    });
});
// Unknown API requests must return JSON.
app.use("/api", notFound);

// Serve React production build.
if (serveClient) {
    if (!existsSync(
        path.join(clientDist, "index.html")
    )) {
        throw new Error(
            "React production build not found."
        );
    }

    app.use(express.static(clientDist, {
        index: false
    }));

    // React Router fallback for Express 5.
    app.get("/{*splat}", (req, res, next) => {
        if (!req.accepts("html")) {
            return next();
        }

        res.set("Cache-Control", "no-cache");

        return res.sendFile(
            path.join(clientDist, "index.html")
        );
    });
}

app.use(notFound);
app.use(errorHandler);

export default app;
