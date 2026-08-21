import { describeProviders } from "./_providers.js";
import { TOOL_NAMES } from "./_prompts.js";

export default async function handler(req, res) {
    try {
        const info = describeProviders();

        return res.status(200).json({
            success: true,
            ...info,
            tools: TOOL_NAMES,
            youtube: Boolean(process.env.YOUTUBE_API_KEY),
            councilSize: Number(process.env.AI_COUNCIL_SIZE || 3)
        });
    } catch (error) {
        return res.status(500).json({ error: error?.message || "Status failed." });
    }
}
