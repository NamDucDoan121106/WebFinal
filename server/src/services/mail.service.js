
import "dotenv/config";
import nodemailer from "nodemailer";

// Validate required environment variables
const requiredVariables = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS"
];

for (const variable of requiredVariables) {
    if (!process.env[variable]) {
        throw new Error(
            `Missing email configuration: ${variable}`
        );
    }
}

// Create SMTP transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,

    port: Number(process.env.SMTP_PORT),

    secure: process.env.SMTP_SECURE === "true",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000
});

// Verify SMTP connection
export async function verifyMailConnection() {
    await transporter.verify();

    return true;
}

// Generic email sending service
export async function sendEmail({
    to,
    subject,
    text,
    html
}) {
    if (!to || !subject || (!text && !html)) {
        throw new Error("Invalid email information.");
    }

    const result = await transporter.sendMail({
        from: {
            name: process.env.MAIL_FROM_NAME || "Note App",
            address: process.env.MAIL_FROM
                || process.env.SMTP_USER
        },

        to,
        subject,
        text,
        html
    });

    if (!result.accepted?.length || result.rejected?.length) {
        throw new Error("Email recipient was rejected.");
    }

    return {
        success: true,
        messageId: result.messageId
    };
}
