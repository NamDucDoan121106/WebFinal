import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Load environment variables from the project root
dotenv.config({
  path: path.resolve(process.cwd(), "../.env"),
  quiet: true,
});

const host = process.env.DB_HOST || "127.0.0.1";
const port = process.env.DB_PORT || "3307";

const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;

// Validate required environment variables
if (!user || !password || !database) {
  throw new Error(
    "Missing MYSQL_USER, MYSQL_PASSWORD or MYSQL_DATABASE in root .env"
  );
}

// Build MySQL connection URL
const databaseUrl =
  `mysql://${encodeURIComponent(user)}` +
  `:${encodeURIComponent(password)}` +
  `@${host}:${port}/${encodeURIComponent(database)}`;

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: databaseUrl,
  },
});