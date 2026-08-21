/**
 * Pocket AI — External Free Services
 * ----------------------------------
 * LLM-এর বাইরে যেসব ফ্রি API দিয়ে টুলটা আসল powerhouse হয়:
 *
 *   Pollinations  → ইমেজ জেনারেশন + TTS   (key লাগে না)
 *   Jina Reader   → যেকোনো URL → পরিষ্কার টেক্সট  (key লাগে না)
 *   Tavily/Jina   → লাইভ ওয়েব সার্চ
 *   Groq Whisper  → অডিও/ভিডিও ট্রান্সক্রিপশন (GROQ_API_KEY দিয়েই চলে)
 */

const UA = "PocketAI/2.1 (+https://github.com/Mehedi114/pocket-ai-creators)";

function timeoutSignal(ms) {
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c.signal;
}

/* ======================================================
   1. IMAGE — Pollinations (key ছাড়া, unlimited-ish)
   ====================================================== */

export const IMAGE_PRESETS = {
    thumbnail: { width: 1280, height: 720, label: "YouTube Thumbnail 16:9" },
    short: { width: 720, height: 1280, label: "Shorts / Reels 9:16" },
    square: { width: 1080, height: 1080, label: "Facebook / Instagram 1:1" },
    banner: { width: 2048, height: 1152, label: "Channel Banner" },
    wide: { width: 1600, height: 900, label: "Blog Header" }
};

export function buildImageUrl(prompt, {
    width = 1280,
    height = 720,
    seed,
    model = process.env.POLLINATIONS_MODEL || "flux",
    nologo = true,
    enhance = true
} = {}) {
    const params = new URLSearchParams({
        width: String(width),
        height: String(height),
        model,
        nologo: String(nologo),
        enhance: String(enhance),
        referrer: "pocket-ai-creators"
    });

    if (seed !== undefined) params.set("seed", String(seed));

    const token = process.env.POLLINATIONS_TOKEN;
    if (token) params.set("token", token);

    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}

/* ======================================================
   2. READ ANY URL — Jina Reader (key ছাড়া ~20 RPM)
   ====================================================== */

export async function readUrl(target, { maxChars = 24000, timeoutMs = 30000 } = {}) {
    let clean;

    try {
        clean = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`).toString();
    } catch {
        const err = new Error("সঠিক একটি URL দিন।");
        err.status = 400;
        throw err;
    }

    const headers = {
        "User-Agent": UA,
        "X-Return-Format": "markdown",
        Accept: "text/plain"
    };

    if (process.env.JINA_API_KEY) {
        headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
    }

    const response = await fetch(`https://r.jina.ai/${clean}`, {
        headers,
        signal: timeoutSignal(timeoutMs)
    });

    const text = await response.text();

    if (!response.ok) {
        const err = new Error(
            response.status === 429
                ? "Reader সার্ভিস ব্যস্ত (rate limit)। একটু পরে আবার চেষ্টা করুন, অথবা ফ্রি JINA_API_KEY যোগ করুন।"
                : `পেজটি পড়া যায়নি (HTTP ${response.status})।`
        );
        err.status = response.status;
        throw err;
    }

    const titleMatch = text.match(/^Title:\s*(.+)$/m);

    return {
        url: clean,
        title: titleMatch ? titleMatch[1].trim() : clean,
        content: text.slice(0, maxChars),
        truncated: text.length > maxChars,
        chars: text.length
    };
}

/* ======================================================
   3. WEB SEARCH — Tavily → Jina Search → Pollinations
   ====================================================== */

