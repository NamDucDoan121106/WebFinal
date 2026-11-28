import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================

function readEnvFile(file) {
  if (!existsSync(file)) {
    return {};
  }

  return dotenv.parse(readFileSync(file));
}

const serverDirectory = fileURLToPath(new URL("../../", import.meta.url));

const rootEnv = readEnvFile(new URL("../../../.env", import.meta.url));

const serverEnv = readEnvFile(new URL("../../.env", import.meta.url));

// Priority:
// Process environment > Server .env > Root .env

const settings = {
  ...rootEnv,
  ...serverEnv,
  ...process.env,
};

// ==========================================
// VALIDATION HELPERS
// ==========================================

function parseDatabaseUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "Invalid DATABASE_URL. Expected mysql://USER:PASSWORD@HOST:PORT/DATABASE",
    );
  }

  if (
    url.protocol !== "mysql:" ||
    !url.hostname ||
    !url.username ||
    !url.password ||
    url.pathname.length < 2
  ) {
    throw new Error("Incomplete MySQL connection URL.");
  }

  return url;
}

function isLocalHost(host) {
  const normalizedHost = String(host).trim().toLowerCase();

  return ["localhost", "127.0.0.1", "::1", "[::1]", "db"].includes(
    normalizedHost,
  );
}

function validatePort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid MySQL port.");
  }

  return port;
}

// ==========================================
// DATABASE CONFIGURATION
// ==========================================

export function resolveDatabaseConfig() {
  const configuredUrl = settings.DATABASE_URL?.trim();

  const explicitTarget = settings.DB_TARGET?.trim().toLowerCase();

  // Validate database target before resolving URL.

  if (explicitTarget && !["local", "cloud"].includes(explicitTarget)) {
    throw new Error("DB_TARGET must be local or cloud.");
  }

  // Explicit local mode uses MYSQL_* variables.

  const url =
    configuredUrl && explicitTarget !== "local"
      ? parseDatabaseUrl(configuredUrl)
      : null;

  // Explicit DB_TARGET has the highest priority.

  const target =
    explicitTarget || (url && !isLocalHost(url.hostname) ? "cloud" : "local");

  // Prevent insecure production database configuration.

  if (settings.NODE_ENV === "production" && target !== "cloud") {
    throw new Error("Production requires cloud database mode.");
  }

  // ========================================
  // CLOUD DATABASE
  // ========================================

  if (target === "cloud") {
    if (!url || isLocalHost(url.hostname)) {
      throw new Error("Cloud mode requires a remote DATABASE_URL.");
    }

    const caValue = settings.DB_CA_PATH?.trim();

    const caPath = caValue ? resolve(serverDirectory, caValue) : null;

    if (caPath && !existsSync(caPath)) {
      throw new Error("Configured CA certificate does not exist.");
    }

    const ssl = {
      rejectUnauthorized: true,

      minVersion: "TLSv1.2",

      ...(caPath
        ? {
            ca: readFileSync(caPath),
          }
        : {}),
    };

    return {
      target: "cloud",

      host: url.hostname,

      port: validatePort(url.port || 3306),

      user: decodeURIComponent(url.username),

      password: decodeURIComponent(url.password),

      database: decodeURIComponent(url.pathname.slice(1)),

      url: url.toString(),

      ssl,

      caPath,

      connectionLimit: 3,

      allowPublicKeyRetrieval: false,
    };
  }

  // ========================================
  // LOCAL / DOCKER COMPOSE DATABASE
  // ========================================

  const host = (settings.DB_HOST || "127.0.0.1").trim().toLowerCase();

  if (!isLocalHost(host)) {
    throw new Error("Local mode requires a loopback or Docker database host.");
  }

  const defaultPort = host === "db" ? 3306 : 3307;

  const port = validatePort(settings.DB_PORT || defaultPort);

  const user = settings.MYSQL_USER;

  const password = settings.MYSQL_PASSWORD;

  const database = settings.MYSQL_DATABASE;

  const shadowDatabase = settings.MYSQL_SHADOW_DATABASE || "note_app_shadow";

  if (!user || !password || !database) {
    throw new Error("Missing local MySQL configuration.");
  }

  if (database === shadowDatabase) {
    throw new Error("Main and shadow databases must be different.");
  }

  const urlHost = host === "::1" ? "[::1]" : host;

  // Encode credentials to support special characters.

  const baseUrl =
    `mysql://${encodeURIComponent(user)}` +
    `:${encodeURIComponent(password)}` +
    `@${urlHost}:${port}`;

  return {
    target: "local",

    host: host === "[::1]" ? "::1" : host,

    port,

    user,

    password,

    database,

    url: `${baseUrl}/${encodeURIComponent(database)}`,

    shadowDatabaseUrl: `${baseUrl}/${encodeURIComponent(shadowDatabase)}`,

    ssl: false,

    caPath: null,

    connectionLimit: 5,

    allowPublicKeyRetrieval: true,
  };
}
