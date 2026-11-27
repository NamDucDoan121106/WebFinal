
import jwt from "jsonwebtoken";

import {
    env,
    isProduction
} from "../config/env.js";

export const COOKIE_NAME = "note_session";

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/"
};

export function createToken(user) {
    return jwt.sign(
        {
            token_version: user.token_version
        },

        env.JWT_SECRET,

        {
            subject: String(user.id),
            expiresIn: env.JWT_EXPIRES_IN,
            algorithm: "HS256",
            issuer: "note-app",
            audience: "note-app-session"
        }
    );
}

export function verifyToken(token) {
    return jwt.verify(
        token,
        env.JWT_SECRET,
        {
            algorithms: ["HS256"],
            issuer: "note-app",
            audience: "note-app-session"
        }
    );
}

export function setAuthCookie(res, user) {
    const token = createToken(user);

    res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,

        maxAge: 7 * 24 * 60 * 60 * 1000
    });
}

export function clearAuthCookie(res) {
    res.clearCookie(
        COOKIE_NAME,
        cookieOptions
    );
}
