import { callAI, callAICouncil } from "./_providers.js";

const SYSTEM = `You are Pocket AI — a personal AI assistant built for a content creator.
You help with YouTube strategy, scripts, SEO, marketing copy, research and general questions.
Be direct, practical and specific. Skip filler and disclaimers.
If the user writes in Bangla, reply in natural Bangla.`;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { messages, mode, provider, system } = req.body || {};

        if (!Array.isArray(messages) || !messages.length) {
            return res.status(400).json({ error: "messages array প্রয়োজন।" });
        }

        // শেষ ২০টা টার্ন রাখি, যাতে context window না ভাঙে
        const history = messages
            .filter(m => m && typeof m.content === "string" && m.content.trim())
            .slice(-20)
            .map(m => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content
            }));

        const full = [
            { role: "system", content: system || SYSTEM },
            ...history
        ];

        let outcome;

        if (mode === "power") {
            const lastUser = [...history].reverse().find(m => m.role === "user");
            outcome = await callAICouncil({
                system: system || SYSTEM,
                prompt: lastUser?.content || "",
                temperature: 0.7,
                maxTokens: 2048
            });
        } else {
            outcome = await callAI({
                messages: full,
                temperature: 0.7,
                maxTokens: 2048,
                preferred: provider || undefined
            });
        }

        return res.status(200).json({
            success: true,
            reply: outcome.text,
            engine: {
                provider: outcome.provider,
                providerLabel: outcome.providerLabel,
                model: outcome.model,
                mode: outcome.mode || "single",
                panel: outcome.panel || null
            }
        });
    } catch (error) {
        console.error("Chat API Error:", error);

        return res.status(error?.status || 500).json({
            error: error?.message || "Chat ব্যর্থ হয়েছে।",
            attempts: error?.attempts || null
        });
    }
}
