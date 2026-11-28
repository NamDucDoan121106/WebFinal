import { z } from "zod";

const querySchema = z.object({
    q: z.string()
        .trim()
        .max(255)
        .optional(),

    labels: z.string()
        .max(2000)
        .optional()
});

function escapeLike(value) {
    return value.replace(
        /[\\%_]/g,
        character => `\\${character}`
    );
}

export function parseNoteQuery(query) {
    const input = querySchema.parse(query);

    const keyword = input.q || "";

    const rawLabels = input.labels || "";

    const labelIds = rawLabels.trim()
        ? rawLabels.split(",").map(value =>
            z.string()
                .trim()
                .regex(/^[1-9]\d*$/)
                .transform(Number)
                .pipe(
                    z.number()
                        .int()
                        .positive()
                        .max(2147483647)
                )
                .parse(value)
        )
        : [];

    return {
        keyword,
        labelIds: [...new Set(labelIds)]
    };
}

export function buildOwnedNotesWhere(
    userId,
    query,
    filterMode = "OR"
) {
    const { keyword, labelIds } =
        parseNoteQuery(query);

    const conditions = [];

    // Search by title and unlocked note content.
    if (keyword) {
        const search = escapeLike(keyword);

        conditions.push({
            OR: [
                {
                    title: {
                        contains: search
                    }
                },

                {
                    password_hash: null,

                    content: {
                        contains: search
                    }
                }
            ]
        });
    }

    // Filter by labels.
    if (labelIds.length > 0) {
        if (filterMode === "AND") {
            for (const labelId of labelIds) {
                conditions.push({
                    note_labels: {
                        some: {
                            label_id: labelId
                        }
                    }
                });
            }
        } else {
            conditions.push({
                note_labels: {
                    some: {
                        label_id: {
                            in: labelIds
                        }
                    }
                }
            });
        }
    }

    return {
        user_id: userId,

        ...(conditions.length > 0
            ? {
                AND: conditions
            }
            : {})
    };
}

export const notesOrderBy = [
    { pinned_at: "desc" },
    { updated_at: "desc" },
    { id: "desc" }
];