/**
 * Failover engine test — কোনো ইন্টারনেট ছাড়াই চেইন লজিক যাচাই করে।
 *
 *   node test/engine.test.mjs
 *
 * তিনটা নকল provider দাঁড় করানো হয়:
 *   #1 → সবসময় 429 (rate limit)
 *   #2 → খালি উত্তর দেয়
 *   #3 → ঠিকঠাক উত্তর দেয়
 * ইঞ্জিনের #3 এ পৌঁছানোর কথা।
 */

import http from "node:http";
import assert from "node:assert/strict";

function mock(behaviour) {
    return new Promise(resolve => {
        const server = http.createServer((req, res) => {
            let raw = "";
            req.on("data", c => (raw += c));
            req.on("end", () => {
                res.setHeader("Content-Type", "application/json");

                if (behaviour === "429") {
                    res.statusCode = 429;
                    return res.end(JSON.stringify({ error: { message: "rate limit reached" } }));
                }

                if (behaviour === "empty") {
                    res.statusCode = 200;
                    return res.end(JSON.stringify({ choices: [{ message: { content: "   " } }] }));
                }

                if (behaviour === "hang") {
                    return; // কখনো উত্তর দেয় না → timeout
                }

                const body = JSON.parse(raw || "{}");
                res.statusCode = 200;
                res.end(JSON.stringify({
                    choices: [{ message: { content: `OK from ${behaviour} :: ${body.model}` } }],
                    usage: { total_tokens: 10 }
                }));
            });
        });

        server.listen(0, "127.0.0.1", () => resolve(server));
    });
}

const a = await mock("429");
const b = await mock("empty");
const c = await mock("good");

const url = s => `http://127.0.0.1:${s.address().port}/v1`;

process.env.AI_PROVIDER_ORDER = "groq,cerebras,gemini";
process.env.GROQ_API_KEY = "test";
process.env.CEREBRAS_API_KEY = "test";
process.env.GEMINI_API_KEY = "test";
process.env.GROQ_BASE_URL = url(a);
process.env.CEREBRAS_BASE_URL = url(b);
process.env.GEMINI_BASE_URL = url(c);
process.env.AI_TIMEOUT_MS = "3000";

const { callAI, getActiveProviders, callAICouncil } = await import("../api/_providers.js");

/* ---------- test 1: চেইন তৈরি হচ্ছে কি না ---------- */
const chain = getActiveProviders().map(p => p.id);
assert.deepEqual(chain, ["groq", "cerebras", "gemini"]);
console.log("✓ provider chain:", chain.join(" → "));

/* ---------- test 2: ব্যর্থ প্রোভাইডার পেরিয়ে সফলে পৌঁছায় ---------- */
const out = await callAI({ prompt: "hello", system: "sys" });
assert.equal(out.provider, "gemini");
assert.match(out.text, /OK from good/);
assert.equal(out.attempts.length, 3);
assert.equal(out.attempts[0].status, 429);
console.log("✓ failover: groq(429) → cerebras(empty) → gemini(ok)");

/* ---------- test 3: preferred provider সামনে আসে ---------- */
const preferred = await callAI({ prompt: "hi", preferred: "gemini" });
assert.equal(preferred.attempts.length, 1);
assert.equal(preferred.provider, "gemini");
console.log("✓ preferred provider সরাসরি ব্যবহৃত হয়");

/* ---------- test 4: সব ফেল করলে পরিষ্কার error ---------- */
process.env.AI_PROVIDER_ORDER = "groq,cerebras";
await assert.rejects(
    () => callAI({ prompt: "x" }),
    err => {
        assert.equal(err.attempts.length, 2);
        assert.match(err.message, /সব AI provider ব্যর্থ/);
        return true;
    }
);
console.log("✓ সব ফেল করলে সঠিক error + attempt log");

/* ---------- test 5: Power Mode (council) ---------- */
const d = await mock("good2");
process.env.MISTRAL_API_KEY = "test";
process.env.MISTRAL_BASE_URL = url(d);
process.env.AI_PROVIDER_ORDER = "gemini,mistral";
process.env.AI_COUNCIL_SIZE = "2";

const council = await callAICouncil({ prompt: "merge test" });
assert.equal(council.mode, "council");
assert.equal(council.panel.length, 2);
assert.equal(council.drafts.length, 2);
console.log("✓ Power Mode: 2টি AI-এর ড্রাফট মিলিয়ে একটি উত্তর");

/* ---------- test 6: timeout ---------- */
const h = await mock("hang");
process.env.AI_PROVIDER_ORDER = "groq,gemini";
process.env.GROQ_BASE_URL = url(h);
process.env.AI_TIMEOUT_MS = "600";

