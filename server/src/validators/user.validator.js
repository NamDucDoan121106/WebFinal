import { z } from "zod";

import {
    passwordSchema
} from "./auth.validator.js";

// ======================================
// PROFILE VALIDATION
// ======================================

export const profileSchema = z.object({
    display_name: z.string()
        .trim()
        .min(2, "Display name is too short.")
        .max(100, "Display name is too long.")
        .optional()

}).strict();

// ======================================
// CHANGE PASSWORD VALIDATION
// ======================================

export const changePasswordSchema = z.object({
    current_password: z.string()
        .min(1, "Current password is required.")
        .refine(
            value =>
                Buffer.byteLength(value, "utf8") <= 72,

            "Invalid current password."
        ),

    password: passwordSchema,

    confirm_password: z.string()

}).strict()
    .refine(
        data =>
            data.password === data.confirm_password,

        {
            path: ["confirm_password"],
            message: "Passwords do not match."
        }
    )
    .refine(
        data =>
            data.password !== data.current_password,

        {
            path: ["password"],
            message: "New password must be different."
        }
    );

// ======================================
// USER PREFERENCES VALIDATION
// ======================================

export const preferencesSchema = z.object({
    font_size: z.enum(["sm", "md", "lg"]).optional(),

    theme: z.enum(["light", "dark"]).optional(),

    default_note_color: z.string()
        .regex(
            /^#[0-9a-fA-F]{6}$/,
            "Invalid note color."
        )
        .nullable()
        .optional(),

    view_mode: z.enum(["grid", "list"]).optional()

}).strict().refine(
    data => Object.keys(data).length > 0,

    {
        message: "No preferences provided."
    }
);