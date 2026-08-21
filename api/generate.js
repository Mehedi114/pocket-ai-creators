import { callAI, callAICouncil } from "./_providers.js";
import { SYSTEM_PROMPT, buildPrompt } from "./_prompts.js";
import { guard } from "./_auth.js";

export default async function handler(req, res) {
    if (!guard(req, res)) return;

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { tool, input, mode, provider } = req.body || {};

        if (!input || !String(input).trim()) {
            return res.status(400).json({ error: "Please provide your topic." });
        }

        const prompt = buildPrompt(tool, String(input).trim());

        const options = {
            system: SYSTEM_PROMPT,
            prompt,
            temperature: 0.8,
            maxTokens: 2048
        };

        const outcome = mode === "power"
            ? await callAICouncil(options)
            : await callAI({ ...options, preferred: provider || undefined });

        return res.status(200).json({
            success: true,
            result: outcome.text,
            engine: {
                provider: outcome.provider,
                providerLabel: outcome.providerLabel,
                model: outcome.model,
                mode: outcome.mode || "single",
                panel: outcome.panel || null,
                attempts: outcome.attempts || null
            }
        });
    } catch (error) {
        console.error("Generate API Error:", error);

        return res.status(error?.status || 500).json({
            error: error?.message || "Something went wrong on the server.",
            attempts: error?.attempts || null
        });
    }
}
