import { prisma } from "../config/prisma.js";

import {
    AppError
} from "../middleware/error.middleware.js";

import {
    noteIdSchema,
    noteLabelsSchema
} from "../validators/note-label.validator.js";

export async function updateNoteLabels(req, res) {
    const userId = req.auth.userId;

    const noteId = noteIdSchema.parse(
        req.params.id
    );

    const { label_ids } =
        noteLabelsSchema.parse(req.body);

    let labels;

    try {
        labels = await prisma.$transaction(
            async tx => {
                // Verify note ownership and lock the row.
                const notes = await tx.$queryRaw`
                    SELECT id, password_hash
                    FROM notes
                    WHERE id = ${noteId}
                      AND user_id = ${userId}
                    FOR UPDATE
                `;

                if (notes.length !== 1) {
                    throw new AppError(
                        "Note not found.",
                        404
                    );
                }

                // Locked notes require coordination
                // with the note security module.
                if (notes[0].password_hash !== null) {
                    throw new AppError(
                        "Unlock the note before changing labels.",
                        423
                    );
                }

                // Verify that every label belongs
                // to the current user.
                const ownedLabels =
                    await tx.label.findMany({
                        where: {
                            id: {
                                in: label_ids
                            },

                            user_id: userId
                        },

                        select: {
                            id: true,
                            name: true
                        },

                        orderBy: {
                            name: "asc"
                        }
                    });

                if (
                    ownedLabels.length !==
                    label_ids.length
                ) {
                    throw new AppError(
                        "One or more labels are invalid.",
                        400
                    );
                }

                // Remove previous associations.
                await tx.noteLabel.deleteMany({
                    where: {
                        note_id: noteId
                    }
                });

                // Create new associations.
                if (label_ids.length > 0) {
                    await tx.noteLabel.createMany({
                        data: label_ids.map(labelId => ({
                            note_id: noteId,
                            label_id: labelId
                        }))
                    });
                }

                return ownedLabels;
            }
        );

    } catch (error) {
        if (error.code === "P2003") {
            throw new AppError(
                "A label has changed. Refresh and try again.",
                409
            );
        }

        throw error;
    }

    return res.status(200).json({
        success: true,

        data: {
            note_id: noteId,
            labels
        },

        message: "Note labels updated successfully."
    });
}