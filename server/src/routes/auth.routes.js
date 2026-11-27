import { Router } from "express";

import {
    register,
    login,
    logout,
    me,
    verifyAccount
} from "../controllers/auth.controller.js";

import {
    forgotPassword,
    verifyOTP,
    resetPassword
} from "../controllers/password-reset.controller.js";

import {
    requireAuth
} from "../middleware/auth.middleware.js";

import {
    loginLimiter,
    registerLimiter,

    forgotLimiter,
    forgotAccountLimiter,

    verifyOTPLimiter,
    verifyOTPAccountLimiter,

    resetPasswordLimiter
} from "../middleware/rate-limit.middleware.js";

const router = Router();

// Registration
router.post(
    "/register",
    registerLimiter,
    register
);

// Login
router.post(
    "/login",
    loginLimiter,
    login
);

// Logout
router.post(
    "/logout",
    logout
);

// Current user
router.get(
    "/me",
    requireAuth,
    me
);

// Account activation
router.get(
    "/verify/:token",
    verifyAccount
);

// Request password reset
router.post(
    "/forgot",
    forgotLimiter,
    forgotAccountLimiter,
    forgotPassword
);

// Verify OTP
router.post(
    "/verify-otp",
    verifyOTPLimiter,
    verifyOTPAccountLimiter,
    verifyOTP
);

// Reset password
router.post(
    "/reset",
    resetPasswordLimiter,
    resetPassword
);

export default router;