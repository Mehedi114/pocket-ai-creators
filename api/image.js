import { callAI } from "./_providers.js";
import { buildImageUrl, IMAGE_PRESETS } from "./_tools.js";

/**
 * থাম্বনেইল / ইমেজ জেনারেটর
 * ইউজারের বাংলা বা এলোমেলো আইডিয়া → AI দিয়ে প্রফেশনাল image prompt →
 * Pollinations Flux দিয়ে ৪টা ভ্যারিয়েশন।
 */
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { idea, preset = "thumbnail", count = 4, raw = false, text } = req.body || {};

        if (!idea || !String(idea).trim()) {
            return res.status(400).json({ error: "আপনার আইডিয়া লিখুন।" });
        }

        const size = IMAGE_PRESETS[preset] || IMAGE_PRESETS.thumbnail;
        const n = Math.max(1, Math.min(Number(count) || 4, 6));

        let imagePrompt = String(idea).trim();
        let engine = null;

        // AI দিয়ে প্রম্পট উন্নত করা (raw=true দিলে সরাসরি ইউজারের লেখা যাবে)
        if (!raw) {
            const outcome = await callAI({
                system:
                    "You write image-generation prompts for a diffusion model. " +
                    "Output ONLY the prompt in English — no explanation, no quotes, no preamble.",
                prompt: `
Turn this creator's idea into ONE powerful image prompt for a ${size.label}.

Idea (may be in Bangla): ${idea}

Requirements:
- English only.
- Describe subject, expression, composition, lighting, colour palette, mood, camera lens.
- High contrast, bold, eye-catching — it must work as a scroll-stopping thumbnail.
- Photorealistic unless the idea clearly asks for illustration.
- Leave clear negative space on one side for text overlay.
- No text, no letters, no words inside the image.
- Maximum 70 words.

Return only the prompt.
`,
                temperature: 0.9,
                maxTokens: 300
            });

            imagePrompt = outcome.text
                .replace(/^["'`]+|["'`]+$/g, "")
                .replace(/^(prompt|image prompt)\s*:\s*/i, "")
                .trim();

            engine = {
                provider: outcome.provider,
                providerLabel: outcome.providerLabel,
                model: outcome.model
            };
        }

        const images = Array.from({ length: n }, (_, i) => ({
            seed: Math.floor(Math.random() * 1_000_000),
            width: size.width,
            height: size.height
        })).map(cfg => ({
            ...cfg,
            url: buildImageUrl(imagePrompt, cfg)
        }));

        return res.status(200).json({
            success: true,
            prompt: imagePrompt,
            preset,
            size: { width: size.width, height: size.height, label: size.label },
            overlayText: text || null,
            images,
            engine,
            provider: "Pollinations (Flux)"
        });
    } catch (error) {
        console.error("Image API Error:", error);
        return res.status(error?.status || 500).json({
            error: error?.message || "ইমেজ তৈরি ব্যর্থ হয়েছে।"
        });
    }
}
