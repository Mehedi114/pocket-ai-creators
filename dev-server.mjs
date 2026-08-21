/**
 * Pocket AI — Local Dev Server
 * ----------------------------
 * Vercel ছাড়াই লোকালি পুরো অ্যাপ চালানোর জন্য।
 *
 *   1. cp .env.example .env   (এবং key বসান)
 *   2. npm run dev
 *   3. http://localhost:3000
 *
 * /api/* রিকোয়েস্টগুলো api/ ফোল্ডারের হ্যান্ডলারে পাঠায়,
 * ঠিক যেভাবে Vercel করে।
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

/* ---------- .env লোড (কোনো dependency ছাড়াই) ---------- */
function loadEnv() {
    for (const file of [".env.local", ".env"]) {
        const p = path.join(__dirname, file);
        if (!fs.existsSync(p)) continue;

        for (const line of fs.readFileSync(p, "utf8").split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;

            const eq = trimmed.indexOf("=");
            if (eq === -1) continue;

            const key = trimmed.slice(0, eq).trim();
            let value = trimmed.slice(eq + 1).trim();

            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }

            if (value && process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
    }
}

loadEnv();

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".woff2": "font/woff2"
};

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", c => chunks.push(c));
        req.on("error", reject);
        req.on("end", () => {
            const raw = Buffer.concat(chunks).toString("utf8");
            if (!raw) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch {
                resolve({});
            }
        });
    });
}

/** Vercel-এর res.status().json() API নকল করা */
function decorate(res) {
    res.status = code => {
        res.statusCode = code;
        return res;
    };

    res.json = payload => {
        const body = JSON.stringify(payload);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(body);
        return res;
    };

    res.send = payload => {
        res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
        return res;
    };

    return res;
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    let pathname = decodeURIComponent(url.pathname);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        return res.end();
    }

    /* ---------- API রুট ---------- */
    if (pathname.startsWith("/api/")) {
        const name = pathname.replace("/api/", "").replace(/\/$/, "");
        const file = path.join(__dirname, "api", `${name}.js`);

        if (name.startsWith("_") || !fs.existsSync(file)) {
            decorate(res).status(404).json({ error: `Unknown API route: /api/${name}` });
            return;
        }

        try {
            // dev-এ প্রতি রিকোয়েস্টে ফ্রেশ লোড, যাতে edit সাথে সাথে কাজ করে
            const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
            req.body = await readBody(req);
            req.query = Object.fromEntries(url.searchParams);
            await mod.default(req, decorate(res));
        } catch (error) {
            console.error(`[api/${name}]`, error);
            if (!res.writableEnded) {
                decorate(res).status(500).json({ error: error?.message || "Server error" });
            }
        }
        return;
    }

    /* ---------- স্ট্যাটিক ফাইল ---------- */
    if (pathname === "/") pathname = "/index.html";

    const filePath = path.join(__dirname, pathname);

    if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.end("404 Not Found");
    }

    res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, HOST, async () => {
    const { describeProviders } = await import("./api/_providers.js");
    const info = describeProviders();

    console.log(`\n  ✦ Pocket AI চলছে →  http://localhost:${PORT}\n`);
    console.log(`  Active AI providers (${info.activeCount}): ${info.chain.join(" → ") || "কোনোটাই নেই"}`);
    console.log(`  YouTube API key: ${process.env.YOUTUBE_API_KEY ? "আছে ✓" : "নেই ✕"}\n`);

    if (!info.activeCount) {
        console.log("  ⚠  .env ফাইলে অন্তত একটি API key বসান (.env.example দেখুন)\n");
    }
});
