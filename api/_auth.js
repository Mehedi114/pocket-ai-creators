/**
 * Pocket AI — Access Gate
 * -----------------------
 * ফেসবুকে পোস্ট করা কোড দিয়ে ঢোকার ব্যবস্থা।
 *
 *   ACCESS_CODES=POCKET2026,FBTEST     → গেট চালু, এই কোডগুলো কাজ করবে
 *   (variable মুছে ফেললে)              → গেট বন্ধ, শুধু URL জানলেই ঢোকা যাবে
 *
 * কোনো ডেটাবেস লাগে না — টোকেন HMAC দিয়ে সই করা, তাই সার্ভার
 * নিজেই যাচাই করতে পারে। টোকেন জাল করা যায় না।
 */

import crypto from "node:crypto";

const TTL_DAYS = Number(process.env.ACCESS_TTL_DAYS || 14);

const b64url = buf =>
    Buffer.from(buf).toString("base64")
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const unb64url = str =>
    Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");

/** এই ডিপ্লয়মেন্টে গেট চালু আছে কি না */
export function gateEnabled() {
    return getCodes().length > 0;
}

function getCodes() {
    return (process.env.ACCESS_CODES || process.env.ACCESS_CODE || "")
        .split(",")
        .map(c => c.trim())
        .filter(Boolean);
}

function secret() {
    // আলাদা SESSION_SECRET দিলে ভালো, না দিলে কোড থেকেই তৈরি হয়
    return process.env.SESSION_SECRET ||
        crypto.createHash("sha256").update(getCodes().join("|") + "|pocket-ai").digest("hex");
}

function sign(payload) {
    return b64url(
        crypto.createHmac("sha256", secret()).update(payload).digest()
    );
}

/** টাইমিং অ্যাটাক ঠেকাতে ধ্রুব-সময়ের তুলনা */
function safeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

export function matchCode(input) {
    const clean = String(input || "").trim();
    if (!clean) return null;

    // বড়/ছোট হাতের অক্ষর আলাদা ধরা হবে না — ফেসবুকে কপি করতে সুবিধা
    for (const code of getCodes()) {
        if (safeEqual(clean.toUpperCase(), code.toUpperCase())) return code;
    }

    return null;
}

export function issueToken(code) {
    const payload = JSON.stringify({
        c: crypto.createHash("sha256").update(code).digest("hex").slice(0, 16),
        exp: Date.now() + TTL_DAYS * 86400000
    });

    const body = b64url(payload);

    return `${body}.${sign(body)}`;
}

export function verifyToken(token) {
    if (!token || typeof token !== "string") return false;

    const [body, sig] = token.split(".");
    if (!body || !sig) return false;

    if (!safeEqual(sig, sign(body))) return false;

    try {
        const payload = JSON.parse(unb64url(body).toString("utf8"));

        if (!payload.exp || Date.now() > payload.exp) return false;

        // কোড বদলে ফেললে পুরোনো টোকেনগুলো আপনা-আপনি বাতিল হয়ে যায়
        const valid = getCodes().some(
            c => crypto.createHash("sha256").update(c).digest("hex").slice(0, 16) === payload.c
        );

        return valid;
    } catch {
        return false;
    }
}

function readToken(req) {
    const header = req.headers?.["x-access-token"];
    if (header) return Array.isArray(header) ? header[0] : header;

    const cookie = req.headers?.cookie || "";
    const match = /(?:^|;\s*)pocket_access=([^;]+)/.exec(cookie);

    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * প্রতিটি API endpoint-এর শুরুতে ডাকুন।
 * অনুমতি থাকলে true, নাহলে 401 পাঠিয়ে false ফেরত দেয়।
 */
export function guard(req, res) {
    if (!gateEnabled()) return true;

    if (verifyToken(readToken(req))) return true;

    res.status(401).json({
        error: "অ্যাক্সেস কোড লাগবে।",
        code: "ACCESS_REQUIRED"
    });

    return false;
}

/* ---------- ব্রুট-ফোর্স ঠেকানো (প্রতি ইনস্ট্যান্সে) ---------- */

const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRIES = 8;

export function clientKey(req) {
    const fwd = req.headers?.["x-forwarded-for"];
    const ip = Array.isArray(fwd) ? fwd[0] : (fwd || "").split(",")[0].trim();
    return ip || req.socket?.remoteAddress || "unknown";
}

export function tooManyAttempts(key) {
    const record = attempts.get(key);
    if (!record) return false;

    if (Date.now() - record.first > WINDOW_MS) {
        attempts.delete(key);
        return false;
    }

    return record.count >= MAX_TRIES;
}

export function noteFailure(key) {
    const record = attempts.get(key);

    if (!record || Date.now() - record.first > WINDOW_MS) {
        attempts.set(key, { count: 1, first: Date.now() });
        return;
    }

    record.count += 1;
}

export function clearAttempts(key) {
    attempts.delete(key);
}

export const ACCESS_TTL_DAYS = TTL_DAYS;
