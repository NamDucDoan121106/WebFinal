
import "dotenv/config";

import {
    verifyMailConnection,
    sendEmail
} from "../src/services/mail.service.js";

async function main() {
    console.log("==============================");
    console.log("NOTE APP - EMAIL SERVICE TEST");
    console.log("==============================");

    try {
        console.log("[1/2] Checking SMTP connection...");

        await verifyMailConnection();

        console.log("[PASS] SMTP connection successful.");

        console.log("[2/2] Sending test email...");

        const result = await sendEmail({
            to: process.env.SMTP_USER,

            subject: "Note App - Email Service Test",

            text: "Your Note App email service is working.",

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 500px;
                    margin: auto;
                    padding: 24px;
                    border: 1px solid #dddddd;
                    border-radius: 12px;
                ">
                    <h2 style="color: #2563eb;">
                        Note App
                    </h2>

                    <p>Email service test successful.</p>

                    <p>
                        Your application is now able to
                        send emails using Gmail SMTP.
                    </p>

                    <hr>

                    <p style="color: #666666;">
                        Web Programming & Applications
                        - Final Project
                    </p>
                </div>
            `
        });

        console.log("[PASS] Email accepted by SMTP.");

        console.log("Message ID:", result.messageId);

        console.log("==============================");
        console.log("FINAL STATUS: PASS");
        console.log("==============================");

    } catch (error) {
        console.error("[FAIL] Email service error.");

        console.error("Error code:", error.code || "UNKNOWN");
        console.error("Message:", error.message);

        process.exitCode = 1;
    }
}

main();
