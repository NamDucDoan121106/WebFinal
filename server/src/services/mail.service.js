
import "dotenv/config";
import nodemailer from "nodemailer";
import { google } from "googleapis";

function requireVariables(names) {
    for (const name of names) {
        if (!process.env[name]) {
            throw new Error(
                `Missing mail configuration: ${name}`
            );
        }
    }
}

function getProvider() {
    return process.env.MAIL_PROVIDER || "smtp";
}

let smtpTransport;

function getSmtpTransport() {
    requireVariables([
        "SMTP_USER",
        "SMTP_PASS"
    ]);

    if (!smtpTransport) {
        smtpTransport = nodemailer.createTransport({
            host: process.env.SMTP_HOST
                || "smtp.gmail.com",

            port: Number(
                process.env.SMTP_PORT || 465
            ),

            secure:
                process.env.SMTP_SECURE !== "false",

            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },

            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 20000
        });
    }

    return smtpTransport;
}

function getOAuthClient() {
    requireVariables([
        "GMAIL_CLIENT_ID",
        "GMAIL_CLIENT_SECRET",
        "GMAIL_REFRESH_TOKEN"
    ]);

    const oauth = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );

    oauth.setCredentials({
        refresh_token:
            process.env.GMAIL_REFRESH_TOKEN
    });

    return oauth;
}

export async function verifyMailConnection() {
    if (getProvider() === "smtp") {
        await getSmtpTransport().verify();
    } else if (getProvider() === "gmail-api") {
        const oauth = getOAuthClient();

        const result = await oauth.getAccessToken();

        if (!result.token) {
            throw new Error(
                "Unable to obtain Gmail access token."
            );
        }
    } else {
        throw new Error("Unknown mail provider.");
    }

    return true;
}

export async function sendEmail({
    to,
    subject,
    text,
    html
}) {
    if (!to || !subject || (!text && !html)) {
        throw new Error("Invalid email information.");
    }

    const sender = process.env.MAIL_FROM
        || process.env.SMTP_USER;

    if (!sender) {
        throw new Error("Missing sender address.");
    }

    const message = {
        from: {
            name: process.env.MAIL_FROM_NAME
                || "Note App",
            address: sender
        },

        to,
        subject,
        text,
        html
    };

    // LOCAL: Gmail SMTP
    if (getProvider() === "smtp") {
        const result =
            await getSmtpTransport().sendMail(message);

        if (
            !result.accepted?.length ||
            result.rejected?.length
        ) {
            throw new Error("Email recipient rejected.");
        }

        return {
            success: true,
            messageId: result.messageId
        };
    }

    // PRODUCTION: Gmail HTTPS API
    if (getProvider() === "gmail-api") {
        const oauth = getOAuthClient();

        const gmail = google.gmail({
            version: "v1",
            auth: oauth
        });

        const composer = nodemailer.createTransport({
            streamTransport: true,
            buffer: true,
            newline: "windows"
        });

        const mime = await composer.sendMail(message);

        const raw = mime.message.toString("base64url");

        const result = await gmail.users.messages.send({
            userId: "me",

            requestBody: {
                raw
            }
        }, {
            timeout: 15000
        });

        return {
            success: true,
            messageId: result.data.id
        };
    }

    throw new Error("Unsupported email provider.");
}
