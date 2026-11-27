
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";

import {
    AppError,
    notFound,
    errorHandler
} from "./middleware/error.middleware.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet({
    referrerPolicy: {
        policy: "no-referrer"
    }
}));

app.use(express.json({
    limit: "100kb"
}));

app.use(cookieParser());

// Basic same-origin protection for browser mutations.
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
            new AppError("Forbidden request origin.", 403)
        );
    }

    next();
});

// Do not cache authentication responses.
app.use("/api/auth", (req, res, next) => {
    res.set("Cache-Control", "no-store");

    next();
});

// Authentication module
app.use("/api/auth", authRoutes);

// Future modules:
// app.use("/api/users", userRoutes);
// app.use("/api/labels", labelRoutes);
// app.use("/api/notes", noteRoutes);

// Unknown routes
app.use(notFound);

// Global error handling
app.use(errorHandler);

export default app;
