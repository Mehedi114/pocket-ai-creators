import { callAI } from "./_providers.js";
import { guard } from "./_auth.js";
import { readUrl, webSearch } from "./_tools.js";
import {
    DIAGRAM_KINDS,
    renderMermaid,
    renderChart,
    parseJsonLoose
} from "./_diagrams.js";

/**
 * Visual Research — রিসার্চ করে ফলাফল ডায়াগ্রাম + চার্ট ছবি হিসেবে দেয়।
 *
 * ইনপুট:
 *   { topic }                       → শুধু AI-এর জ্ঞান থেকে
 *   { topic, research: true }       → আগে লাইভ ওয়েব সার্চ, তারপর ডায়াগ্রাম
 *   { topic, url: "https://..." }   → ওই পেজ পড়ে ডায়াগ্রাম
 *   { kinds: ["mindmap","timeline"] } → কোন কোন ডায়াগ্রাম চান
 */

const DEFAULT_KINDS = ["mindmap", "flowchart", "quadrant"];

export default async function handler(req, res) {
    if (!guard(req, res)) return;

    if (req.method === "GET") {
        return res.status(200).json({
            kinds: Object.entries(DIAGRAM_KINDS).map(([id, k]) => ({
                id,
                label: k.label,
                hint: k.hint
            }))
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const {
            topic,
            url,
            research = false,
            kinds = DEFAULT_KINDS,
            charts = true
        } = req.body || {};

        if (!topic || !String(topic).trim()) {
            return res.status(400).json({ error: "Name the subject you want diagrammed." });
        }

        const subject = String(topic).trim();

        /* ---------- ১. তথ্য জোগাড় ---------- */

        let context = "";
        const sources = [];
        let gathered = "AI-এর নিজস্ব জ্ঞান";

        if (url) {
            const page = await readUrl(String(url).trim(), { maxChars: 16000 });
            context = `পেজ: ${page.title}\nURL: ${page.url}\n\n${page.content}`;
            sources.push({ title: page.title, url: page.url });
            gathered = "Jina Reader";
        } else if (research) {
            try {
                const found = await webSearch(subject, { maxResults: 6 });
                context = found.results
                    .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
                    .join("\n\n");
                found.results.forEach(r => sources.push({ title: r.title, url: r.url }));
                gathered = found.engine;
            } catch (error) {
                // সার্চ ফেল করলেও ডায়াগ্রাম বানানো থামবে না
                gathered = `search failed (${error.message}) — AI-এর জ্ঞান থেকে`;
            }
        }

        /* ---------- ২. AI-কে কাঠামোবদ্ধ JSON চাওয়া ---------- */

        const wanted = (Array.isArray(kinds) ? kinds : DEFAULT_KINDS)
            .filter(k => DIAGRAM_KINDS[k])
            .slice(0, 4);

        const chosen = wanted.length ? wanted : DEFAULT_KINDS;

        const syntaxGuide = chosen
            .map(k => `### ${k} (${DIAGRAM_KINDS[k].label})\n${DIAGRAM_KINDS[k].syntax}`)
            .join("\n\n");

        const prompt = `
Subject: ${subject}

${context ? `--- RESEARCH MATERIAL ---\n${context}\n--- END ---\n` : ""}

Build a visual research pack for this subject.

Return ONLY a JSON object in exactly this shape. No explanation, no markdown fences.

{
  "title": "short title",
  "summary": "the core of it in 3-4 sentences",
  "insights": ["key point 1", "key point 2", "key point 3", "key point 4", "key point 5"],
  "diagrams": [
    { "kind": "${chosen[0]}", "caption": "what this diagram shows", "code": "mermaid code" }
  ],
  "charts": [
    { "type": "bar", "title": "chart title", "labels": ["a","b","c"],
      "datasets": [{ "label": "series name", "data": [10, 20, 30] }],
      "note": "where these numbers came from" }
  ]
}

Produce exactly these ${chosen.length} diagram kinds: ${chosen.join(", ")}

Mermaid syntax to follow precisely:

${syntaxGuide}

Strict rules:
- The mermaid code must be valid, or no image can be rendered.
- Never use ( ) [ ] { } : ; , or " inside node labels.
- Maximum five words per node label.
- In mindmaps, indent exactly two spaces per level. Never use tabs.
- Keep each diagram to 8-15 nodes, or it becomes unreadable.
- Write the labels in the same language as the subject. If the subject is
  in Bangla, write natural Bangla labels.
${charts
                ? `- Include 1-2 charts ONLY when real numbers are present.
- Never invent statistics. If the research material has no numbers, return "charts": [].
- Chart type may be: bar, line, pie, doughnut, radar`
                : `- Return "charts": [].`}
- No trailing commas anywhere in the JSON.
- Escape newlines inside mermaid code as \\n.

Return the JSON only.
`;

        const outcome = await callAI({
            system:
                "You output ONLY valid JSON. No prose, no markdown fences. " +
                "You are an expert at writing valid Mermaid diagram syntax. " +
                "Never invent statistics.",
            prompt,
            temperature: 0.6,
            maxTokens: 3000
        });

        const parsed = parseJsonLoose(outcome.text);

        if (!parsed) {
            return res.status(502).json({
                error: "The model didn't return valid diagram data. Try again, or simplify the subject.",
                raw: outcome.text.slice(0, 600)
            });
        }

        /* ---------- ৩. কোড → আসল ছবি ---------- */

        const diagrams = (Array.isArray(parsed.diagrams) ? parsed.diagrams : [])
            .map(d => {
                const rendered = renderMermaid(d.code);
                if (!rendered) return null;

                return {
                    kind: d.kind || "diagram",
                    label: DIAGRAM_KINDS[d.kind]?.label || "Diagram",
                    caption: d.caption || "",
                    ...rendered
                };
            })
            .filter(Boolean);

        const chartImages = (charts && Array.isArray(parsed.charts) ? parsed.charts : [])
            .map(c => {
                const rendered = renderChart(c);
                return rendered ? { ...rendered, note: c.note || "" } : null;
            })
            .filter(Boolean);

        if (!diagrams.length && !chartImages.length) {
            return res.status(502).json({
                error: "The diagram couldn't be rendered. Please try again.",
                raw: outcome.text.slice(0, 600)
            });
        }

        return res.status(200).json({
            success: true,
            title: parsed.title || subject,
            summary: parsed.summary || "",
            insights: Array.isArray(parsed.insights) ? parsed.insights : [],
            diagrams,
            charts: chartImages,
            sources,
            gathered,
            renderers: {
                diagram: "mermaid.ink",
                chart: chartImages.length ? "quickchart.io" : null
            },
            engine: {
                provider: outcome.provider,
                providerLabel: outcome.providerLabel,
                model: outcome.model,
                attempts: outcome.attempts || null
            }
        });
    } catch (error) {
        console.error("Diagram API Error:", error);
        return res.status(error?.status || 500).json({
            error: error?.message || "The diagram couldn't be created."
        });
    }
}
