
import { defineConfig } from "prisma/config";

import {
    resolveDatabaseConfig
} from "./src/config/database.js";

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

const config = resolveDatabaseConfig();

const databaseUrl = new URL(config.url);

// ==========================================
// CLOUD TLS CONFIGURATION
// ==========================================

if (config.target === "cloud") {
    databaseUrl.searchParams.delete("sslidentity");
    databaseUrl.searchParams.delete("sslpassword");
    databaseUrl.searchParams.delete("sslcert");

    databaseUrl.searchParams.set(
        "sslaccept",
        "strict"
    );

    if (config.caPath) {
        databaseUrl.searchParams.set(
            "sslcert",
            config.caPath
        );
    }
}

// ==========================================
// SAFE DATABASE INFORMATION
// ==========================================

console.log("[DATABASE] Target:", config.target);
console.log("[DATABASE] Host:", config.host);
console.log("[DATABASE] Port:", config.port);
console.log("[DATABASE] Name:", config.database);

// ==========================================
// PRISMA CLI CONFIGURATION
// ==========================================

export default defineConfig({
    schema: "prisma/schema.prisma",

    migrations: {
        path: "prisma/migrations"
    },

    datasource: {
        url: databaseUrl.toString(),

        ...(config.target === "local"
            ? {
                shadowDatabaseUrl:
                    config.shadowDatabaseUrl
            }
            : {})
    }
});