async function tavilySearch(query, { maxResults, timeoutMs }) {
    const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TAVILY_API_KEY}`
        },
        body: JSON.stringify({
            query,
            max_results: maxResults,
            search_depth: "basic",
            include_answer: true
        }),
        signal: timeoutSignal(timeoutMs)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error || `Tavily ব্যর্থ (HTTP ${response.status})`);
    }

    return {
        engine: "tavily",
        answer: data.answer || "",
        results: (data.results || []).map(r => ({
            title: r.title,
            url: r.url,
            snippet: (r.content || "").slice(0, 900)
        }))
    };
}

async function jinaSearch(query, { maxResults, timeoutMs }) {
    const headers = { "User-Agent": UA, Accept: "application/json" };

    if (process.env.JINA_API_KEY) {
        headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
    } else {
        throw new Error("Jina search এর জন্য JINA_API_KEY লাগে।");
    }

    const response = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
        headers,
        signal: timeoutSignal(timeoutMs)
    });

    const data = await response.json();

    if (!response.ok) throw new Error(`Jina search ব্যর্থ (HTTP ${response.status})`);

    return {
        engine: "jina",
        answer: "",
        results: (data.data || []).slice(0, maxResults).map(r => ({
            title: r.title,
            url: r.url,
            snippet: (r.content || r.description || "").slice(0, 900)
        }))
    };
}

async function duckSearch(query, { maxResults, timeoutMs }) {
    // key ছাড়া শেষ ভরসা — DuckDuckGo Instant Answer + Jina Reader
    const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        { headers: { "User-Agent": UA }, signal: timeoutSignal(timeoutMs) }
    );

    if (!response.ok) throw new Error("DuckDuckGo ব্যর্থ");

    const data = await response.json();

    const results = [];

    if (data.AbstractText) {
        results.push({
            title: data.Heading || query,
            url: data.AbstractURL || "",
            snippet: data.AbstractText
        });
    }

    for (const topic of data.RelatedTopics || []) {
        if (results.length >= maxResults) break;
        if (topic.Text && topic.FirstURL) {
            results.push({ title: topic.Text.slice(0, 90), url: topic.FirstURL, snippet: topic.Text });
        }
    }

    if (!results.length) throw new Error("কোনো ফলাফল পাওয়া যায়নি।");

    return { engine: "duckduckgo", answer: data.AbstractText || "", results };
}

export async function webSearch(query, { maxResults = 6, timeoutMs = 25000 } = {}) {
    const chain = [];

    if (process.env.TAVILY_API_KEY) chain.push(tavilySearch);
    if (process.env.JINA_API_KEY) chain.push(jinaSearch);
    chain.push(duckSearch);

    const errors = [];

    for (const fn of chain) {
        try {
            const out = await fn(query, { maxResults, timeoutMs });
            if (out.results?.length) return out;
        } catch (error) {
            errors.push(`${fn.name}: ${error.message}`);
        }
    }

    const err = new Error(
        "ওয়েব সার্চ ব্যর্থ। ফ্রি TAVILY_API_KEY যোগ করলে (মাসে ১০০০ সার্চ) অনেক ভালো কাজ করবে।"
    );
    err.status = 502;
    err.detail = errors;
    throw err;
}

export function searchAvailable() {
    return {
        tavily: Boolean(process.env.TAVILY_API_KEY),
        jina: Boolean(process.env.JINA_API_KEY),
        fallback: true
    };
}

/* ======================================================
   4. TRANSCRIBE — Groq Whisper (আপনার GROQ key দিয়েই)
   ====================================================== */

const MAX_AUDIO_BYTES = 24 * 1024 * 1024; // Groq ফ্রি টিয়ারে ২৫MB

export async function transcribeAudio(buffer, {
    filename = "audio.mp3",
    language,
    model = process.env.WHISPER_MODEL || "whisper-large-v3-turbo",
    timeoutMs = 120000
} = {}) {
    const key = process.env.GROQ_API_KEY;

    if (!key) {
        const err = new Error("ট্রান্সক্রিপশনের জন্য GROQ_API_KEY লাগে (ফ্রি)।");
        err.status = 500;
        throw err;
    }

    if (buffer.byteLength > MAX_AUDIO_BYTES) {
        const err = new Error(
            `ফাইলটি খুব বড় (${(buffer.byteLength / 1048576).toFixed(1)}MB)। ফ্রি টিয়ারে সর্বোচ্চ ২৪MB।`
        );
        err.status = 413;
        throw err;
    }

    const form = new FormData();
    form.append("file", new Blob([buffer]), filename);
    form.append("model", model);
    form.append("response_format", "verbose_json");
    if (language) form.append("language", language);

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
        signal: timeoutSignal(timeoutMs)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const err = new Error(data?.error?.message || `ট্রান্সক্রিপশন ব্যর্থ (HTTP ${response.status})`);
        err.status = response.status;
        throw err;
    }

    return {
        text: (data.text || "").trim(),
        language: data.language || language || null,
        duration: data.duration || null,
        segments: (data.segments || []).map(s => ({
            start: s.start,
            end: s.end,
            text: (s.text || "").trim()
        }))
    };
}

export async function fetchAudio(url, { timeoutMs = 60000 } = {}) {
    const response = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: timeoutSignal(timeoutMs)
    });

    if (!response.ok) {
        const err = new Error(`অডিও ফাইলটি ডাউনলোড করা যায়নি (HTTP ${response.status})।`);
        err.status = response.status;
        throw err;
    }

    const length = Number(response.headers.get("content-length") || 0);

    if (length > MAX_AUDIO_BYTES) {
        const err = new Error(`ফাইলটি খুব বড় (${(length / 1048576).toFixed(1)}MB)। সর্বোচ্চ ২৪MB।`);
        err.status = 413;
        throw err;
    }

    return Buffer.from(await response.arrayBuffer());
}

/** ট্রান্সক্রিপ্ট → SRT সাবটাইটেল */
export function toSrt(segments) {
    const stamp = seconds => {
        const ms = Math.floor((seconds % 1) * 1000);
        const s = Math.floor(seconds) % 60;
        const m = Math.floor(seconds / 60) % 60;
        const h = Math.floor(seconds / 3600);
        const pad = (n, w = 2) => String(n).padStart(w, "0");
        return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
    };

    return segments
        .map((s, i) => `${i + 1}\n${stamp(s.start)} --> ${stamp(s.end)}\n${s.text}\n`)
        .join("\n");
}

/* ======================================================
   5. VOICEOVER — Pollinations TTS (key ছাড়া)
   ====================================================== */

export const VOICES = [
    "alloy", "echo", "fable", "onyx", "nova", "shimmer",
    "coral", "verse", "ballad", "ash", "sage", "amuch", "dan"
];

export async function textToSpeech(text, { voice = "nova", timeoutMs = 90000 } = {}) {
    const clean = String(text || "").trim();

    if (!clean) {
        const err = new Error("কিছু টেক্সট দিন।");
        err.status = 400;
        throw err;
    }

    if (clean.length > 4000) {
        const err = new Error("টেক্সট খুব বড় (সর্বোচ্চ ৪০০০ অক্ষর)। ভাগ করে দিন।");
        err.status = 413;
        throw err;
    }

    const params = new URLSearchParams({
        model: "openai-audio",
        voice: VOICES.includes(voice) ? voice : "nova",
        referrer: "pocket-ai-creators"
    });

    if (process.env.POLLINATIONS_TOKEN) {
        params.set("token", process.env.POLLINATIONS_TOKEN);
    }

    const response = await fetch(
        `https://text.pollinations.ai/${encodeURIComponent(clean)}?${params}`,
        { headers: { "User-Agent": UA }, signal: timeoutSignal(timeoutMs) }
    );

    if (!response.ok) {
        const err = new Error(
            response.status === 429
                ? "ভয়েস সার্ভিস ব্যস্ত। ১৫ সেকেন্ড পরে আবার চেষ্টা করুন।"
                : `ভয়েস তৈরি ব্যর্থ (HTTP ${response.status})।`
        );
        err.status = response.status;
        throw err;
    }

    const type = response.headers.get("content-type") || "";

    if (!type.startsWith("audio")) {
        const err = new Error("ভয়েস সার্ভিস অডিও ফেরত দেয়নি। একটু পরে চেষ্টা করুন।");
        err.status = 502;
        throw err;
    }

    return {
        buffer: Buffer.from(await response.arrayBuffer()),
        contentType: type
    };
}

