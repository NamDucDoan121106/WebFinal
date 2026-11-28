import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import { PrismaMariaDb }
    from "@prisma/adapter-mariadb";

import { PrismaClient }
    from "../generated/prisma/client.ts";

import { env } from "./env.js";

const url = new URL(env.DATABASE_URL);

if (url.protocol !== "mysql:") {
    throw new Error("Expected a MySQL database URL.");
}

// Load database configuration from root .env
const dbEnv = dotenv.parse(
    readFileSync(
        new URL("../../../.env", import.meta.url)
    )
);

// Validate database configuration
const requiredDbVariables = [
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "MYSQL_DATABASE"
];

for (const key of requiredDbVariables) {
    if (!dbEnv[key]?.trim()) {
        throw new Error(
            `Missing database configuration: ${key}`
        );
    }
}

// Initialize Prisma MariaDB Adapter
const adapter = new PrismaMariaDb({
    host: "127.0.0.1",
    port: 3307,

    user: dbEnv.MYSQL_USER,
    password: dbEnv.MYSQL_PASSWORD,
    database: dbEnv.MYSQL_DATABASE,

    allowPublicKeyRetrieval: true,
    
    connectionLimit: 5,
    connectTimeout: 10000,
    acquireTimeout: 15000
});

export const prisma = new PrismaClient({
    adapter,

    log: ["warn", "error"]
});
