import { textToSpeech, VOICES } from "./_tools.js";
import { guard } from "./_auth.js";

/**
 * AI ভয়েসওভার — টেক্সট থেকে কথা।
 * Pollinations TTS, key ছাড়াই চলে। সরাসরি mp3 ফেরত দেয়।
 */
export default async function handler(req, res) {
    if (!guard(req, res)) return;

    if (req.method === "GET") {
        return res.status(200).json({
            voices: VOICES.map(v => ({ id: v.id, label: v.label }))
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { text, voice = "auto", format = "binary" } = req.body || {};

        const audio = await textToSpeech(text, { voice });

        if (format === "base64") {
            return res.status(200).json({
                success: true,
                voice,
                lang: audio.lang,
                contentType: audio.contentType,
                base64: audio.buffer.toString("base64"),
                provider: audio.engine
            });
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", audio.contentType);
        res.setHeader("Content-Length", String(audio.buffer.byteLength));
        res.setHeader("X-Voice-Engine", audio.engine);
        res.setHeader("X-Voice-Lang", audio.lang || "");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="voiceover.${audio.contentType.includes("wav") ? "wav" : "mp3"}"`
        );
        res.setHeader("Cache-Control", "no-store");
        return res.end(audio.buffer);
    } catch (error) {
        console.error("TTS API Error:", error);
        return res.status(error?.status || 500).json({
            error: error?.message || "The voice couldn't be created."
        });
    }
}
