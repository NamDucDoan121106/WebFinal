import { prisma } from "../config/prisma.js";

import {
    AppError
} from "../middleware/error.middleware.js";

import {
    labelSchema,
    labelIdSchema
} from "../validators/label.validator.js";

const labelSelect = {
    id: true,
    name: true
};

// ========================================
// GET /api/labels
// ========================================

export async function getLabels(req, res) {
    const userId = req.auth.userId;

    const labels = await prisma.label.findMany({
        where: {
            user_id: userId
        },

        select: labelSelect,

        orderBy: {
            name: "asc"
        }
    });

    return res.status(200).json({
        success: true,
        data: labels
    });
}

// ========================================
// POST /api/labels
// ========================================

export async function createLabel(req, res) {
    const userId = req.auth.userId;

    const { name } = labelSchema.parse(req.body);

    try {
        const label = await prisma.label.create({
            data: {
                user_id: userId,
                name
            },

            select: labelSelect
        });

        return res.status(201).json({
            success: true,
            data: label,
            message: "Label created successfully."
        });

    } catch (error) {
        if (error.code === "P2002") {
            throw new AppError(
                "A label with this name already exists.",
                409
            );
        }

        throw error;
    }
}

// ========================================
// PUT /api/labels/:id
// ========================================

export async function updateLabel(req, res) {
    const userId = req.auth.userId;

    const labelId = labelIdSchema.parse(
        req.params.id
    );

    const { name } = labelSchema.parse(req.body);

    try {
        const label = await prisma.label.update({
            where: {
                id: labelId,
                user_id: userId
            },

            data: {
                name
            },

            select: labelSelect
        });

        return res.status(200).json({
            success: true,
            data: label,
            message: "Label updated successfully."
        });

    } catch (error) {
        if (error.code === "P2025") {
            throw new AppError(
                "Label not found.",
                404
            );
        }

        if (error.code === "P2002") {
            throw new AppError(
                "A label with this name already exists.",
                409
            );
        }

        throw error;
    }
}

// ========================================
// DELETE /api/labels/:id
// ========================================

export async function deleteLabel(req, res) {
    const userId = req.auth.userId;

    const labelId = labelIdSchema.parse(
        req.params.id
    );

    try {
        await prisma.label.delete({
            where: {
                id: labelId,
                user_id: userId
            }
        });

        return res.status(200).json({
            success: true,
            message: "Label deleted successfully."
        });

    } catch (error) {
        if (error.code === "P2025") {
            throw new AppError(
                "Label not found.",
                404
            );
        }

        throw error;
    }
}