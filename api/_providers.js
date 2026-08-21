/**
 * Pocket AI — Multi-Provider Free LLM Engine
 * ------------------------------------------
 * এক Groq-এর উপর নির্ভর না করে অনেকগুলো ফ্রি AI প্রোভাইডার
 * চেইন করে রাখা হয়েছে। একটা ফেল করলে (rate limit / down / bad key)
 * অটোমেটিক পরেরটায় চলে যাবে।
 *
 * সব প্রোভাইডারই OpenAI-compatible /chat/completions ব্যবহার করে।
 * শুধু environment variable এ key বসালেই সেই প্রোভাইডার active হয়ে যায়।
 *
 * Provider list source: https://github.com/open-free-llm-api/awesome-freellm-apis
 */

export const PROVIDERS = [
    {
        id: "groq",
        label: "Groq",
        keyEnv: "GROQ_API_KEY",
        modelEnv: "GROQ_MODEL",
        baseUrl: "https://api.groq.com/openai/v1",
        model: "openai/gpt-oss-120b",
        tokenParam: "max_completion_tokens",
        keyUrl: "https://console.groq.com/keys",
        note: "সবচেয়ে দ্রুত। কোনো কার্ড লাগে না। 30 RPM / 1000 RPD"
    },
    {
        id: "cerebras",
        label: "Cerebras",
        keyEnv: "CEREBRAS_API_KEY",
        modelEnv: "CEREBRAS_MODEL",
        baseUrl: "https://api.cerebras.ai/v1",
        model: "gpt-oss-120b",
        keyUrl: "https://cloud.cerebras.ai/",
        note: "অবিশ্বাস্য fast inference, ফ্রি tier, কার্ড লাগে না"
    },
    {
        id: "gemini",
        label: "Google Gemini",
        keyEnv: "GEMINI_API_KEY",
        modelEnv: "GEMINI_MODEL",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        model: "gemini-2.5-flash",
        keyUrl: "https://aistudio.google.com/app/apikey",
        note: "1M context, খুব ভালো Bangla, কার্ড লাগে না"
    },
    {
        id: "nvidia",
        label: "NVIDIA NIM",
        keyEnv: "NVIDIA_API_KEY",
        modelEnv: "NVIDIA_MODEL",
        baseUrl: "https://integrate.api.nvidia.com/v1",
        model: "meta/llama-3.3-70b-instruct",
        keyUrl: "https://build.nvidia.com/settings/api-keys",
        note: "১২৫+ ফ্রি মডেল, শুধু phone verification"
    },
    {
        id: "mistral",
        label: "Mistral AI",
        keyEnv: "MISTRAL_API_KEY",
        modelEnv: "MISTRAL_MODEL",
        baseUrl: "https://api.mistral.ai/v1",
        model: "mistral-small-latest",
        keyUrl: "https://console.mistral.ai/api-keys",
        note: "ফ্রি experiment tier, কার্ড লাগে না"
    },
    {
        id: "github",
        label: "GitHub Models",
        keyEnv: "GITHUB_MODELS_TOKEN",
        modelEnv: "GITHUB_MODEL",
        baseUrl: "https://models.github.ai/inference",
        model: "openai/gpt-4.1-mini",
        keyUrl: "https://github.com/marketplace/models",
        note: "GitHub PAT দিয়েই চলে — GPT / Llama / Phi সব ফ্রি"
    },
    {
        id: "openrouter",
        label: "OpenRouter",
        keyEnv: "OPENROUTER_API_KEY",
        modelEnv: "OPENROUTER_MODEL",
        baseUrl: "https://openrouter.ai/api/v1",
        model: "deepseek/deepseek-chat-v3-0324:free",
        keyUrl: "https://openrouter.ai/keys",
        extraHeaders: {
            "HTTP-Referer": "https://pocket-ai-creators.vercel.app",
            "X-Title": "Pocket AI Creators"
        },
        note: "একটা key-তেই ২৭+ ফ্রি মডেল"
    },
    {
        id: "sambanova",
        label: "SambaNova",
        keyEnv: "SAMBANOVA_API_KEY",
        modelEnv: "SAMBANOVA_MODEL",
        baseUrl: "https://api.sambanova.ai/v1",
        model: "Meta-Llama-3.3-70B-Instruct",
        keyUrl: "https://cloud.sambanova.ai/apis",
        note: "ফ্রি tier, দ্রুত 70B"
    },
    {
        id: "huggingface",
        label: "Hugging Face",
        keyEnv: "HF_TOKEN",
        modelEnv: "HF_MODEL",
        baseUrl: "https://router.huggingface.co/v1",
        model: "meta-llama/Llama-3.3-70B-Instruct",
        keyUrl: "https://huggingface.co/settings/tokens",
        note: "HF router — মাসে কিছু ফ্রি credit"
    },
    {
        id: "together",
        label: "Together AI",
        keyEnv: "TOGETHER_API_KEY",
        modelEnv: "TOGETHER_MODEL",
        baseUrl: "https://api.together.xyz/v1",
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        keyUrl: "https://api.together.ai/settings/api-keys",
        note: "কিছু মডেল একদম ফ্রি (-Free suffix)"
    },
    {
        id: "zai",
        label: "Z AI (GLM)",
        keyEnv: "ZAI_API_KEY",
        modelEnv: "ZAI_MODEL",
        baseUrl: "https://open.bigmodel.cn/api/paas/v4",
        model: "glm-4-flash",
        keyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
        note: "GLM-4-Flash চিরস্থায়ী ফ্রি"
    },
    {
        id: "llm7",
        label: "LLM7.io",
        keyEnv: "LLM7_API_KEY",
        modelEnv: "LLM7_MODEL",
        baseUrl: "https://api.llm7.io/v1",
        model: "gpt-5-nano",
        keyUrl: "https://token.llm7.io/",
        optionalKey: true,
        defaultKey: "unused",
        note: "key ছাড়াও কাজ করে — শেষ ভরসার safety net"
    },
    {
        id: "custom",
        label: "Custom / Self-hosted",
        keyEnv: "CUSTOM_API_KEY",
        modelEnv: "CUSTOM_MODEL",
        baseUrlEnv: "CUSTOM_BASE_URL",
        baseUrl: "http://localhost:11434/v1",
        model: "llama3.1",
        keyUrl: "https://ollama.com/",
        optionalKey: true,
        defaultKey: "ollama",
        requiresBaseUrl: true,
        note: "Ollama বা যেকোনো OpenAI-compatible endpoint যোগ করুন"
    }
];

