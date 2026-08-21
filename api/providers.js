import { describeProviders } from "./_providers.js";
import { TOOL_NAMES } from "./_prompts.js";
import { describeServices, searchAvailable } from "./_tools.js";
import { guard } from "./_auth.js";

export default async function handler(req, res) {
    if (!guard(req, res)) return;

    try {
        const info = describeProviders();

        return res.status(200).json({
            success: true,
            ...info,
            tools: TOOL_NAMES,
            services: describeServices(),
            search: searchAvailable(),
            youtube: Boolean(process.env.YOUTUBE_API_KEY),
            councilSize: Number(process.env.AI_COUNCIL_SIZE || 3)
        });
    } catch (error) {
        return res.status(500).json({ error: error?.message || "Status failed." });
    }
}
