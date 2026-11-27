
import { z } from "zod";

export const emailSchema = z.string()
    .trim()
    .max(254)
    .email("Please enter a valid email address.")
    .transform(value => value.toLowerCase());

export const passwordSchema = z.string()
    .min(8, "Password must have at least 8 characters.")
    .refine(
        value => Buffer.byteLength(value, "utf8") <= 72,
        "Password must not exceed 72 bytes."
    );

export const registerSchema = z.object({
    email: emailSchema,

    display_name: z.string()
        .trim()
        .min(2, "Display name is too short.")
        .max(100, "Display name is too long."),

    password: passwordSchema,

    confirm_password: z.string()

}).strict().refine(
    data => data.password === data.confirm_password,

    {
        path: ["confirm_password"],
        message: "Passwords do not match."
    }
);

export const loginSchema = z.object({
    email: emailSchema,

    password: z.string()
        .min(1, "Password is required.")
        .refine(
            value =>
                Buffer.byteLength(value, "utf8") <= 72,
            "Invalid password."
        )
}).strict();
