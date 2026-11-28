import { z } from "zod";

export const labelSchema = z.object({
    name: z.string()
        .trim()
        .min(1, "Label name is required.")
        .max(100, "Label name must not exceed 100 characters.")
}).strict();

export const labelIdSchema = z.string()
    .regex(/^[1-9]\d*$/, "Invalid label ID.")
    .transform(Number)
    .refine(
        value =>
            Number.isSafeInteger(value) &&
            value <= 2147483647,
        "Invalid label ID."
    );