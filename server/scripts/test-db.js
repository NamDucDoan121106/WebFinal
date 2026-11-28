import { prisma } from "../src/config/prisma.js";

async function main() {
    try {
        console.log("Connecting to MySQL...");

        await prisma.$connect();

        const result =
            await prisma.$queryRaw`SELECT 1 AS connected`;

        console.log("Connection:", result);

        const count = await prisma.user.count();

        console.log("Total users:", count);

        console.log("FINAL STATUS: PASS");

    } catch (error) {
        console.error("DATABASE TEST FAILED");
        console.error(error.message);

        process.exitCode = 1;

    } finally {
        await prisma.$disconnect();
    }
}

main();