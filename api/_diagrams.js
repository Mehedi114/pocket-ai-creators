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
        hint: "Every branch of a subject, at a glance",
        syntax: `mindmap
  root(("Main subject"))
    Branch one
      Sub point
      Sub point
    Branch two
      Sub point`
    },
    flowchart: {
        label: "Flowchart",
        hint: "A process or workflow, step by step",
        syntax: `flowchart TD
    A["Start"] --> B["First step"]
    B --> C{"Decision"}
    C -->|Yes| D["Outcome one"]
    C -->|No| E["Outcome two"]`
    },
    timeline: {
        label: "Timeline",
        hint: "Events or plans laid out over time",
        syntax: `timeline
    title Plan title
    Week 1 : Task one : Task two
    Week 2 : Task three`
    },
    journey: {
        label: "Audience Journey",
        hint: "How a viewer finds you and becomes a fan",
        syntax: `journey
    title Viewer journey
    section Discovery
      Sees the thumbnail: 3: Viewer
      Clicks through: 4: Viewer
    section Trust
      Watches to the end: 5: Viewer`
    },
    quadrant: {
        label: "Opportunity Matrix",
        hint: "Which ideas are actually worth the effort",
        syntax: `quadrantChart
    title Opportunity map
    x-axis "Low competition" --> "High competition"
    y-axis "Low demand" --> "High demand"
    quadrant-1 "Gold mine"
    quadrant-2 "Hard fight"
    quadrant-3 "Skip these"
    quadrant-4 "Easy wins"
    "Idea one": [0.3, 0.8]
    "Idea two": [0.7, 0.6]`
    },
    pie: {
        label: "Breakdown",
        hint: "How the whole divides up",
        syntax: `pie showData
    title Content mix
    "Tutorials" : 40
    "Vlogs" : 30
    "Reviews" : 30`
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
function pakoEncode(code, theme = "default") {
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

export function renderMermaid(rawCode, { theme = "default", bgColor = "!white" } = {}) {
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
