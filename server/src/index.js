import app from "./app.js";

import { prisma } from "./config/prisma.js";

import { env } from "./config/env.js";

async function startServer() {
    try {
        await prisma.$connect();

        await prisma.$queryRaw`SELECT 1`;

        console.log("[PASS] MySQL connected.");

        const server = app.listen(
            env.PORT,
            "0.0.0.0",
            () => {
                console.log(
                    `[PASS] Server running on port ${env.PORT}`
                );

                console.log(
                    `Environment: ${env.NODE_ENV}`
                );
            }
        );

        function shutdown() {
            server.close(async () => {
                await prisma.$disconnect();

                process.exit(0);
            });

            setTimeout(
                () => process.exit(1),
                10000
            ).unref();
        }

        process.once("SIGINT", shutdown);
        process.once("SIGTERM", shutdown);

    } catch (error) {
        console.error("[FAIL] Server startup failed.");

        console.error(error.message);

        await prisma.$disconnect();

        process.exit(1);
    }
}

startServer();