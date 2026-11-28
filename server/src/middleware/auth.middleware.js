
import { prisma } from "../config/prisma.js";

import {
    COOKIE_NAME,
    verifyToken,
    clearAuthCookie
} from "../utils/jwt.js";

import {
    publicUserSelect,
    sanitizeUser
} from "../utils/user.js";

import { AppError } from "./error.middleware.js";

export async function requireAuth(req, res, next) {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
        throw new AppError(
            "Authentication required.",
            401
        );
    }

    let payload;

    try {
        payload = verifyToken(token);
    } catch {
        clearAuthCookie(res);

        throw new AppError(
            "Invalid or expired session.",
            401
        );
    }

    const userId = Number(payload.sub);

    if (
        !Number.isSafeInteger(userId) ||
        userId <= 0
    ) {
        clearAuthCookie(res);

        throw new AppError("Invalid session.", 401);
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },

        select: {
            ...publicUserSelect,
            token_version: true
        }
    });

    if (
        !user ||
        user.token_version !== payload.token_version
    ) {
        clearAuthCookie(res);

        throw new AppError(
            "Session is no longer valid.",
            401
        );
    }

    req.auth = {
        userId: user.id,

        tokenVersion: user.token_version
    };

    req.user = sanitizeUser(user);

    next();
}
