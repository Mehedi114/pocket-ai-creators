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
                error: "Upload an audio file, or paste a direct link to one."
            });
        }

        if (!buffer?.byteLength) {
            return res.status(400).json({ error: "That audio file is empty." });
        }

        const transcript = await transcribeAudio(buffer, { filename: name, language });

        if (!transcript.text) {
            return res.status(422).json({ error: "No speech was found in that audio." });
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
                "Reply in the same language as the transcript.",
            prompt: `
Below is the transcript of a video or audio recording.

--- TRANSCRIPT ---
${transcript.text.slice(0, 18000)}
--- END ---

From this content, produce:

1. A one-line summary
2. The key points, as bullets
3. Timestamped chapters (approximate, starting at 0:00)
4. Five YouTube title options
5. An SEO description
6. Twenty tags
7. Three Shorts or Reels clip ideas — which section to cut, and why
8. A Facebook post
9. An outline for a blog article

Invent nothing that is not in the transcript.
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
            error: error?.message || "Transcription failed."
        });
    }
}
