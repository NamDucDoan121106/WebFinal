import { rateLimit } from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    limit: 10,

    skipSuccessfulRequests: true,

    standardHeaders: "draft-7",

    legacyHeaders: false,

    message: {
        success: false,

        message:
            "Too many login attempts. Try again later."
    }
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,

    limit: 10,

    standardHeaders: "draft-7",

    legacyHeaders: false,

    message: {
        success: false,

        message:
            "Too many registration attempts."
    }
});
// Limit password reset requests by IP address.
export const forgotLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

// Normalize email addresses for account-level limits.
function emailRateLimitKey(req) {
    const email = req.body?.email;

    if (
        typeof email !== "string" ||
        email.length > 254
    ) {
        return "invalid-email";
    }

    return `email:${email.trim().toLowerCase()}`;
}

// Limit OTP emails for each email address.
export const forgotAccountLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 3,

    keyGenerator: emailRateLimitKey,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many requests for this email. Please try again later."
    }
});

// Limit OTP verification attempts by IP.
export const verifyOTPLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 20,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many OTP attempts. Please try again later."
    }
});

// Limit OTP verification attempts by account.
export const verifyOTPAccountLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,

    keyGenerator: emailRateLimitKey,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many OTP attempts for this email."
    }
});

// Limit password reset submissions.
export const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many reset attempts. Please try again later."
    }
});
export const profileUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,

    keyGenerator: req =>
        `profile:${req.auth.userId}`,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many profile updates. Try again later."
    }
});

export const changePasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,

    keyGenerator: req =>
        `password:${req.auth.userId}`,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many password change attempts. Try again later."
    }
});