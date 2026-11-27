
import { Router } from "express";

import {
    register,
    login,
    logout,
    me,
    verifyAccount
} from "../controllers/auth.controller.js";

import {
    requireAuth
} from "../middleware/auth.middleware.js";

import {
    loginLimiter,
    registerLimiter
} from "../middleware/rate-limit.middleware.js";

const router = Router();

router.post(
    "/register",
    registerLimiter,
    register
);

router.post(
    "/login",
    loginLimiter,
    login
);

router.post(
    "/logout",
    logout
);

router.get(
    "/me",
    requireAuth,
    me
);

router.get(
    "/verify/:token",
    verifyAccount
);

export default router;
