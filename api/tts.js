import { textToSpeech, VOICES } from "./_tools.js";

/**
 * AI ভয়েসওভার — টেক্সট থেকে কথা।
 * Pollinations TTS, key ছাড়াই চলে। সরাসরি mp3 ফেরত দেয়।
 */
export default async function handler(req, res) {
    if (req.method === "GET") {
        return res.status(200).json({ voices: VOICES });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { text, voice = "nova", format = "binary" } = req.body || {};

        const audio = await textToSpeech(text, { voice });

        if (format === "base64") {
            return res.status(200).json({
                success: true,
                voice,
                contentType: audio.contentType,
                base64: audio.buffer.toString("base64"),
                provider: "Pollinations TTS"
            });
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", audio.contentType);
        res.setHeader("Content-Length", String(audio.buffer.byteLength));
        res.setHeader("Content-Disposition", 'inline; filename="voiceover.mp3"');
        res.setHeader("Cache-Control", "no-store");
        return res.end(audio.buffer);
    } catch (error) {
        console.error("TTS API Error:", error);
        return res.status(error?.status || 500).json({
            error: error?.message || "ভয়েস তৈরি ব্যর্থ হয়েছে।"
        });
    }
}
