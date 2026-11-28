
import "dotenv/config";

import {
    verifyMailConnection,
    sendEmail
} from "../src/services/mail.service.js";

const provider =
    process.env.MAIL_PROVIDER || "smtp";

const recipient =
    process.env.MAIL_TEST_TO ||
    process.env.MAIL_FROM ||
    process.env.SMTP_USER;

// ==========================================
// CONFIGURATION VALIDATION
// ==========================================

function validateConfiguration() {
    if (!["smtp", "gmail-api"].includes(provider)) {
        throw new Error("Unsupported mail provider.");
    }

    const requiredVariables =
        provider === "gmail-api"
            ? [
                "GMAIL_CLIENT_ID",
                "GMAIL_CLIENT_SECRET",
                "GMAIL_REFRESH_TOKEN"
            ]
            : [
                "SMTP_USER",
                "SMTP_PASS"
            ];

    for (const key of requiredVariables) {
        const configured = Boolean(
            process.env[key]?.trim()
        );

        console.log(
            `${key}: ${configured ? "CONFIGURED" : "MISSING"}`
        );

        if (!configured) {
            throw new Error(
                `Missing environment variable: ${key}`
            );
        }
    }

    if (!recipient) {
        throw new Error(
            "Missing test recipient."
        );
    }

    if (
        !process.env.MAIL_FROM &&
        !process.env.SMTP_USER
    ) {
        throw new Error(
            "Missing sender address."
        );
    }
}

// ==========================================
// EMAIL SERVICE TEST
// ==========================================

async function main() {
    console.log("================================");
    console.log("WEBFINAL EMAIL SERVICE TEST");
    console.log("================================");

    try {
        console.log("\nProvider:", provider);
        console.log("Recipient:", recipient);

        console.log("\n[1/4] Checking configuration...");

        validateConfiguration();

        console.log("[PASS] Configuration valid.");

        console.log("\n[2/4] Checking connection...");

        await verifyMailConnection();

        console.log(
            "[PASS] Provider authentication successful."
        );

        console.log("\n[3/4] Sending test email...");

        const result = await sendEmail({
            to: recipient,

            subject: "WebFinal - Email Service Test",

            text: `
WebFinal Email Service Test

Provider: ${provider}

Your application is able to send emails.
            `.trim(),

            html: `
<div style="
    font-family:Arial,sans-serif;
    max-width:520px;
    margin:30px auto;
    padding:28px;
    border:1px solid #dddddd;
    border-radius:12px;
    color:#1e293b;
">
    <h2 style="color:#2563eb;">
        WebFinal - Note App
    </h2>

    <p style="color:#16a34a;font-weight:bold;">
        Email service test successful.
    </p>

    <p>
        Your application is able to send emails.
    </p>

    <table style="width:100%;line-height:1.8;">
        <tr>
            <td>Provider</td>
            <td><strong>${provider}</strong></td>
        </tr>
        <tr>
            <td>Application</td>
            <td>WebFinal</td>
        </tr>
        <tr>
            <td>Time</td>
            <td>${new Date().toISOString()}</td>
        </tr>
    </table>

    <hr style="margin:24px 0;">

    <p style="color:#64748b;font-size:12px;">
        Web Programming & Applications
        - Final Project
    </p>
</div>
            `
        });

        if (!result.success || !result.messageId) {
            throw new Error(
                "Provider did not return a valid message ID."
            );
        }

        console.log(
            "[PASS] Email accepted by provider."
        );

        console.log("\n[4/4] Checking response...");
        console.log("Message ID:", result.messageId);

        console.log("[PASS] Valid message ID.");

        console.log("\n================================");
        console.log("FINAL STATUS: PASS");
        console.log("================================");

    } catch (error) {
        console.error("\n[FAIL] Email service test.");

        console.error(
            "Error code:",
            error.code || error.name || "UNKNOWN"
        );

        console.error(
            "HTTP status:",
            error.response?.status || "N/A"
        );

        const oauthError =
            error.response?.data?.error;

        if (typeof oauthError === "string") {
            console.error(
                "OAuth error:",
                oauthError
            );
        } else {
            console.error(
                "Provider status:",
                oauthError?.status || "N/A"
            );
        }

        // Avoid printing complete API errors because
        // they may include authentication information.

        console.error("FINAL STATUS: FAIL");

        process.exitCode = 1;
    }
}

main();