const afterTimeout = await callAI({ prompt: "y" });
assert.equal(afterTimeout.provider, "gemini");
assert.match(afterTimeout.attempts[0].error, /টাইমআউট/);
console.log("✓ timeout হলে পরের প্রোভাইডারে চলে যায়");

[a, b, c, d, h].forEach(s => s.close());

console.log("\nসব টেস্ট পাস ✅\n");

/* ================= Creator Services ================= */

const tools = await import("../api/_tools.js");

/* SRT জেনারেশন */
const srt = tools.toSrt([
    { start: 0, end: 2.5, text: "প্রথম লাইন" },
    { start: 2.5, end: 5.25, text: "দ্বিতীয় লাইন" }
]);
assert.match(srt, /^1\n00:00:00,000 --> 00:00:02,500\nপ্রথম লাইন/);
assert.match(srt, /2\n00:00:02,500 --> 00:00:05,250/);
console.log("✓ SRT সাবটাইটেল সঠিকভাবে তৈরি হয়");

/* ইমেজ URL */
const imgUrl = tools.buildImageUrl("a cat on a bike", { width: 1280, height: 720, seed: 7 });
assert.match(imgUrl, /^https:\/\/image\.pollinations\.ai\/prompt\/a%20cat%20on%20a%20bike\?/);
assert.match(imgUrl, /width=1280/);
assert.match(imgUrl, /height=720/);
assert.match(imgUrl, /seed=7/);
assert.match(imgUrl, /nologo=true/);
console.log("✓ Pollinations ইমেজ URL সঠিক");

/* প্রিসেট */
assert.equal(tools.IMAGE_PRESETS.thumbnail.width, 1280);
assert.equal(tools.IMAGE_PRESETS.short.height, 1280);
console.log("✓ ইমেজ প্রিসেট ঠিক আছে");

/* খারাপ URL ধরা পড়ে */
await assert.rejects(() => tools.readUrl("not a url at all"), /সঠিক একটি URL/);
console.log("✓ ভুল URL আগেই আটকে যায়");

/* খালি টেক্সটে TTS আটকায় */
await assert.rejects(() => tools.textToSpeech("   "), /কিছু টেক্সট দিন/);
await assert.rejects(() => tools.textToSpeech("ক".repeat(4100)), /খুব বড়/);
console.log("✓ TTS ইনপুট ভ্যালিডেশন কাজ করে");

/* TTS চাঙ্কিং — Google Translate-এর ২০০ অক্ষর সীমা */
const bangla = "আজকের ভিডিওতে স্বাগতম। " .repeat(20);
const pieces = tools.chunkText(bangla);
assert.ok(pieces.length > 1, "বড় লেখা ভাগ হওয়া উচিত");
assert.ok(pieces.every(p => p.length <= 190), "প্রতিটি অংশ ১৯০ অক্ষরের কম");
assert.equal(pieces.join(" ").replace(/\s+/g, " ").trim(),
             bangla.replace(/\s+/g, " ").trim(), "কোনো লেখা হারায়নি");

const single = tools.chunkText("ছোট বাক্য।");
assert.equal(single.length, 1);

const huge = tools.chunkText("ক".repeat(500));
assert.ok(huge.every(p => p.length <= 190), "বিশাল একক বাক্যও ভাগ হয়");
console.log("✓ TTS চাঙ্কিং: লেখা ভাগ হয়, কিছুই হারায় না");

/* ভয়েস তালিকা */
assert.ok(tools.VOICES.some(v => v.id === "bn"), "বাংলা ভয়েস থাকতে হবে");
assert.ok(tools.VOICES.find(v => v.id === "bn").forceGoogle, "বাংলা → Google TTS");
console.log("✓ বাংলা ভয়েস সরাসরি Google TTS-এ যায়");

/* সার্ভিস স্ট্যাটাস */
const services = tools.describeServices();
assert.equal(services.length, 5);
assert.ok(services.every(s => s.id && s.label && s.provider));
console.log("✓ ৫টি Creator Service রিপোর্ট হচ্ছে");

console.log("\nCreator Services টেস্টও পাস ✅\n");

/* ================= Diagrams ================= */

const dg = await import("../api/_diagrams.js");

/* pako round-trip — mermaid.ink/mermaid.live যে ফরম্যাট চায় */
const mermaidCode = `mindmap
  root((বাংলা রান্না))
    কনটেন্ট
      রেসিপি
    দর্শক
      গৃহিণী`;

const rendered = dg.renderMermaid(mermaidCode);
assert.ok(rendered.svgUrl.startsWith("https://mermaid.ink/svg/pako:"));
assert.ok(rendered.pngUrl.includes("type=png"));
assert.ok(rendered.editUrl.startsWith("https://mermaid.live/edit#pako:"));

