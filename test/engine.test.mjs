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
