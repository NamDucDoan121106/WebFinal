import {
    randomInt,
    randomBytes,
    createHmac,
    timingSafeEqual
} from "node:crypto";

import { env } from "../config/env.js";

export const OTP_EXPIRY_MINUTES = 10;

// Generate a cryptographically secure 6-digit OTP.
export function generateOTP() {
    return randomInt(0, 1000000)
        .toString()
        .padStart(6, "0");
}

// Generate an unpredictable password reset token.
export function generateResetToken() {
    return randomBytes(32).toString("hex");
}

// Hash OTPs and reset tokens with separate namespaces.
function hashValue(type, value, resetId = "") {
    const digest = createHmac(
        "sha256",
        env.JWT_SECRET
    )
        .update(`${type}:${resetId}:${value}`)
        .digest("hex");

    return `${type}:${digest}`;
}

export function hashOTP(otp, userId) {
    return hashValue("otp", otp, userId);
}

export function hashResetToken(token, resetId) {
    return hashValue("grant", token, resetId);
}

export function safeCompare(first, second) {
    if (
        typeof first !== "string" ||
        typeof second !== "string"
    ) {
        return false;
    }

    const a = Buffer.from(first, "utf8");
    const b = Buffer.from(second, "utf8");

    if (a.length !== b.length) {
        return false;
    }

    return timingSafeEqual(a, b);
}

export function getOTPExpiration() {
    return new Date(
        Date.now() +
        OTP_EXPIRY_MINUTES * 60 * 1000
    );
}