/* ======================================================
   কোন কোন সার্ভিস চালু আছে
   ====================================================== */

export function describeServices() {
    return [
        {
            id: "image",
            label: "Image / Thumbnail",
            provider: "Pollinations (Flux)",
            ready: true,
            keyEnv: "POLLINATIONS_TOKEN",
            optional: true,
            note: "key ছাড়াই চলে। token দিলে watermark ওঠে ও লিমিট বাড়ে।",
            keyUrl: "https://auth.pollinations.ai/"
        },
        {
            id: "read",
            label: "Read any URL",
            provider: "Jina Reader",
            ready: true,
            keyEnv: "JINA_API_KEY",
            optional: true,
            note: "key ছাড়া ~20 req/min। ফ্রি key দিলে 500 RPM + 10M টোকেন।",
            keyUrl: "https://jina.ai/api-dashboard/"
        },
        {
            id: "search",
            label: "Live web search",
            provider: process.env.TAVILY_API_KEY
                ? "Tavily"
                : process.env.JINA_API_KEY ? "Jina Search" : "DuckDuckGo (সীমিত)",
            ready: true,
            keyEnv: "TAVILY_API_KEY",
            optional: true,
            note: "ফ্রি ১০০০ সার্চ/মাস। না দিলে সীমিত fallback চলবে।",
            keyUrl: "https://app.tavily.com/home"
        },
        {
            id: "transcribe",
            label: "Transcribe audio/video",
            provider: "Groq Whisper v3 Turbo",
            ready: Boolean(process.env.GROQ_API_KEY),
            keyEnv: "GROQ_API_KEY",
            optional: false,
            note: "আপনার Groq key দিয়েই চলে। দিনে ~৮ ঘণ্টা অডিও ফ্রি।",
            keyUrl: "https://console.groq.com/keys"
        },
        {
            id: "voice",
            label: "AI Voiceover",
            provider: "Pollinations TTS",
            ready: true,
            keyEnv: "POLLINATIONS_TOKEN",
            optional: true,
            note: "১৩টি ভয়েস, key ছাড়াই চলে।",
            keyUrl: "https://auth.pollinations.ai/"
        }
    ];
}
