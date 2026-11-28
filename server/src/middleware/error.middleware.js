
import { ZodError } from "zod";

export class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);

        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

export function notFound(req, res) {
    return res.status(404).json({
        success: false,
        message: "Endpoint not found."
    });
}

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    if (err.name === "MulterError") {
    
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            success: false,
            message: "Avatar must not exceed 2 MB."
        });
    }

    return res.status(400).json({
        success: false,
        message: "Invalid avatar upload request."
    });
}

    if (err instanceof ZodError) {
        return res.status(422).json({
            success: false,

            message: err.issues[0]?.message
                || "Invalid input."
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    if (err.code === "P2002") {
        return res.status(409).json({
            success: false,
            message: "This value already exists."
        });
    }

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request."
        });
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request is too large."
        });
    }

    console.error("Unhandled error:", err.code || err.name);

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
}
