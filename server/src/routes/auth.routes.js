
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

// ==========================================
// REGISTER
// POST /api/auth/register
// ==========================================

router.post(
    "/register",
    registerLimiter,
    register
);

// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================

router.post(
    "/login",
    loginLimiter,
    login
);

// ==========================================
// LOGOUT
// POST /api/auth/logout
// ==========================================

router.post(
    "/logout",
    logout
);

// ==========================================
// CURRENT USER
// GET /api/auth/me
// ==========================================

router.get(
    "/me",
    requireAuth,
    me
);

// ==========================================
// EMAIL VERIFICATION
// GET /api/auth/verify/:token
// ==========================================

router.get(
    "/verify/:token",
    verifyAccount
);

// ==========================================
// FORGOT PASSWORD
// POST /api/auth/forgot
// ==========================================

router.post(
    "/forgot",
    forgotLimiter,
    forgotAccountLimiter,
    forgotPassword
);

// ==========================================
// VERIFY OTP
// POST /api/auth/verify-otp
// ==========================================

router.post(
    "/verify-otp",
    verifyOTPLimiter,
    verifyOTPAccountLimiter,
    verifyOTP
);

// ==========================================
// RESET PASSWORD
// POST /api/auth/reset
// ==========================================

router.post(
    "/reset",
    resetPasswordLimiter,
    resetPassword
);

export default router;
