import bcrypt from "bcrypt";

import { prisma } from "../config/prisma.js";

import { sendEmail } from "../services/mail.service.js";

import {
    AppError
} from "../middleware/error.middleware.js";

import {
    forgotPasswordSchema,
    verifyOTPSchema,
    resetPasswordSchema
} from "../validators/password-reset.validator.js";

import {
    generateOTP,
    generateResetToken,
    hashOTP,
    hashResetToken,
    safeCompare,
    getOTPExpiration
} from "../utils/otp.js";

import {
    clearAuthCookie
} from "../utils/jwt.js";

const BCRYPT_ROUNDS = 12;

const GENERIC_RESPONSE =
    "If an account exists for this email, a password reset code will be sent.";

// Serialize password reset operations for each user.
async function lockUser(tx, userId) {
    const rows = await tx.$queryRaw`
        SELECT id
        FROM users
        WHERE id = ${userId}
        FOR UPDATE
    `;

    return rows.length === 1;
}

// ============================================
// POST /api/auth/forgot
// ============================================

export async function forgotPassword(req, res) {
    const { email } =
        forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
        where: { email },

        select: {
            id: true,
            email: true
        }
    });

    // Do not reveal whether the account exists.
    if (!user) {
        return res.status(200).json({
            success: true,
            message: GENERIC_RESPONSE
        });
    }

    const otp = generateOTP();

    const otpHash = hashOTP(otp, user.id);

    // Invalidate previous reset requests and create
    // a new OTP in the same transaction.
    const resetRecord = await prisma.$transaction(
        async tx => {
            if (!(await lockUser(tx, user.id))) {
                return null;
            }

            await tx.passwordReset.updateMany({
                where: {
                    user_id: user.id,
                    used: false
                },

                data: {
                    used: true
                }
            });

            return tx.passwordReset.create({
                data: {
                    user_id: user.id,
                    otp_hash: otpHash,
                    expires_at: getOTPExpiration(),
                    used: false
                },

                select: {
                    id: true
                }
            });
        }
    );

    if (!resetRecord) {
        return res.status(200).json({
            success: true,
            message: GENERIC_RESPONSE
        });
    }

    try {
        await sendEmail({
            to: user.email,

            subject: "Note App - Password Reset Code",

            text: [
                "You requested a password reset.",
                "",
                `Your verification code is: ${otp}`,
                "",
                "This code expires in 10 minutes.",
                "",
                "If you did not request a password reset,",
                "you can safely ignore this email."
            ].join("\n"),

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 480px;
                    margin: auto;
                    padding: 24px;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                ">
                    <h2 style="color: #2563eb;">
                        Note App
                    </h2>

                    <h3>Reset your password</h3>

                    <p>
                        Use the following verification code
                        to reset your password.
                    </p>

                    <div style="
                        background: #eff6ff;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        color: #1d4ed8;
                    ">
                        ${otp}
                    </div>

                    <p>
                        This code expires in 10 minutes.
                    </p>

                    <p>
                        If you did not request a password
                        reset, ignore this email.
                    </p>
                </div>
            `
        });

    } catch (error) {
        // Invalidate the OTP if sending fails.
        await prisma.passwordReset.updateMany({
            where: {
                id: resetRecord.id,
                otp_hash: otpHash,
                used: false
            },

            data: {
                used: true
            }
        });

        console.error(
            "Password reset email failed:",
            error.code || error.name
        );
    }

    return res.status(200).json({
        success: true,
        message: GENERIC_RESPONSE
    });
}

// ============================================
// POST /api/auth/verify-otp
// ============================================

export async function verifyOTP(req, res) {
    const { email, otp } =
        verifyOTPSchema.parse(req.body);

    const user = await prisma.user.findUnique({
        where: { email },

        select: {
            id: true
        }
    });

    const invalidOTP = () =>
        new AppError("Invalid or expired OTP.", 400);

    if (!user) {
        throw invalidOTP();
    }

    const secret = generateResetToken();

    const resetToken = await prisma.$transaction(
        async tx => {
            if (!(await lockUser(tx, user.id))) {
                throw invalidOTP();
            }

            const record =
                await tx.passwordReset.findFirst({
                    where: {
                        user_id: user.id,
                        used: false,

                        expires_at: {
                            gt: new Date()
                        }
                    },

                    orderBy: {
                        id: "desc"
                    }
                });

            if (!record) {
                throw invalidOTP();
            }

            const expectedHash =
                hashOTP(otp, user.id);

            if (
                !safeCompare(
                    record.otp_hash,
                    expectedHash
                )
            ) {
                throw invalidOTP();
            }

            // Consume the OTP by replacing its hash
            // with the hash of a reset grant.
            const grantHash = hashResetToken(
                secret,
                record.id
            );

            const updated =
                await tx.passwordReset.updateMany({
                    where: {
                        id: record.id,
                        otp_hash: expectedHash,
                        used: false,

                        expires_at: {
                            gt: new Date()
                        }
                    },

                    data: {
                        otp_hash: grantHash
                    }
                });

            if (updated.count !== 1) {
                throw invalidOTP();
            }

            return `${record.id}.${secret}`;
        }
    );

    return res.status(200).json({
        success: true,

        data: {
            reset_token: resetToken
        },

        message: "OTP verified successfully."
    });
}

// ============================================
// POST /api/auth/reset
// ============================================

export async function resetPassword(req, res) {
    const input =
        resetPasswordSchema.parse(req.body);

    const [idPart, secret] =
        input.reset_token.split(".");

    const resetId = Number(idPart);

    const invalidToken = () =>
        new AppError(
            "Invalid or expired password reset token.",
            400
        );

    if (
        !Number.isSafeInteger(resetId) ||
        resetId <= 0 ||
        resetId > 2147483647
    ) {
        throw invalidToken();
    }

    const expectedHash = hashResetToken(
        secret,
        resetId
    );

    const existing =
        await prisma.passwordReset.findUnique({
            where: {
                id: resetId
            }
        });

    if (
        !existing ||
        existing.used ||
        existing.expires_at <= new Date() ||
        !safeCompare(
            existing.otp_hash,
            expectedHash
        )
    ) {
        throw invalidToken();
    }

    const passwordHash = await bcrypt.hash(
        input.password,
        BCRYPT_ROUNDS
    );

    await prisma.$transaction(async tx => {
        if (!(await lockUser(tx, existing.user_id))) {
            throw invalidToken();
        }

        // Atomically consume the reset token.
        const consumed =
            await tx.passwordReset.updateMany({
                where: {
                    id: resetId,
                    user_id: existing.user_id,
                    otp_hash: expectedHash,
                    used: false,

                    expires_at: {
                        gt: new Date()
                    }
                },

                data: {
                    used: true
                }
            });

        if (consumed.count !== 1) {
            throw invalidToken();
        }

        // Update the password and invalidate old JWTs.
        await tx.user.update({
            where: {
                id: existing.user_id
            },

            data: {
                password_hash: passwordHash,

                token_version: {
                    increment: 1
                }
            }
        });

        // Invalidate all other outstanding reset requests.
        await tx.passwordReset.updateMany({
            where: {
                user_id: existing.user_id,
                used: false
            },

            data: {
                used: true
            }
        });
    });

    // Do not automatically log in.
    clearAuthCookie(res);

    return res.status(200).json({
        success: true,
        message: "Password reset successfully. Please sign in."
    });
}