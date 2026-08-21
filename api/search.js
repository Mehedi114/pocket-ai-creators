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
            return res.status(400).json({ error: "Tell it what to search for." });
        }

        const search = await webSearch(String(query).trim());

        const sources = search.results
            .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
            .join("\n\n");

        const intents = {
            answer: "Answer the question directly and accurately.",
            trend: "Explain what is trending on this right now, which angles are hot, and how a creator could move in quickly.",
            research: "Write a detailed research note — the core facts, differing views, numbers, and where the content opportunities are.",
            news: "Lay out recent developments in chronological order, each with its date."
        };

        const outcome = await callAI({
            system:
                "You are Pocket AI, a research assistant. Answer ONLY from the supplied search results. " +
                "Cite sources inline as [1], [2]. If the results do not answer the question, say so plainly. " +
                "Never invent facts, dates or numbers. Reply in the same language the user asked in.",
            prompt: `
Today's date: ${new Date().toISOString().slice(0, 10)}

The user is looking for: ${query}

${search.answer ? `Search engine summary:\n${search.answer}\n` : ""}
--- SEARCH RESULTS ---
${sources}
--- END ---

${intents[intent] || intents.answer}

Finish with a "Sources" heading listing the links you used.
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
            error: error?.message || "The search failed.",
            detail: error?.detail || null
        });
    }
}
