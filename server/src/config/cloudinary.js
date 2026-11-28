import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

export function getCloudinary() {
    if (!process.env.CLOUDINARY_URL) {
        throw new Error(
            "Missing CLOUDINARY_URL configuration."
        );
    }

    cloudinary.config({
        secure: true
    });

    return cloudinary;
}