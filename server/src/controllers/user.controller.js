import bcrypt from "bcrypt";

import { prisma } from "../config/prisma.js";

import {
    AppError
} from "../middleware/error.middleware.js";

import {
    profileSchema,
    changePasswordSchema,
    preferencesSchema
} from "../validators/user.validator.js";

import {
    uploadUserAvatar,
    deleteAvatar,
    getOwnedAvatarPublicId
} from "../services/avatar.service.js";

import {
    publicUserSelect,
    sanitizeUser
} from "../utils/user.js";

import {
    setAuthCookie
} from "../utils/jwt.js";

const BCRYPT_ROUNDS = 12;

// ======================================
// PUT /api/users/profile
// ======================================

export async function updateProfile(req, res) {
    const userId = req.auth.userId;

    const input = profileSchema.parse(
        req.body || {}
    );

    if (
        input.display_name === undefined &&
        !req.file
    ) {
        throw new AppError(
            "No profile changes provided.",
            400
        );
    }

    const previousAvatar = req.user.avatar_url;

    let uploadedAvatar = null;
    let updatedUser;

    const data = {};

    if (input.display_name !== undefined) {
        data.display_name = input.display_name;
    }

    if (req.file) {
        uploadedAvatar = await uploadUserAvatar(
            req.file,
            userId
        );

        data.avatar_url = uploadedAvatar.url;
    }

    try {
        updatedUser = await prisma.user.update({
            where: {
                id: userId,

                token_version:
                    req.auth.tokenVersion,

                ...(uploadedAvatar
                    ? {
                        avatar_url: previousAvatar
                    }
                    : {})
            },

            data,

            select: publicUserSelect
        });

    } catch (error) {
        if (uploadedAvatar) {
            await deleteAvatar(
                uploadedAvatar.publicId
            );
        }

        if (error.code === "P2025") {
            throw new AppError(
                "Profile or session has changed. Refresh and try again.",
                409
            );
        }

        throw error;
    }

    // Remove the previous avatar after the new
    // avatar has been stored successfully.
    if (uploadedAvatar && previousAvatar) {
        const previousPublicId =
            getOwnedAvatarPublicId(
                previousAvatar,
                userId
            );

        if (previousPublicId) {
            await deleteAvatar(previousPublicId);
        }
    }

    return res.status(200).json({
        success: true,

        data: updatedUser,

        message: "Profile updated successfully."
    });
}

// ======================================
// PUT /api/users/password
// ======================================

export async function changePassword(req, res) {
    const input = changePasswordSchema.parse(
        req.body
    );

    const userId = req.auth.userId;

    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },

        select: {
            id: true,
            password_hash: true,
            token_version: true
        }
    });

    if (
        !user ||
        user.token_version !==
            req.auth.tokenVersion
    ) {
        throw new AppError(
            "Invalid or expired session.",
            401
        );
    }

    const validPassword = await bcrypt.compare(
        input.current_password,
        user.password_hash
    );

    if (!validPassword) {
        throw new AppError(
            "Current password is incorrect.",
            400
        );
    }

    const newPasswordHash = await bcrypt.hash(
        input.password,
        BCRYPT_ROUNDS
    );

    const updatedUser = await prisma.$transaction(
        async tx => {
            const result = await tx.user.updateMany({
                where: {
                    id: userId,

                    password_hash:
                        user.password_hash,

                    token_version:
                        user.token_version
                },

                data: {
                    password_hash: newPasswordHash,

                    token_version: {
                        increment: 1
                    }
                }
            });

            if (result.count !== 1) {
                throw new AppError(
                    "Your account has changed. Please sign in again.",
                    401
                );
            }

            // Invalidate outstanding password reset codes.
            await tx.passwordReset.updateMany({
                where: {
                    user_id: userId,
                    used: false
                },

                data: {
                    used: true
                }
            });

            return tx.user.findUniqueOrThrow({
                where: {
                    id: userId
                },

                select: {
                    ...publicUserSelect,
                    token_version: true
                }
            });
        }
    );

    // Issue a new JWT only to the current browser.
    setAuthCookie(res, updatedUser);

    return res.status(200).json({
        success: true,

        data: sanitizeUser(updatedUser),

        message: "Password changed successfully."
    });
}

// ======================================
// PUT /api/users/preferences
// ======================================

export async function updatePreferences(req, res) {
    const userId = req.auth.userId;

    const input = preferencesSchema.parse(
        req.body
    );

    const preferences = await prisma.$transaction(
        async tx => {
            const rows = await tx.$queryRaw`
                SELECT id, token_version
                FROM users
                WHERE id = ${userId}
                FOR UPDATE
            `;

            if (
                rows.length !== 1 ||
                Number(rows[0].token_version) !==
                    req.auth.tokenVersion
            ) {
                throw new AppError(
                    "Invalid or expired session.",
                    401
                );
            }

            return tx.userPreference.upsert({
                where: {
                    user_id: userId
                },

                update: input,

                create: {
                    user_id: userId,
                    ...input
                }
            });
        }
    );

    return res.status(200).json({
        success: true,

        data: preferences,

        message: "Preferences updated successfully."
    });
}