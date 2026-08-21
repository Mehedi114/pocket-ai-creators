/**
 * Pocket AI — Diagram & Chart Rendering
 * -------------------------------------
 * AI যে ডায়াগ্রাম কোড লেখে সেটাকে আসল ছবিতে বদলায় — কোনো key ছাড়া।
 *
 *   Mermaid  → mermaid.ink   (মাইন্ড ম্যাপ, ফ্লোচার্ট, টাইমলাইন...)
 *   Chart.js → quickchart.io (বার, পাই, লাইন, রাডার চার্ট)
 *
 * mermaid.live-এর মতো pako এনকোডিং ব্যবহার করা হয়েছে, যেটা Node-এর
 * বিল্ট-ইন zlib দিয়েই হয় — কোনো npm dependency লাগে না।
 */

import zlib from "node:zlib";

const b64url = buf =>
    buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/* ======================================================
   MERMAID
   ====================================================== */

export const DIAGRAM_KINDS = {
    mindmap: {
        label: "Mind Map",
        hint: "একটা বিষয়ের সব শাখা-প্রশাখা এক নজরে",
        syntax: `mindmap
  root(("মূল বিষয়"))
    শাখা এক
      উপশাখা
      উপশাখা
    শাখা দুই
      উপশাখা`
    },
    flowchart: {
        label: "Flowchart",
        hint: "ধাপে ধাপে প্রসেস বা ওয়ার্কফ্লো",
        syntax: `flowchart TD
    A["শুরু"] --> B["ধাপ এক"]
    B --> C{"সিদ্ধান্ত"}
    C -->|হ্যাঁ| D["ফলাফল ১"]
    C -->|না| E["ফলাফল ২"]`
    },
    timeline: {
        label: "Timeline",
        hint: "সময় ধরে ঘটনা বা পরিকল্পনা",
        syntax: `timeline
    title শিরোনাম
    সপ্তাহ ১ : কাজ এক : কাজ দুই
    সপ্তাহ ২ : কাজ তিন`
    },
    journey: {
        label: "Audience Journey",
        hint: "দর্শক কীভাবে আপনাকে খুঁজে পায় ও ফ্যান হয়",
        syntax: `journey
    title দর্শকের যাত্রা
    section আবিষ্কার
      থাম্বনেইল দেখা: 3: দর্শক
      ক্লিক করা: 4: দর্শক
    section আস্থা
      পুরো ভিডিও দেখা: 5: দর্শক`
    },
    quadrant: {
        label: "Opportunity Matrix",
        hint: "কোন আইডিয়ায় সবচেয়ে বেশি লাভ",
        syntax: `quadrantChart
    title সুযোগের মানচিত্র
    x-axis "কম প্রতিযোগিতা" --> "বেশি প্রতিযোগিতা"
    y-axis "কম চাহিদা" --> "বেশি চাহিদা"
    quadrant-1 "সোনার খনি"
    quadrant-2 "কঠিন লড়াই"
    quadrant-3 "এড়িয়ে চলুন"
    quadrant-4 "সহজ জয়"
    "আইডিয়া এক": [0.3, 0.8]
    "আইডিয়া দুই": [0.7, 0.6]`
    },
    pie: {
        label: "Breakdown",
        hint: "কোন অংশ কতটুকু",
        syntax: `pie showData
    title কনটেন্ট মিক্স
    "টিউটোরিয়াল" : 40
    "ভ্লগ" : 30
    "রিভিউ" : 30`
    }
};

/**
 * AI-এর লেখা mermaid কোডে সবচেয়ে কমন ভুলগুলো ঠিক করা,
 * যাতে রেন্ডার ফেল না করে।
 */
