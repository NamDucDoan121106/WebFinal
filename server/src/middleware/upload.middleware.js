import multer from "multer";

import {
    AppError
} from "./error.middleware.js";

const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
]);

export const uploadAvatar = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
        fields: 1,
        fieldSize: 1024,
        parts: 3
    },

    fileFilter(req, file, callback) {
        if (!allowedTypes.has(file.mimetype)) {
            return callback(
                new AppError(
                    "Only JPG, PNG and WebP images are allowed.",
                    400
                )
            );
        }

        callback(null, true);
    }

}).single("avatar");