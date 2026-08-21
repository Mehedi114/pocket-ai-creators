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
            return res.status(400).json({ error: "কী নিয়ে ডায়াগ্রাম চান লিখুন।" });
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
                gathered = `সার্চ ব্যর্থ (${error.message}) — AI-এর জ্ঞান থেকে`;
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
বিষয়: ${subject}

${context ? `--- রিসার্চ তথ্য ---\n${context}\n--- শেষ ---\n` : ""}

এই বিষয়টি নিয়ে একটি ভিজ্যুয়াল রিসার্চ প্যাক বানাও।

শুধুমাত্র নিচের কাঠামোয় একটি JSON অবজেক্ট ফেরত দাও। কোনো ব্যাখ্যা, কোনো markdown fence নয়।

{
  "title": "সংক্ষিপ্ত শিরোনাম",
  "summary": "৩-৪ বাক্যে মূল কথা",
  "insights": ["গুরুত্বপূর্ণ পয়েন্ট ১", "পয়েন্ট ২", "পয়েন্ট ৩", "পয়েন্ট ৪", "পয়েন্ট ৫"],
  "diagrams": [
    { "kind": "${chosen[0]}", "caption": "এই ডায়াগ্রাম কী দেখাচ্ছে", "code": "মারমেইড কোড" }
  ],
  "charts": [
    { "type": "bar", "title": "চার্টের শিরোনাম", "labels": ["ক","খ","গ"],
      "datasets": [{ "label": "সিরিজের নাম", "data": [10, 20, 30] }],
      "note": "সংখ্যাগুলো কোথা থেকে এলো" }
  ]
}

ডায়াগ্রাম বানাও ঠিক এই ${chosen.length}টি ধরনের: ${chosen.join(", ")}

মারমেইড সিনট্যাক্স (হুবহু এই ধরন মেনে চলো):

${syntaxGuide}

কঠোর নিয়ম:
- মারমেইড কোড অবশ্যই বৈধ হতে হবে, নাহলে ছবি তৈরি হবে না।
- node-এর লেখায় বন্ধনী ( ) [ ] { } কোলন : সেমিকোলন ; কমা , বা কোট " ব্যবহার করবে না।
- প্রতিটি node-এর লেখা সর্বোচ্চ ৫ শব্দ।
- mindmap-এ প্রতি স্তরে ঠিক ২ স্পেস করে ইনডেন্ট, ট্যাব নয়।
- ডায়াগ্রামে ৮-১৫টি node রাখো — বেশি হলে পড়া যায় না।
- বাংলা লেখা ব্যবহার করো (বিষয়টি ইংরেজি হলে ইংরেজি)।
${charts
                ? `- charts অ্যারেতে ১-২টি চার্ট দাও শুধু তখনই যখন সত্যিকারের সংখ্যা আছে।
- সংখ্যা বানাবে না। রিসার্চ তথ্যে সংখ্যা না থাকলে charts খালি অ্যারে [] রাখো।
- চার্টের type হতে পারে: bar, line, pie, doughnut, radar`
                : `- "charts" খালি অ্যারে [] রাখো।`}
- JSON-এ কোনো ট্রেইলিং কমা রাখবে না।
- মারমেইড কোডে নতুন লাইন \\n দিয়ে লেখো।

শুধু JSON দাও।
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
                error: "AI বৈধ ডায়াগ্রাম ডেটা দেয়নি। আবার চেষ্টা করুন অথবা বিষয়টি একটু সহজ করে লিখুন।",
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
                error: "ডায়াগ্রাম রেন্ডার করা যায়নি। আবার চেষ্টা করুন।",
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
            error: error?.message || "ডায়াগ্রাম তৈরি ব্যর্থ হয়েছে।"
        });
    }
}