const DEFAULT_ORDER = PROVIDERS.map(p => p.id);

/** এই environment এ কোন কোন প্রোভাইডার আসলে ব্যবহারযোগ্য */
export function getActiveProviders() {
    const rawOrder = (process.env.AI_PROVIDER_ORDER || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    const order = rawOrder.length ? rawOrder : DEFAULT_ORDER;

    const disabled = (process.env.AI_PROVIDER_DISABLED || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

    const byId = Object.fromEntries(PROVIDERS.map(p => [p.id, p]));

    const list = [];

    for (const id of order) {
        const provider = byId[id];
        if (!provider) continue;
        if (disabled.includes(id)) continue;

        const key = process.env[provider.keyEnv] || provider.defaultKey;

        if (!key) continue;
        if (!provider.optionalKey && !process.env[provider.keyEnv]) continue;

        // যেসব প্রোভাইডারের নিজস্ব endpoint দিতে হয় (custom/self-hosted)
        if (provider.requiresBaseUrl && !process.env[provider.baseUrlEnv]) continue;

        list.push({
            ...provider,
            apiKey: key,
            baseUrl:
                (provider.baseUrlEnv && process.env[provider.baseUrlEnv]) ||
                process.env[`${provider.id.toUpperCase()}_BASE_URL`] ||
                provider.baseUrl,
            model: process.env[provider.modelEnv] || provider.model
        });
    }

    return list;
}

/** UI/status endpoint এর জন্য পুরো রিপোর্ট */
export function describeProviders() {
    const active = getActiveProviders();
    const activeIds = new Set(active.map(p => p.id));

    return {
        activeCount: active.length,
        chain: active.map(p => p.id),
        providers: PROVIDERS.map(p => ({
            id: p.id,
            label: p.label,
            keyEnv: p.keyEnv,
            modelEnv: p.modelEnv,
            model: process.env[p.modelEnv] || p.model,
            keyUrl: p.keyUrl,
            note: p.note,
            optionalKey: Boolean(p.optionalKey),
            configured: activeIds.has(p.id),
            position: activeIds.has(p.id)
                ? active.findIndex(a => a.id === p.id) + 1
                : null
        }))
    };
}

function isRetryable(status) {
    return status === 408 || status === 409 || status === 425 ||
        status === 429 || status >= 500;
}

async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/** একটি নির্দিষ্ট প্রোভাইডারকে একবার কল করা */
async function callProvider(provider, { messages, temperature, maxTokens, timeoutMs }) {
    const body = {
        model: provider.model,
        messages,
        temperature
    };

    body[provider.tokenParam || "max_tokens"] = maxTokens;

    const response = await fetchWithTimeout(
        `${provider.baseUrl}/chat/completions`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${provider.apiKey}`,
                ...(provider.extraHeaders || {})
            },
            body: JSON.stringify(body)
        },
        timeoutMs
    );

    const text = await response.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        const err = new Error(
            `${provider.label} থেকে invalid response এসেছে।`
        );
        err.status = response.status;
        err.retryable = true;
        throw err;
    }

    if (!response.ok) {
        const err = new Error(
            data?.error?.message ||
            data?.message ||
            `${provider.label} request ব্যর্থ (HTTP ${response.status})`
        );
        err.status = response.status;
        err.retryable = isRetryable(response.status);
        throw err;
    }

    const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        "";

    const clean = typeof content === "string"
        ? content.trim()
        : String(content || "").trim();

    if (!clean) {
        const err = new Error(`${provider.label} খালি উত্তর দিয়েছে।`);
        err.status = 502;
        err.retryable = true;
        throw err;
    }

    return {
        text: clean,
        provider: provider.id,
        providerLabel: provider.label,
        model: provider.model,
        usage: data?.usage || null
    };
}

/**
 * মূল ফাংশন — চেইনের প্রতিটি প্রোভাইডার একে একে চেষ্টা করে।
 * প্রথম যেটা সফল হয়, সেটার উত্তর ফেরত দেয়।
 */
export async function callAI({
    system,
    prompt,
    messages,
    temperature = 0.8,
    maxTokens = 2048,
    timeoutMs = Number(process.env.AI_TIMEOUT_MS || 45000),
    preferred
} = {}) {
    let chain = getActiveProviders();

    if (!chain.length) {
        const err = new Error(
            "কোনো AI provider configure করা নেই। অন্তত একটি API key (যেমন GROQ_API_KEY) environment variable এ যোগ করুন।"
        );
        err.status = 500;
        err.noProviders = true;
        throw err;
    }

    // ইউজার নির্দিষ্ট প্রোভাইডার চাইলে সেটাকে সামনে আনি
    if (preferred) {
        const idx = chain.findIndex(p => p.id === preferred);
        if (idx > 0) {
            chain = [chain[idx], ...chain.filter((_, i) => i !== idx)];
        }
    }

    const finalMessages = messages || [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt }
    ];

    const attempts = [];

    for (const provider of chain) {
        const startedAt = Date.now();

        try {
            const result = await callProvider(provider, {
                messages: finalMessages,
                temperature,
                maxTokens,
                timeoutMs
            });

            attempts.push({
                provider: provider.id,
                ok: true,
                ms: Date.now() - startedAt
            });

            return { ...result, attempts };
        } catch (error) {
            const reason = error?.name === "AbortError"
                ? `টাইমআউট (${timeoutMs}ms)`
                : error?.message || "unknown error";

            attempts.push({
                provider: provider.id,
                ok: false,
                status: error?.status || null,
                ms: Date.now() - startedAt,
                error: reason
            });

            console.warn(`[pocket-ai] ${provider.id} ব্যর্থ:`, reason);

            // auth/quota/bad-model — পরের প্রোভাইডারে যাই
            continue;
        }
    }

    const err = new Error(
        "সব AI provider ব্যর্থ হয়েছে। একটু পরে আবার চেষ্টা করুন অথবা নতুন key যোগ করুন।"
    );
    err.status = 502;
    err.attempts = attempts;
    throw err;
}

/**
 * Power Mode — একসাথে কয়েকটা প্রোভাইডারকে জিজ্ঞেস করে,
 * তারপর সেরা প্রোভাইডারকে দিয়ে উত্তরগুলো মিলিয়ে একটা সেরা উত্তর বানায়।
 */
export async function callAICouncil({
    system,
    prompt,
    temperature = 0.8,
    maxTokens = 2048,
    panelSize = Number(process.env.AI_COUNCIL_SIZE || 3),
    timeoutMs = Number(process.env.AI_TIMEOUT_MS || 45000)
} = {}) {
    const chain = getActiveProviders();

    if (chain.length < 2) {
        // একটাই প্রোভাইডার — সাধারণ মোডেই চালাই
        const single = await callAI({ system, prompt, temperature, maxTokens, timeoutMs });
        return { ...single, mode: "single", panel: [single.provider] };
    }

    const panel = chain.slice(0, Math.max(2, Math.min(panelSize, chain.length)));

    const messages = [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt }
    ];

    const settled = await Promise.allSettled(
        panel.map(p => callProvider(p, { messages, temperature, maxTokens, timeoutMs }))
    );

    const drafts = settled
        .map((s, i) => ({ provider: panel[i], value: s.status === "fulfilled" ? s.value : null }))
        .filter(d => d.value);

    if (!drafts.length) {
        return callAI({ system, prompt, temperature, maxTokens, timeoutMs })
            .then(r => ({ ...r, mode: "fallback" }));
    }

    if (drafts.length === 1) {
        return {
            ...drafts[0].value,
            mode: "single",
            panel: [drafts[0].provider.id]
        };
    }

    const mergePrompt = `
তুমি একজন সিনিয়র এডিটর। নিচে একই কাজের জন্য ${drafts.length} টি ভিন্ন AI-এর ড্রাফট দেওয়া আছে।

মূল অনুরোধ:
"""
${prompt}
"""

${drafts.map((d, i) => `--- DRAFT ${i + 1} (${d.value.providerLabel}) ---\n${d.value.text}`).join("\n\n")}

কাজ:
- প্রতিটি ড্রাফটের সেরা অংশগুলো নাও।
- ভুল, বানানো তথ্য বা দুর্বল লাইন বাদ দাও।
- একটাই চূড়ান্ত, পরিষ্কার, উন্নতমানের উত্তর লেখো।
- ড্রাফট নিয়ে কোনো মন্তব্য বা তুলনা লিখবে না — শুধু চূড়ান্ত উত্তর দাও।
- মূল অনুরোধ বাংলায় হলে উত্তরও স্বাভাবিক বাংলায় লেখো।
`;

    try {
        const merged = await callProvider(panel[0], {
            messages: [
                { role: "system", content: "You are a meticulous senior editor who merges multiple drafts into one superior final answer." },
                { role: "user", content: mergePrompt }
            ],
            temperature: 0.5,
            maxTokens,
            timeoutMs
        });

        return {
            ...merged,
            mode: "council",
            panel: drafts.map(d => d.provider.id),
            drafts: drafts.map(d => ({
                provider: d.provider.id,
                providerLabel: d.value.providerLabel,
                model: d.value.model,
                text: d.value.text
            }))
        };
    } catch {
        const best = drafts.sort((a, b) => b.value.text.length - a.value.text.length)[0];
        return {
            ...best.value,
            mode: "council-partial",
            panel: drafts.map(d => d.provider.id)
        };
    }
}
