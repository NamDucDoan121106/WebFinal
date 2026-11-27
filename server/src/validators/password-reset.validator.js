import { z } from "zod";

import {
    emailSchema,
    passwordSchema
} from "./auth.validator.js";

// Step 1: Request an OTP.
export const forgotPasswordSchema = z.object({
    email: emailSchema
}).strict();

// Step 2: Verify the OTP.
export const verifyOTPSchema = z.object({
    email: emailSchema,

    otp: z.string()
        .regex(
            /^\d{6}$/,
            "OTP must contain exactly 6 digits."
        )
}).strict();

// Step 3: Reset the password.
export const resetPasswordSchema = z.object({
    reset_token: z.string()
        .max(80)
        .regex(
            /^[1-9]\d*\.[a-f0-9]{64}$/,
            "Invalid password reset token."
        ),

    password: passwordSchema,

    confirm_password: z.string()

}).strict().refine(
    data => data.password === data.confirm_password,

    {
        path: ["confirm_password"],
        message: "Passwords do not match."
    }
);