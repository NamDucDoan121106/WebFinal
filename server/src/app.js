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

// ==========================================
// SECURITY AND GLOBAL MIDDLEWARE
// ==========================================

app.disable("x-powered-by");

app.use(
    helmet({
        referrerPolicy: {
            policy: "no-referrer"
        }
    })
);

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

app.use(notFound);

// ==========================================
// GLOBAL ERROR HANDLING
// ==========================================

app.use(errorHandler);

export default app;
