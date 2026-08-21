import { callAI } from "./_providers.js";
import { transcribeAudio, fetchAudio, toSrt } from "./_tools.js";
import { guard } from "./_auth.js";

/**
 * অডিও/ভিডিও → টেক্সট (Groq Whisper v3 Turbo, ফ্রি)
 * তারপর AI দিয়ে সারসংক্ষেপ, চ্যাপ্টার, ব্লগ, সোশ্যাল পোস্ট।
 *
 * ইনপুট:
 *   { url: "https://.../audio.mp3" }          — সরাসরি ফাইল লিংক
 *   { base64: "...", filename: "clip.m4a" }   — ব্রাউজার থেকে আপলোড
 */
export default async function handler(req, res) {
    if (!guard(req, res)) return;

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { url, base64, filename, language, analyze = true } = req.body || {};

        let buffer;
        let name = filename || "audio.mp3";

        if (base64) {
            const payload = String(base64).replace(/^data:[^;]+;base64,/, "");
            buffer = Buffer.from(payload, "base64");
        } else if (url) {
            buffer = await fetchAudio(String(url).trim());
            name = decodeURIComponent(String(url).split("/").pop().split("?")[0]) || name;
        } else {
            return res.status(400).json({
                error: "একটি অডিও ফাইল আপলোড করুন অথবা সরাসরি ফাইলের লিংক দিন।"
            });
        }

        if (!buffer?.byteLength) {
            return res.status(400).json({ error: "অডিও ফাইলটি খালি।" });
        }

        const transcript = await transcribeAudio(buffer, { filename: name, language });

        if (!transcript.text) {
            return res.status(422).json({ error: "অডিওতে কোনো কথা পাওয়া যায়নি।" });
        }

        const payload = {
            success: true,
            filename: name,
            language: transcript.language,
            duration: transcript.duration,
            words: transcript.text.split(/\s+/).length,
            transcript: transcript.text,
            srt: transcript.segments.length ? toSrt(transcript.segments) : null,
            provider: "Groq Whisper v3 Turbo"
        };

        if (!analyze) return res.status(200).json(payload);

        const outcome = await callAI({
            system:
                "You are Pocket AI for Creators. Work only from the transcript given. " +
                "Reply in the same language as the transcript (Bangla stays Bangla).",
            prompt: `
নিচে একটি ভিডিও/অডিওর ট্রান্সক্রিপ্ট দেওয়া হলো।

--- ট্রান্সক্রিপ্ট ---
${transcript.text.slice(0, 18000)}
--- শেষ ---

এই কনটেন্ট থেকে বানাও:

1. এক লাইনের সারমর্ম
2. মূল পয়েন্টগুলো (bullet)
3. টাইমস্ট্যাম্প চ্যাপ্টার (আনুমানিক, 0:00 দিয়ে শুরু)
4. ৫টি YouTube টাইটেল অপশন
5. একটি SEO ডেসক্রিপশন
6. ২০টি ট্যাগ
7. ৩টি Shorts/Reels ক্লিপের আইডিয়া — কোন অংশটা কাটবে ও কেন
8. একটি ফেসবুক পোস্ট
9. একটি ব্লগ আর্টিকেলের আউটলাইন

ট্রান্সক্রিপ্টের বাইরের কিছু বানাবে না।
`,
            temperature: 0.7,
            maxTokens: 3500
        });

        payload.analysis = outcome.text;
        payload.engine = {
            provider: outcome.provider,
            providerLabel: outcome.providerLabel,
            model: outcome.model,
            attempts: outcome.attempts || null
        };

        return res.status(200).json(payload);
    } catch (error) {
        console.error("Transcribe API Error:", error);
        return res.status(error?.status || 500).json({
            error: error?.message || "ট্রান্সক্রিপশন ব্যর্থ হয়েছে।"
        });
    }
}
