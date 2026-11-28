import { Router } from "express";

import {
    requireAuth
} from "../middleware/auth.middleware.js";

import {
    getLabels,
    createLabel,
    updateLabel,
    deleteLabel
} from "../controllers/label.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getLabels);

router.post("/", createLabel);

router.put("/:id", updateLabel);

router.delete("/:id", deleteLabel);

export default router;