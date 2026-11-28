
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================

dotenv.config({
    path: fileURLToPath(
        new URL("../.env", import.meta.url)
    ),
    quiet: true
});

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

const host = process.env.DB_HOST || "127.0.0.1";
const port = process.env.DB_PORT || "3307";

const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;

const shadowDatabase =
    process.env.MYSQL_SHADOW_DATABASE ||
    "note_app_shadow";

// ==========================================
// CONFIGURATION VALIDATION
// ==========================================

if (!user || !password || !database) {
    throw new Error(
        "Missing MySQL configuration in root .env"
    );
}

const portNumber = Number(port);

if (
    !Number.isInteger(portNumber) ||
    portNumber < 1 ||
    portNumber > 65535
) {
    throw new Error("Invalid database port.");
}

if (database === shadowDatabase) {
    throw new Error(
        "Main and shadow databases must be different."
    );
}

// ==========================================
// DATABASE CONNECTION URLS
// ==========================================

const baseUrl =
    `mysql://${encodeURIComponent(user)}` +
    `:${encodeURIComponent(password)}` +
    `@${host}:${port}`;

const databaseUrl =
    `${baseUrl}/${encodeURIComponent(database)}`;

const shadowDatabaseUrl =
    `${baseUrl}/${encodeURIComponent(shadowDatabase)}`;

// ==========================================
// PRISMA CONFIGURATION
// ==========================================

export default defineConfig({
    schema: "prisma/schema.prisma",

    migrations: {
        path: "prisma/migrations"
    },

    datasource: {
        url: databaseUrl,
        shadowDatabaseUrl: shadowDatabaseUrl
    }
});