export function sanitizeMermaid(raw) {
    let code = String(raw || "")
        .replace(/^```(?:mermaid)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .replace(/\r/g, "")
        .trim();

    const lines = code.split("\n");
    const header = (lines[0] || "").trim().toLowerCase();

    // flowchart/graph এর node label-এ বন্ধনী বা কোলন থাকলে mermaid ভাঙে —
    // label গুলো কোট করে দিই
    if (header.startsWith("flowchart") || header.startsWith("graph")) {
        code = lines
            .map((line, i) => {
                if (i === 0) return line;
                return line
                    .replace(/\[([^\]"]+)\]/g, (m, label) => `["${label.replace(/"/g, "'")}"]`)
                    .replace(/\{([^}"]+)\}/g, (m, label) => `{"${label.replace(/"/g, "'")}"}`)
                    .replace(/\(\(([^)"]+)\)\)/g, (m, label) => `(("${label.replace(/"/g, "'")}"))`);
            })
            .join("\n");
    }

    // mindmap-এ ট্যাব থাকলে সমস্যা হয়
    if (header.startsWith("mindmap")) {
        code = code.replace(/\t/g, "  ");
    }

    return code.trim();
}

/** mermaid.live / mermaid.ink এর pako ফরম্যাট */
function pakoEncode(code, theme = "dark") {
    const state = {
        code,
        mermaid: JSON.stringify({ theme }),
        autoSync: true,
        updateDiagram: true
    };

    const deflated = zlib.deflateSync(Buffer.from(JSON.stringify(state), "utf8"), {
        level: 9
    });

    return `pako:${b64url(deflated)}`;
}

export function renderMermaid(rawCode, { theme = "dark", bgColor = "0d0f12" } = {}) {
    const code = sanitizeMermaid(rawCode);

    if (!code) return null;

    const pako = pakoEncode(code, theme);
    const plain = b64url(Buffer.from(code, "utf8"));
    const query = `?bgColor=${encodeURIComponent(bgColor)}&theme=${theme}`;

    return {
        code,
        // প্রধান ছবি (SVG — পরিষ্কার, যেকোনো সাইজে ঝকঝকে)
        svgUrl: `https://mermaid.ink/svg/${pako}${query}`,
        // ডাউনলোডের জন্য PNG
        pngUrl: `https://mermaid.ink/img/${pako}${query}&type=png`,
        // বিকল্প এনকোডিং (কোনো কারণে pako কাজ না করলে)
        altUrl: `https://mermaid.ink/svg/${plain}${query}`,
        // ইউজার নিজে এডিট করতে পারবে
        editUrl: `https://mermaid.live/edit#${pako}`
    };
}

/* ======================================================
   CHART.JS → QuickChart
   ====================================================== */

const PALETTE = [
    "#c8ff3d", "#7c9cff", "#ff9f43", "#ff6f91",
    "#48d9ff", "#a8e52b", "#b98cff", "#ffd93d"
];

export function renderChart(spec, { width = 900, height = 500 } = {}) {
    if (!spec || !spec.type || !Array.isArray(spec.labels)) return null;

    const datasets = (Array.isArray(spec.datasets) ? spec.datasets : [])
        .filter(d => Array.isArray(d.data) && d.data.length)
        .map((d, i) => ({
            label: d.label || `Series ${i + 1}`,
            data: d.data.map(Number),
            backgroundColor: spec.type === "pie" || spec.type === "doughnut"
                ? PALETTE
                : PALETTE[i % PALETTE.length],
            borderColor: PALETTE[i % PALETTE.length],
            borderWidth: spec.type === "line" ? 3 : 0,
            fill: false,
            tension: 0.35
        }));

    if (!datasets.length) return null;

    const isCircular = spec.type === "pie" || spec.type === "doughnut";

    const config = {
        type: spec.type,
        data: { labels: spec.labels, datasets },
        options: {
            plugins: {
                title: {
                    display: Boolean(spec.title),
                    text: spec.title || "",
                    color: "#e6e8eb",
                    font: { size: 18, weight: "bold" }
                },
                legend: {
                    display: isCircular || datasets.length > 1,
                    labels: { color: "#9aa1ab" }
                },
                datalabels: { display: false }
            },
            scales: isCircular ? {} : {
                x: {
                    ticks: { color: "#8d949e" },
                    grid: { color: "rgba(255,255,255,.06)" }
                },
                y: {
                    ticks: { color: "#8d949e" },
                    grid: { color: "rgba(255,255,255,.06)" },
                    beginAtZero: true
                }
            }
        }
    };

    const params = new URLSearchParams({
        c: JSON.stringify(config),
        w: String(width),
        h: String(height),
        bkg: "#0d0f12",
        devicePixelRatio: "2",
        v: "4"
    });

    return {
        title: spec.title || "",
        type: spec.type,
        url: `https://quickchart.io/chart?${params}`,
        config
    };
}

/* ======================================================
   AI-এর JSON আউটপুট নিরাপদে পার্স করা
   ====================================================== */

export function parseJsonLoose(text) {
    let clean = String(text || "").trim();

    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

    try {
        return JSON.parse(clean);
    } catch {
        // মডেল আগে-পরে কথা বললে শুধু JSON অংশটা বের করি
        const start = clean.indexOf("{");
        const end = clean.lastIndexOf("}");

        if (start !== -1 && end > start) {
            try {
                return JSON.parse(clean.slice(start, end + 1));
            } catch {
                /* নিচে গিয়ে null */
            }
        }
    }

    return null;
}
