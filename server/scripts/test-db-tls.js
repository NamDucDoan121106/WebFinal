
let prisma;

try {
    console.log("================================");
    console.log("WEBFINAL CLOUD DATABASE TLS TEST");
    console.log("================================");

    const module = await import(
        "../src/config/prisma.js"
    );

    prisma = module.prisma;

    const info = module.databaseInfo;

    console.log("\n--- Configuration ---");
    console.log(info);

    if (info.target !== "cloud") {
        throw new Error(
            "Expected cloud database, but local mode is active."
        );
    }

    if (!info.tlsEnabled) {
        throw new Error(
            "Cloud database TLS is disabled."
        );
    }

    console.log("[PASS] Cloud target validated.");

    await prisma.$connect();

    // Execute checks using the same connection.

    const result = await prisma.$transaction(
        async (tx) => {
            const database = await tx.$queryRaw`
                SELECT
                    DATABASE() AS database_name,
                    VERSION() AS mysql_version,
                    @@hostname AS server_hostname
            `;

            const cipher = await tx.$queryRaw`
                SHOW SESSION STATUS LIKE 'Ssl_cipher'
            `;

            const tlsVersion = await tx.$queryRaw`
                SHOW SESSION STATUS LIKE 'Ssl_version'
            `;

            return {
                database,
                cipher,
                tlsVersion
            };
        }
    );

    console.log("\n--- Database ---");
    console.log(result.database);

    console.log("\n--- TLS ---");
    console.log(result.cipher);
    console.log(result.tlsVersion);

    if (
        result.database[0]?.database_name !==
        info.database
    ) {
        throw new Error(
            "Connected to an unexpected database."
        );
    }

    if (!result.cipher[0]?.Value) {
        throw new Error(
            "Database connection is not encrypted."
        );
    }

    console.log("\n[PASS] Cloud database connection.");
    console.log("[PASS] Database identity matched.");
    console.log("[PASS] TLS encryption active.");
    console.log("[PASS] SQL query successful.");

    console.log("================================");
    console.log("FINAL STATUS: PASS");
    console.log("================================");

} catch (error) {
    console.error("\n[FAIL] Cloud database test.");
    console.error(
        "Error code:",
        error.code || error.name
    );

    let message = String(
        error.message || "Unknown error"
    );

    try {
        const url = new URL(
            process.env.DATABASE_URL
        );

        for (const secret of [
            url.password,
            decodeURIComponent(url.password),
            process.env.DATABASE_URL
        ]) {
            if (secret) {
                message = message
                    .split(secret)
                    .join("[REDACTED]");
            }
        }
    } catch {
        // No external database URL available.
    }

    console.error("Message:", message);
    console.error("FINAL STATUS: FAIL");

    process.exitCode = 1;

} finally {
    if (prisma) {
        await prisma.$disconnect();
    }
}
