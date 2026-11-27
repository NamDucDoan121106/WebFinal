
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum([
        "development",
        "production",
        "test"
    ]).default("development"),

    PORT: z.coerce.number()
        .int().min(1).max(65535).default(3000),

    APP_URL: z.string().url(),

    DATABASE_URL: z.string().min(1),

    DB_SSL: z.enum(["true", "false"])
        .default("false"),

    JWT_SECRET: z.string().min(32),

    JWT_EXPIRES_IN: z.literal("7d")
        .default("7d"),

    MAIL_PROVIDER: z.enum([
        "smtp",
        "gmail-api"
    ]).default("smtp")
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error("Invalid environment configuration.");

    for (const issue of result.error.issues) {
        console.error(
            `${issue.path.join(".")}: ${issue.message}`
        );
    }

    process.exit(1);
}

export const env = result.data;

if (env.NODE_ENV === "production") {
    if (!env.APP_URL.startsWith("https://")) {
        throw new Error("Production requires HTTPS.");
    }

    if (env.MAIL_PROVIDER !== "gmail-api") {
        throw new Error(
            "Production on Render requires Gmail API."
        );
    }

    if (env.DB_SSL !== "true") {
        throw new Error(
            "Production database TLS must be configured."
        );
    }
}

export const isProduction =
    env.NODE_ENV === "production";
