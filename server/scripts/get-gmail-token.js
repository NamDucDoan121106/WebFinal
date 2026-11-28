
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import dotenv from "dotenv";

// ==========================================
// CONFIGURATION
// ==========================================

const envPath = new URL("../.env", import.meta.url);

const config = dotenv.parse(
    fs.readFileSync(envPath)
);

const CLIENT_ID = config.GMAIL_CLIENT_ID?.trim();

const CLIENT_SECRET =
    config.GMAIL_CLIENT_SECRET?.trim();

const REDIRECT_URI =
    "http://127.0.0.1:53682";

const SCOPE =
    "https://www.googleapis.com/auth/gmail.send";

const HOST = "127.0.0.1";
const PORT = 53682;

// ==========================================
// VALIDATE CREDENTIALS
// ==========================================

if (
    !CLIENT_ID ||
    !CLIENT_ID.endsWith(".apps.googleusercontent.com") ||
    !CLIENT_SECRET ||
    CLIENT_SECRET.startsWith("YOUR_")
) {
    console.error(
        "[FAIL] Check GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env"
    );

    process.exit(1);
}

// ==========================================
// OAUTH SECURITY: STATE + PKCE
// ==========================================

const state = crypto.randomBytes(32)
    .toString("hex");

const codeVerifier = crypto.randomBytes(48)
    .toString("base64url");

const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

// ==========================================
// GENERATE AUTHORIZATION URL
// ==========================================

const authUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth"
);

authUrl.search = new URLSearchParams({
    client_id: CLIENT_ID,

    redirect_uri: REDIRECT_URI,

    response_type: "code",

    scope: SCOPE,

    access_type: "offline",

    prompt: "consent",

    state,

    code_challenge: codeChallenge,

    code_challenge_method: "S256"
}).toString();

// ==========================================
// SAVE REFRESH TOKEN
// ==========================================

function saveRefreshToken(token) {
    let content = fs.readFileSync(
        envPath,
        "utf8"
    );

    // Remove previous declarations to avoid duplicates.
    content = content.replace(
        /^[ \t]*(?:export[ \t]+)?(?:GMAIL_REFRESH_TOKEN|MAIL_PROVIDER)[ \t]*=.*(?:\r?\n|$)/gm,
        ""
    );

    content = content.trimEnd();

    content +=
        "\n\n# Gmail API configuration\n" +
        "MAIL_PROVIDER=gmail-api\n" +
        `GMAIL_REFRESH_TOKEN=${token}\n`;

    fs.writeFileSync(
        envPath,
        content,
        {
            encoding: "utf8",
            mode: 0o600
        }
    );
}

// ==========================================
// LOCAL OAUTH CALLBACK SERVER
// ==========================================

let processing = false;

const server = http.createServer(
    async (req, res) => {
        const url = new URL(
            req.url,
            `http://${HOST}:${PORT}`
        );

        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        res.setHeader(
            "Referrer-Policy",
            "no-referrer"
        );

        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8"
        );

        if (url.pathname !== "/") {
            res.writeHead(404);
            res.end("Not found.");
            return;
        }

        if (
            url.searchParams.get("state") !== state
        ) {
            res.writeHead(400);
            res.end("Invalid OAuth state.");
            return;
        }

        if (processing) {
            res.writeHead(409);
            res.end("Request already processed.");
            return;
        }

        processing = true;

        try {
            const oauthError =
                url.searchParams.get("error");

            if (oauthError) {
                console.error(
                    "Authorization error:",
                    oauthError
                );

                throw new Error(
                    "Google authorization failed."
                );
            }

            const code =
                url.searchParams.get("code");

            if (!code) {
                throw new Error(
                    "Authorization code not received."
                );
            }

            console.log(
                "[PASS] Authorization code received."
            );

            console.log(
                "[INFO] Exchanging code for tokens..."
            );

            const response = await fetch(
                "https://oauth2.googleapis.com/token",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: new URLSearchParams({
                        client_id: CLIENT_ID,

                        client_secret: CLIENT_SECRET,

                        code,

                        code_verifier: codeVerifier,

                        redirect_uri: REDIRECT_URI,

                        grant_type: "authorization_code"
                    }),

                    signal:
                        AbortSignal.timeout(20000)
                }
            );

            const data = await response.json();

            console.log(
                "HTTP Status:",
                response.status
            );

            if (!response.ok) {
                console.error(
                    "OAuth Error:",
                    data.error
                );

                console.error(
                    "Description:",
                    data.error_description
                );

                throw new Error(
                    "Token exchange failed."
                );
            }

            if (!data.refresh_token) {
                throw new Error(
                    "Google did not return a refresh token."
                );
            }

            console.log(
                "[PASS] Access token received."
            );

            console.log(
                "[PASS] Refresh token received."
            );

            saveRefreshToken(
                data.refresh_token
            );

            console.log(
                "[PASS] Refresh token saved to server/.env."
            );

            console.log(
                "FINAL STATUS: PASS"
            );

            res.writeHead(200);

            res.end(
                "SUCCESS! Gmail refresh token saved. " +
                "You can close this browser tab."
            );

        } catch (error) {
            console.error(
                "[FAIL]",
                error.message
            );

            console.error(
                "FINAL STATUS: FAIL"
            );

            process.exitCode = 1;

            res.writeHead(400);

            res.end(
                "OAuth failed. Check the PowerShell output."
            );

        } finally {
            server.close();
        }
    }
);

// ==========================================
// START SERVER
// ==========================================

server.on("error", (error) => {
    console.error(
        "[FAIL] Callback server:",
        error.code || error.name
    );

    process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
    console.log("================================");
    console.log("WEBFINAL GMAIL TOKEN GENERATOR");
    console.log("================================");

    console.log("Client ID:", CLIENT_ID);

    console.log(
        "Client Secret configured:",
        Boolean(CLIENT_SECRET)
    );

    console.log(
        "Callback:",
        REDIRECT_URI
    );

    console.log(
        "\nOpen the following URL in your browser:\n"
    );

    console.log(authUrl.toString());

    console.log(
        "\nAuthorize Gmail access to continue."
    );
});

server.setTimeout(30000);
