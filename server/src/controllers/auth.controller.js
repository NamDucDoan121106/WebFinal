
import bcrypt from "bcrypt";

import {
    randomBytes,
    createHash
} from "node:crypto";

import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

import {
    registerSchema,
    loginSchema
} from "../validators/auth.validator.js";

import {
    setAuthCookie,
    clearAuthCookie
} from "../utils/jwt.js";

import {
    publicUserSelect,
    sanitizeUser
} from "../utils/user.js";

import {
    AppError
} from "../middleware/error.middleware.js";

import { sendEmail } from "../services/mail.service.js";

const BCRYPT_ROUNDS = 12;

// Used to reduce timing differences for unknown users.
const dummyHash = bcrypt.hashSync(
    randomBytes(32).toString("hex"),
    BCRYPT_ROUNDS
);

function hashToken(token) {
    return createHash("sha256")
        .update(token)
        .digest("hex");
}

// ==========================================
// POST /api/auth/register
// ==========================================

export async function register(req, res) {
    const input = registerSchema.parse(req.body);

    const existingUser =
        await prisma.user.findUnique({
            where: {
                email: input.email
            },

            select: {
                id: true
            }
        });

    if (existingUser) {
        throw new AppError(
            "Email address is already registered.",
            409
        );
    }

    const passwordHash = await bcrypt.hash(
        input.password,
        BCRYPT_ROUNDS
    );

    const activationToken = randomBytes(32)
        .toString("hex");

    let user;

    try {
        user = await prisma.user.create({
            data: {
                email: input.email,

                display_name: input.display_name,

                password_hash: passwordHash,

                verify_token:
                    hashToken(activationToken),

                preferences: {
                    create: {}
                }
            },

            select: {
                ...publicUserSelect,
                token_version: true
            }
        });

    } catch (error) {
        if (error.code === "P2002") {
            throw new AppError(
                "Email address is already registered.",
                409
            );
        }

        throw error;
    }

    const activationUrl = new URL(
        `/verify/${activationToken}`,
        env.APP_URL
    ).toString();

    let emailSent = true;

    try {
        await sendEmail({
            to: user.email,

            subject: "Activate your Note App account",

            text: [
                "Welcome to Note App!",
                "",
                "Activate your account using this link:",
                activationUrl,
                "",
                "You can use Note App before activation."
            ].join("\n")
        });

    } catch (error) {
        emailSent = false;

        console.error(
            "Activation email failed:",
            error.code || error.name
        );
    }

    // Automatically log in after registration.
    setAuthCookie(res, user);

    return res.status(201).json({
        success: true,

        data: sanitizeUser(user),

        message: emailSent
            ? "Registration successful. Check your email."
            : "Account created, but activation email could not be sent."
    });
}

// ==========================================
// POST /api/auth/login
// ==========================================

export async function login(req, res) {
    const input = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
        where: {
            email: input.email
        },

        select: {
            ...publicUserSelect,
            password_hash: true,
            token_version: true
        }
    });

    const passwordValid = await bcrypt.compare(
        input.password,
        user?.password_hash || dummyHash
    );

    if (!user || !passwordValid) {
        throw new AppError(
            "Invalid email or password.",
            401
        );
    }

    setAuthCookie(res, user);

    return res.status(200).json({
        success: true,

        data: sanitizeUser(user),

        message: "Login successful."
    });
}

// ==========================================
// POST /api/auth/logout
// ==========================================

export async function logout(req, res) {
    clearAuthCookie(res);

    return res.status(200).json({
        success: true,

        message: "Logout successful."
    });
}

// ==========================================
// GET /api/auth/me
// ==========================================

export async function me(req, res) {
    return res.status(200).json({
        success: true,

        data: req.user
    });
}

// ==========================================
// GET /api/auth/verify/:token
// ==========================================

export async function verifyAccount(req, res) {
    const token = req.params.token;

    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/i.test(token)
    ) {
        throw new AppError(
            "Invalid activation link.",
            400
        );
    }

    const result = await prisma.user.updateMany({
        where: {
            verify_token: hashToken(token),
            is_verified: false
        },

        data: {
            is_verified: true,
            verify_token: null
        }
    });

    if (result.count !== 1) {
        throw new AppError(
            "Invalid or already used activation link.",
            400
        );
    }

    return res.status(200).json({
        success: true,

        message: "Account activated successfully."
    });
}
