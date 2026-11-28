
import {
    PrismaMariaDb
} from "@prisma/adapter-mariadb";

import {
    PrismaClient
} from "../generated/prisma/client.ts";

import {
    resolveDatabaseConfig
} from "./database.js";

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

const config = resolveDatabaseConfig();

// Safe diagnostics: never print credentials.

export const databaseInfo = Object.freeze({
    target: config.target,
    host: config.host,
    port: config.port,
    database: config.database,
    tlsEnabled: Boolean(config.ssl),
    customCA: Boolean(config.caPath)
});

// ==========================================
// PRISMA DRIVER ADAPTER
// ==========================================

const adapter = new PrismaMariaDb({
    host: config.host,
    port: config.port,

    user: config.user,
    password: config.password,
    database: config.database,

    ssl: config.ssl,

    allowPublicKeyRetrieval:
        config.allowPublicKeyRetrieval,

    connectionLimit:
        config.connectionLimit,

    connectTimeout: 15000,
    acquireTimeout: 20000
});

// ==========================================
// PRISMA CLIENT
// ==========================================

export const prisma = new PrismaClient({
    adapter,
    log: ["warn", "error"]
});

console.log("[DATABASE] Target:", databaseInfo.target);
console.log("[DATABASE] Host:", databaseInfo.host);
console.log("[DATABASE] Port:", databaseInfo.port);
console.log("[DATABASE] Name:", databaseInfo.database);
console.log("[DATABASE] TLS:", databaseInfo.tlsEnabled);
console.log("[DATABASE] Custom CA:", databaseInfo.customCA);
