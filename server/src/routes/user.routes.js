import { Router } from "express";

import {
    updateProfile,
    changePassword,
    updatePreferences
} from "../controllers/user.controller.js";

import {
    requireAuth
} from "../middleware/auth.middleware.js";

import {
    uploadAvatar
} from "../middleware/upload.middleware.js";

import {
    profileUpdateLimiter,
    changePasswordLimiter
} from "../middleware/rate-limit.middleware.js";

const router = Router();

// All user endpoints require authentication.
router.use(requireAuth);

router.put(
    "/profile",
    profileUpdateLimiter,
    uploadAvatar,
    updateProfile
);

router.put(
    "/password",
    changePasswordLimiter,
    changePassword
);

router.put(
    "/preferences",
    updatePreferences
);

export default router;