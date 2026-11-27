import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Load environment variables
dotenv.config({
  path: path.resolve(process.cwd(), "../.env"),
  quiet: true,
});

// Database configuration
const host = process.env.DB_HOST || "127.0.0.1";
const port = process.env.DB_PORT || "3307";

const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;

const shadowDatabase = "note_app_shadow";

// Validate environment variables
if (!user || !password || !database) {
  throw new Error("Missing MySQL configuration in .env");
}

// Prevent accidental use of the main database as shadow
if (database === shadowDatabase) {
  throw new Error("Main and shadow databases must be different.");
}

// Create database connection URL
const baseUrl =
  `mysql://${encodeURIComponent(user)}` +
  `:${encodeURIComponent(password)}` +
  `@${host}:${port}`;

// Main database
const databaseUrl =
  `${baseUrl}/${encodeURIComponent(database)}`;

// Shadow database
const shadowDatabaseUrl =
  `${baseUrl}/${encodeURIComponent(shadowDatabase)}`;

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: databaseUrl,
    shadowDatabaseUrl: shadowDatabaseUrl,
  },
});