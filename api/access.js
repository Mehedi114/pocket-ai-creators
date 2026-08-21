import {
    gateEnabled,
    matchCode,
    issueToken,
    verifyToken,
    clientKey,
    tooManyAttempts,
    noteFailure,
    clearAttempts,
    ACCESS_TTL_DAYS
} from "./_auth.js";

/**
 * GET  /api/access  → গেট চালু আছে কি না, বর্তমান টোকেন বৈধ কি না
 * POST /api/access  → { code } দিয়ে টোকেন নেওয়া
 */
export default async function handler(req, res) {
    if (req.method === "GET") {
        const header = req.headers?.["x-access-token"];
        const token = Array.isArray(header) ? header[0] : header;

        return res.status(200).json({
            required: gateEnabled(),
            valid: gateEnabled() ? verifyToken(token) : true,
            ttlDays: ACCESS_TTL_DAYS
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (!gateEnabled()) {
        return res.status(200).json({ success: true, required: false, token: null });
    }

    const key = clientKey(req);

    if (tooManyAttempts(key)) {
        return res.status(429).json({
            error: "Too many incorrect codes. Try again in 10 minutes."
        });
    }

    const { code } = req.body || {};

    const matched = matchCode(code);

    if (!matched) {
        noteFailure(key);

        // অনুমান করা কঠিন করতে সামান্য দেরি
        await new Promise(r => setTimeout(r, 600));

        return res.status(401).json({ error: "That code isn't right. Check it and try again." });
    }

    clearAttempts(key);

    const token = issueToken(matched);
    const maxAge = ACCESS_TTL_DAYS * 86400;

    res.setHeader(
        "Set-Cookie",
        `pocket_access=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`
    );

    return res.status(200).json({
        success: true,
        token,
        expiresIn: maxAge,
        ttlDays: ACCESS_TTL_DAYS
    });
}