const raw = rendered.svgUrl.split("/svg/")[1].split("?")[0].replace("pako:", "");
const inflated = JSON.parse(
    (await import("node:zlib")).inflateSync(
        Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64")
    ).toString("utf8")
);
assert.equal(inflated.code, mermaidCode);
assert.equal(JSON.parse(inflated.mermaid).theme, "default");
console.log("✓ mermaid.ink pako এনকোডিং round-trip সঠিক");

/* sanitize — AI-এর কমন সিনট্যাক্স ভুল ঠিক হয় */
const fixed = dg.sanitizeMermaid("```mermaid\nflowchart TD\n  A[শুরু (এখানে)] --> B{ঠিক?}\n```");
assert.ok(!fixed.includes("```"));
assert.match(fixed, /A\["শুরু \(এখানে\)"\]/);
assert.match(fixed, /B\{"ঠিক\?"\}/);
console.log("✓ mermaid sanitizer কোড ফেন্স ও বন্ধনী ঠিক করে");

/* চার্ট */
const chart = dg.renderChart({
    type: "bar",
    title: "মাসিক ভিউ",
    labels: ["জান", "ফেব", "মার্চ"],
    datasets: [{ label: "ভিউ", data: [100, 250, 400] }]
});
assert.equal(new URL(chart.url).hostname, "quickchart.io");
assert.equal(chart.config.data.datasets[0].data.length, 3);
assert.equal(dg.renderChart({ type: "bar", labels: ["a"] }), null);
console.log("✓ QuickChart URL তৈরি ও খারাপ ইনপুট বাতিল হয়");

/* JSON পার্সার — মডেল আজেবাজে কথা বললেও JSON বের করে */
assert.deepEqual(dg.parseJsonLoose('```json\n{"a":1}\n```'), { a: 1 });
assert.deepEqual(dg.parseJsonLoose('এই নিন: {"a":2} ধন্যবাদ'), { a: 2 });
assert.equal(dg.parseJsonLoose("কোনো json নেই"), null);
console.log("✓ loose JSON পার্সার মডেলের বাড়তি কথা সামলায়");

/* পুরো /api/diagram endpoint — mock AI দিয়ে */
const diagramMock = await mock("diagram");
process.env.AI_PROVIDER_ORDER = "groq";
process.env.GROQ_BASE_URL = url(diagramMock);
process.env.GROQ_API_KEY = "test";
process.env.AI_TIMEOUT_MS = "5000";

// mock server টা model নাম echo করে, তাই আসল JSON দিতে আলাদা সার্ভার লাগবে
const jsonServer = await new Promise(resolve => {
    const srv = http.createServer((rq, rs) => {
        rs.setHeader("Content-Type", "application/json");
        rs.end(JSON.stringify({
            choices: [{ message: { content: JSON.stringify({
                title: "টেস্ট রিসার্চ",
                summary: "সারসংক্ষেপ",
                insights: ["পয়েন্ট এক", "পয়েন্ট দুই"],
                diagrams: [{ kind: "mindmap", caption: "মূল ম্যাপ",
                    code: "mindmap\n  root((বিষয়))\n    শাখা" }],
                charts: [{ type: "pie", title: "ভাগ", labels: ["ক", "খ"],
                    datasets: [{ label: "শতাংশ", data: [60, 40] }], note: "উৎস: টেস্ট" }]
            }) } }]
        }));
    });
    srv.listen(0, "127.0.0.1", () => resolve(srv));
});

process.env.GROQ_BASE_URL = url(jsonServer);

const diagramHandler = (await import("../api/diagram.js")).default;

const fakeRes = {
    statusCode: 200,
    payload: null,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; }
};

await diagramHandler(
    { method: "POST", body: { topic: "বাংলা ইউটিউব", research: false } },
    fakeRes
);

assert.equal(fakeRes.statusCode, 200);
assert.equal(fakeRes.payload.title, "টেস্ট রিসার্চ");
assert.equal(fakeRes.payload.diagrams.length, 1);
assert.ok(fakeRes.payload.diagrams[0].svgUrl.includes("mermaid.ink"));
assert.equal(fakeRes.payload.charts.length, 1);
assert.ok(fakeRes.payload.charts[0].url.includes("quickchart.io"));
assert.equal(fakeRes.payload.insights.length, 2);
console.log("✓ /api/diagram সম্পূর্ণ পাইপলাইন কাজ করে (AI JSON → ছবি URL)");

[diagramMock, jsonServer].forEach(s => s.close());

console.log("\nVisual Research টেস্টও পাস ✅\n");
