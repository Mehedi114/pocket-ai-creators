import { callAI } from "./_providers.js";
import { readUrl } from "./_tools.js";
import { guard } from "./_auth.js";

/**
 * যেকোনো URL পড়ে বিশ্লেষণ — ব্লগ, নিউজ, প্রতিযোগীর পেজ, প্রোডাক্ট পেজ, PDF।
 * YouTube Research এর মতো, কিন্তু গোটা ইন্টারনেটের জন্য।
 */

const MODES = {
    summary: {
        label: "Summary",
        instruction: `
Give a clean summary:
1. The core point in one line
2. Five to eight key points
3. Any important numbers or data
4. Who wrote this, for whom, and why
5. What is missing or weakly argued`
    },
    content: {
        label: "Content Ideas",
        instruction: `
Read this as a content creator would:
1. Ten video or post ideas that could come from it
2. A hook for each one
3. Which angle is the least covered
4. Which facts here can be used on camera directly
5. What needs independent verification first`
    },
    competitor: {
        label: "Competitor Teardown",
        instruction: `
Take this apart as a competitor:
1. What they offer and who they are speaking to
2. Their positioning and core message
3. Where they are strong
4. Where they are weak, and what they leave uncovered
5. Five concrete ways to differentiate from them
6. Three things worth learning from their copywriting`
    },
    rewrite: {
        label: "Rewrite for me",
        instruction: `
Rewrite this content in the creator's own voice:
1. An original, natural article or script — rewritten, never copied
2. A YouTube script version
3. A social post version
Keep the facts intact, but every sentence and structure must be your own.`
    },
    facts: {
        label: "Fact Extract",
        instruction: `
Extract only what is verifiable:
1. Every number, date and statistic, with its source
2. Direct quotes
3. Names and organisations
4. Claims made without evidence
Invent nothing. If something is not on the page, write "not on the page".`
    }
};

export default async function handler(req, res) {
    if (!guard(req, res)) return;

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { url, mode = "summary", question } = req.body || {};

        if (!url || !String(url).trim()) {
            return res.status(400).json({ error: "Please provide a URL." });
        }

        const page = await readUrl(String(url).trim());

        if (!page.content || page.content.length < 120) {
            return res.status(422).json({
                error: "Not enough text on that page — it may require a login, or be all video and images."
            });
        }

        const selected = MODES[mode] || MODES.summary;

        const task = question
            ? `The reader asks: ${question}\n\nAnswer using only what is on the page.`
            : selected.instruction;

        const outcome = await callAI({
            system:
                "You are Pocket AI, a sharp research analyst for content creators. " +
                "Only use the supplied page content. Never invent facts. " +
                "Reply in the same language as the page content.",
            prompt: `
Page: ${page.title}
URL: ${page.url}
${page.truncated ? "(Note: the page is long — this is the opening section)\n" : ""}
--- PAGE CONTENT ---
${page.content}
--- END ---

${task}
`,
            temperature: 0.6,
            maxTokens: 3000
        });

        return res.status(200).json({
            success: true,
            page: {
                url: page.url,
                title: page.title,
                chars: page.chars,
                truncated: page.truncated
            },
            mode,
            modeLabel: selected.label,
            result: outcome.text,
            engine: {
                provider: outcome.provider,
                providerLabel: outcome.providerLabel,
                model: outcome.model,
                attempts: outcome.attempts || null
            },
            reader: "Jina Reader"
        });
    } catch (error) {
        console.error("Read API Error:", error);
        return res.status(error?.status || 500).json({
            error: error?.message || "Couldn't read that page."
        });
    }
}
