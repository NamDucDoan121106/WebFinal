import { Router } from "express";

import {
    requireAuth
} from "../middleware/auth.middleware.js";

import {
    updateNoteLabels
} from "../controllers/note-label.controller.js";

const router = Router();

router.put(
    "/:id/labels",
    requireAuth,
    updateNoteLabels
);

export default router;