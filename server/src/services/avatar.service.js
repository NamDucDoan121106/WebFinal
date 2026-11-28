import sharp from "sharp";

import {
    randomUUID
} from "node:crypto";

import {
    getCloudinary
} from "../config/cloudinary.js";

import {
    AppError
} from "../middleware/error.middleware.js";

const mimeFormats = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp"
};

export async function uploadUserAvatar(file, userId) {
    let imageBuffer;

    try {
        const image = sharp(file.buffer, {
            limitInputPixels: 16000000,
            failOn: "warning"
        });

        const metadata = await image.metadata();

        const expectedFormat =
            mimeFormats[file.mimetype];

        if (
            !expectedFormat ||
            metadata.format !== expectedFormat ||
            (metadata.pages || 1) > 1
        ) {
            throw new Error("Invalid image format.");
        }

        imageBuffer = await image
            .rotate()
            .resize(512, 512, {
                fit: "cover"
            })
            .webp({
                quality: 85
            })
            .toBuffer();

    } catch {
        throw new AppError(
            "Invalid or unsupported image file.",
            400
        );
    }

    const publicId =
        `note-app/avatars/${userId}-${randomUUID()}`;

    try {
        const cloudinary = getCloudinary();

        const result = await new Promise(
            (resolve, reject) => {
                const stream =
                    cloudinary.uploader.upload_stream(
                        {
                            public_id: publicId,
                            resource_type: "image",
                            overwrite: false,
                            format: "webp"
                        },

                        (error, response) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(response);
                            }
                        }
                    );

                stream.on("error", reject);

                stream.end(imageBuffer);
            }
        );

        return {
            url: result.secure_url,
            publicId: result.public_id
        };

    } catch (error) {
        console.error(
            "Avatar upload failed:",
            error.code || error.name
        );

        throw new AppError(
            "Unable to upload avatar. Please try again.",
            502
        );
    }
}

export async function deleteAvatar(publicId) {
    try {
        await getCloudinary().uploader.destroy(
            publicId,
            {
                resource_type: "image",
                invalidate: true
            }
        );

    } catch (error) {
        console.error(
            "Avatar cleanup failed:",
            error.code || error.name
        );
    }
}

export function getOwnedAvatarPublicId(url, userId) {
    if (!url) return null;

    try {
        const parsed = new URL(url);

        const cloudName =
            getCloudinary().config().cloud_name;

        const prefix =
            `/${cloudName}/image/upload/`;

        if (
            parsed.protocol !== "https:" ||
            parsed.hostname !== "res.cloudinary.com" ||
            !parsed.pathname.startsWith(prefix)
        ) {
            return null;
        }

        const assetPath = parsed.pathname
            .slice(prefix.length)
            .replace(/^v\d+\//, "");

        const match = assetPath.match(
            /^note-app\/avatars\/(\d+)-([a-f0-9-]+)\.webp$/
        );

        if (!match || Number(match[1]) !== userId) {
            return null;
        }

        return assetPath.replace(/\.webp$/, "");

    } catch {
        return null;
    }
}