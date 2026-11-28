import { z } from "zod";

export const noteIdSchema = z.string()
    .regex(/^[1-9]\d*$/, "Invalid note ID.")
    .transform(Number)
    .refine(
        value =>
            Number.isSafeInteger(value) &&
            value <= 2147483647,
        "Invalid note ID."
    );

export const noteLabelsSchema = z.object({
    label_ids: z.array(
        z.number()
            .int()
            .positive()
            .max(2147483647)
    ).transform(ids => [...new Set(ids)])
}).strict();