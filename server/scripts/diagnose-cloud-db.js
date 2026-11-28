import mariadb from "mariadb";
import { resolveDatabaseConfig } from "../src/config/database.js";

let connection;

async function main() {
  console.log("================================");
  console.log("WEBFINAL CLOUD DATABASE TEST");
  console.log("================================");

  try {
    const config = resolveDatabaseConfig();

    console.log("Target:", config.target);
    console.log("Host:", config.host);
    console.log("Port:", config.port);
    console.log("Database:", config.database);
    console.log("TLS:", Boolean(config.ssl));
    console.log("Custom CA:", Boolean(config.caPath));

    if (config.target !== "cloud") {
      throw new Error("Expected cloud database configuration.");
    }

    console.log("\n[1/4] Connecting directly to MySQL...");

    connection = await mariadb.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,

      ssl: config.ssl,

      allowPublicKeyRetrieval: false,

      connectTimeout: 15000,
      socketTimeout: 15000,
    });

    console.log("[PASS] MySQL connected.");

    console.log("\n[2/4] Checking database...");

    const info = await connection.query(`
      SELECT
        DATABASE() AS database_name,
        VERSION() AS mysql_version
    `);

    console.table(info);

    console.log("\n[3/4] Checking TLS encryption...");

    const cipher = await connection.query(
      "SHOW SESSION STATUS LIKE 'Ssl_cipher'",
    );

    const version = await connection.query(
      "SHOW SESSION STATUS LIKE 'Ssl_version'",
    );

    console.table(cipher);
    console.table(version);

    if (!cipher[0]?.Value) {
      throw new Error("Database connection is not encrypted.");
    }

    console.log("[PASS] TLS encryption active.");

    console.log("\n[4/4] Checking database tables...");

    const tables = await connection.query("SHOW TABLES");

    console.table(tables);

    console.log("Total tables:", tables.length);

    console.log("\nFINAL STATUS: PASS");
  } catch (error) {
    console.error("\n[FAIL] Database connection");

    let current = error;
    let depth = 0;

    while (current && depth < 5) {
      console.error("Error level:", depth);
      console.error("Code:", current.code || "N/A");
      console.error("Errno:", current.errno || "N/A");
      console.error("SQL State:", current.sqlState || "N/A");
      console.error("Message:", current.message);

      current = current.cause;
      depth++;
    }

    console.error("\nFINAL STATUS: FAIL");

    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
