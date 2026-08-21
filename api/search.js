import { callAI } from "./_providers.js";
import { webSearch } from "./_tools.js";
import { guard } from "./_auth.js";

/**
 * লাইভ ওয়েব সার্চ + AI উত্তর।
 * LLM-এর training cutoff এর সমস্যা এড়িয়ে আজকের তথ্য দিয়ে উত্তর দেয় —
 * ট্রেন্ড, নিউজ, দাম, নতুন টুল সব যাচাই করা যাবে।
 */
export default async function handler(req, res) {
    if (!guard(req, res)) return;

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { query, intent = "answer" } = req.body || {};

        if (!query || !String(query).trim()) {
            return res.status(400).json({ error: "কী খুঁজতে চান লিখুন।" });
        }

        const search = await webSearch(String(query).trim());

        const sources = search.results
            .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
            .join("\n\n");

        const intents = {
            answer: "প্রশ্নের সরাসরি, নির্ভুল উত্তর দাও।",
            trend: "এই বিষয়ে এখন কী ট্রেন্ড করছে, কোন অ্যাঙ্গেলগুলো গরম, এবং একজন ক্রিয়েটর কীভাবে দ্রুত ঢুকতে পারে তা বলো।",
            research: "একটি বিস্তারিত রিসার্চ নোট লেখো — মূল তথ্য, বিভিন্ন মত, সংখ্যা, এবং কনটেন্টে ব্যবহারের সুযোগ।",
            news: "সাম্প্রতিক ঘটনাগুলো সময়ক্রম অনুযায়ী সাজিয়ে বলো, প্রতিটির তারিখসহ।"
        };

        const outcome = await callAI({
            system:
                "You are Pocket AI, a research assistant. Answer ONLY from the supplied search results. " +
                "Cite sources inline as [1], [2]. If the results do not answer the question, say so plainly. " +
                "Never invent facts, dates or numbers. Reply in natural Bangla.",
            prompt: `
আজকের তারিখ: ${new Date().toISOString().slice(0, 10)}

ব্যবহারকারীর অনুসন্ধান: ${query}

${search.answer ? `সার্চ ইঞ্জিনের সারসংক্ষেপ:\n${search.answer}\n` : ""}
--- সার্চ রেজাল্ট ---
${sources}
--- শেষ ---

${intents[intent] || intents.answer}

শেষে "সূত্র" শিরোনামে ব্যবহৃত লিংকগুলো তালিকা করো।
`,
            temperature: 0.5,
            maxTokens: 2500
        });

        return res.status(200).json({
            success: true,
            query,
            intent,
            result: outcome.text,
            sources: search.results.map(r => ({ title: r.title, url: r.url })),
            searchEngine: search.engine,
            engine: {
                provider: outcome.provider,
                providerLabel: outcome.providerLabel,
                model: outcome.model,
                attempts: outcome.attempts || null
            }
        });
    } catch (error) {
        console.error("Search API Error:", error);
        return res.status(error?.status || 500).json({
            error: error?.message || "সার্চ ব্যর্থ হয়েছে।",
            detail: error?.detail || null
        });
    }
}
