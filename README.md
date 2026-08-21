# Pocket AI — Creator Intelligence

ব্যক্তিগত ব্যবহারের জন্য বানানো একটি creator AI workspace — YouTube রিসার্চ,
টাইটেল, স্ক্রিপ্ট, থাম্বনেইল আইডিয়া, কনটেন্ট ক্যালেন্ডার, মার্কেটিং কপি সব এক জায়গায়।

সম্পূর্ণ **ফ্রি API** দিয়ে চলে। **সব কিছু $0 তে।**

---

## ✦ কী নতুন — Multi-Provider AI Engine

আগে পুরো অ্যাপ শুধু Groq-এর উপর নির্ভর করত। Groq-এর rate limit শেষ হলে
বা মডেল deprecate হলে পুরো টুল বন্ধ হয়ে যেত।

এখন **১৩টি ফ্রি প্রোভাইডারের একটা চেইন** আছে:

```
groq → cerebras → gemini → nvidia → mistral → github → openrouter
     → sambanova → huggingface → together → zai → llm7 → custom
```

- একটা fail করলে (429 / 500 / timeout / খালি উত্তর) → অটোমেটিক পরেরটায় চলে যায়
- শুধু যেগুলোর key দেওয়া আছে সেগুলোই চেইনে ঢোকে
- নতুন প্রোভাইডার যোগ করতে **কোড বদলানো লাগে না** — শুধু env variable
- UI-তে দেখা যায় কোন AI উত্তরটা দিয়েছে

> প্রোভাইডার লিস্টের উৎস: [awesome-freellm-apis](https://github.com/open-free-llm-api/awesome-freellm-apis)

### ⚡ Power Mode

টুল প্যানেলে **Power Mode** চালু করলে একসাথে ৩টি ভিন্ন AI-কে একই কাজ দেওয়া হয়,
তারপর সবচেয়ে ভালো প্রোভাইডার সেই ড্রাফটগুলো মিলিয়ে **একটি উন্নত চূড়ান্ত উত্তর** বানায়।
গুরুত্বপূর্ণ স্ক্রিপ্ট বা ক্যালেন্ডারের জন্য দারুণ।

---

## ✦ ফ্রি API Key কোথায় পাবেন

| # | Provider | কার্ড লাগে? | Key লিংক | Env variable |
|---|----------|-------------|----------|--------------|
| 1 | Groq | না | [console.groq.com/keys](https://console.groq.com/keys) | `GROQ_API_KEY` |
| 2 | Cerebras | না | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | `CEREBRAS_API_KEY` |
| 3 | Google Gemini | না | [aistudio.google.com](https://aistudio.google.com/app/apikey) | `GEMINI_API_KEY` |
| 4 | NVIDIA NIM | ফোন verify | [build.nvidia.com](https://build.nvidia.com/settings/api-keys) | `NVIDIA_API_KEY` |
| 5 | Mistral AI | না | [console.mistral.ai](https://console.mistral.ai/api-keys) | `MISTRAL_API_KEY` |
| 6 | GitHub Models | না | [github.com/marketplace/models](https://github.com/marketplace/models) | `GITHUB_MODELS_TOKEN` |
| 7 | OpenRouter | না | [openrouter.ai/keys](https://openrouter.ai/keys) | `OPENROUTER_API_KEY` |
| 8 | SambaNova | রেজিস্ট্রেশন | [cloud.sambanova.ai](https://cloud.sambanova.ai/apis) | `SAMBANOVA_API_KEY` |
| 9 | Hugging Face | না | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) | `HF_TOKEN` |
| 10 | Together AI | রেজিস্ট্রেশন | [api.together.ai](https://api.together.ai/settings/api-keys) | `TOGETHER_API_KEY` |
| 11 | Z AI (GLM) | না | [open.bigmodel.cn](https://open.bigmodel.cn/usercenter/apikeys) | `ZAI_API_KEY` |
| 12 | LLM7.io | না (key ছাড়াও চলে) | [token.llm7.io](https://token.llm7.io/) | `LLM7_API_KEY` |
| 13 | Custom / Ollama | — | নিজের সার্ভার | `CUSTOM_BASE_URL` |

Creator Research এর জন্য আলাদা করে দরকার:

- **YouTube Data API v3** → [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → `YOUTUBE_API_KEY`

> **সবগুলো লাগবে না।** ৩–৪টা দিলেই কার্যত কখনো লিমিটে পড়বেন না।
> সাজেশন: **Groq + Gemini + Cerebras + OpenRouter**।

---

## ✦ Creator Services — LLM-এর বাইরের ফ্রি API

শুধু টেক্সট নয়। এই সার্ভিসগুলো Pocket AI-কে পুরো স্টুডিও বানায়:

| সার্ভিস | কী করে | প্রোভাইডার | Key লাগে? |
|---|---|---|---|
| 🎨 **Thumbnail Maker** | বাংলা আইডিয়া → AI প্রম্পট → ৪টি থাম্বনেইল | Pollinations (Flux) | **না** |
| 🔗 **Read Any URL** | যেকোনো ব্লগ/নিউজ/PDF/প্রতিযোগীর পেজ পড়ে বিশ্লেষণ | Jina Reader | **না** |
| 🌐 **Live Web Search** | আজকের তথ্য দিয়ে সূত্রসহ উত্তর | Tavily → Jina → DDG | ঐচ্ছিক |
| 🎧 **Transcribe** | অডিও/ভিডিও → টেক্সট + SRT + চ্যাপ্টার + Shorts আইডিয়া | Groq Whisper v3 Turbo | Groq key-ই |
| 🎙️ **AI Voiceover** | স্ক্রিপ্ট → mp3 ভয়েসওভার, ১৩টি ভয়েস | Pollinations TTS | **না** |

### ঐচ্ছিক boost key

| Variable | পেলে যা হয় | লিংক |
|---|---|---|
| `TAVILY_API_KEY` | ভালো ওয়েব সার্চ, ১০০০/মাস ফ্রি | [app.tavily.com](https://app.tavily.com/home) |
| `JINA_API_KEY` | Reader 20 → 500 RPM, ১০M ফ্রি টোকেন | [jina.ai](https://jina.ai/api-dashboard/) |
| `POLLINATIONS_TOKEN` | ইমেজ থেকে watermark ওঠে, লিমিট বাড়ে | [auth.pollinations.ai](https://auth.pollinations.ai/) |

একটাও না দিলেও সব কাজ করবে — শুধু লিমিট কম থাকবে।

**Groq Whisper ফ্রি লিমিট:** দিনে ২,০০০ রিকোয়েস্ট, ২৮,৮০০ অডিও-সেকেন্ড (~৮ ঘণ্টা), ফাইল সর্বোচ্চ ২৪MB।

---

## ✦ Vercel এ সেটআপ

1. Vercel → আপনার প্রজেক্ট → **Settings → Environment Variables**
2. উপরের টেবিল থেকে যেগুলোর key আছে সেগুলো যোগ করুন
3. **Redeploy** করুন (env variable যোগ করার পর redeploy না করলে কাজ করবে না)
4. সাইটে গিয়ে সাইডবার → **⚙ AI Engine** — কোন প্রোভাইডারগুলো active দেখে নিন

> ⚠️ API key কখনো কোডে বা GitHub-এ রাখবেন না। শুধু environment variable এ।

---

## ✦ লোকালি চালানো

```bash
cp .env.example .env    # তারপর .env এ key বসান
npm run dev             # http://localhost:3000
```

`dev-server.mjs` কোনো dependency ছাড়াই Vercel-এর মতো `/api/*` রুট চালায়।

টেস্ট চালাতে (ইন্টারনেট ছাড়াই failover লজিক যাচাই করে):

```bash
npm test
```

---

## ✦ API endpoints

| Endpoint | Method | কাজ |
|----------|--------|-----|
| `/api/providers` | GET | কোন প্রোভাইডার active, কোন মডেল, চেইনের ক্রম |
| `/api/generate` | POST | `{ tool, input, mode?, provider? }` → টুলের আউটপুট |
| `/api/research` | POST | `{ url }` → YouTube চ্যানেল রিসার্চ রিপোর্ট |
| `/api/chat` | POST | `{ messages, mode?, provider? }` → ফ্রি-ফর্ম চ্যাট |
| `/api/image` | POST | `{ idea, preset?, count?, raw? }` → থাম্বনেইল/ইমেজ URL |
| `/api/read` | POST | `{ url, mode?, question? }` → যেকোনো পেজের বিশ্লেষণ |
| `/api/search` | POST | `{ query, intent? }` → লাইভ ওয়েব সার্চ + সূত্রসহ উত্তর |
| `/api/transcribe` | POST | `{ url }` বা `{ base64, filename }` → ট্রান্সক্রিপ্ট + SRT + রিপারপাস |
| `/api/tts` | POST | `{ text, voice? }` → mp3 ভয়েসওভার |

`mode: "power"` দিলে Power Mode, `provider: "gemini"` দিলে নির্দিষ্ট প্রোভাইডার।

উত্তরের সাথে সবসময় একটা `engine` অবজেক্ট আসে:

```json
{
  "success": true,
  "result": "...",
  "engine": {
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "mode": "single",
    "attempts": [
      { "provider": "groq", "ok": false, "status": 429 },
      { "provider": "gemini", "ok": true, "ms": 1840 }
    ]
  }
}
```

---

## ✦ ইঞ্জিন টিউনিং (ঐচ্ছিক)

| Variable | কাজ |
|----------|-----|
| `AI_PROVIDER_ORDER` | চেইনের ক্রম, কমা দিয়ে — `gemini,groq,cerebras` |
| `AI_PROVIDER_DISABLED` | সাময়িকভাবে বন্ধ রাখতে |
| `AI_COUNCIL_SIZE` | Power Mode এ কয়টা AI (ডিফল্ট 3) |
| `AI_TIMEOUT_MS` | প্রতি কলের timeout (ডিফল্ট 45000) |
| `<ID>_MODEL` | মডেল বদলাতে — `GROQ_MODEL=openai/gpt-oss-20b` |
| `<ID>_BASE_URL` | endpoint বদলাতে |

মডেল deprecate হলে শুধু `<ID>_MODEL` env variable বদলালেই হবে — deploy লাগবে না,
শুধু redeploy।

---

## ✦ ১৪টি টুল

**YouTube:** Titles · SEO Description · Tags · Script · Thumbnail Ideas · Hook Generator
**Social:** Facebook Caption · Repurpose Pack
**Marketing:** Product Description · Ad Copy · 30-Day Calendar · Competitor Angle
**Writing:** Blog Writer · Rewrite & Improve
**Studio:** Thumbnail Maker · Read Any URL · Live Web Search · Transcribe · AI Voiceover

নতুন টুল যোগ করতে `api/_prompts.js` এ একটা এন্ট্রি আর `index.html` এ একটা কার্ড — ব্যস।

---

## ✦ ফাইল স্ট্রাকচার

```
index.html            UI (একক ফাইল, dark theme)
research.js           ক্লায়েন্ট-সাইড creator research
api/_providers.js     ⭐ মাল্টি-প্রোভাইডার ইঞ্জিন + failover + Power Mode
api/_prompts.js       ১৪টি টুলের প্রম্পট লাইব্রেরি
api/_tools.js         ⭐ ইমেজ / রিডার / সার্চ / Whisper / TTS
api/generate.js       টুল জেনারেশন endpoint
api/research.js       YouTube রিসার্চ endpoint
api/chat.js           ফ্রি-ফর্ম চ্যাট endpoint
api/image.js          থাম্বনেইল জেনারেটর
api/read.js           যেকোনো URL বিশ্লেষণ
api/search.js         লাইভ ওয়েব সার্চ
api/transcribe.js     অডিও → টেক্সট + রিপারপাস
api/tts.js            AI ভয়েসওভার
api/providers.js      ইঞ্জিন + সার্ভিস স্ট্যাটাস endpoint
dev-server.mjs        লোকাল dev সার্ভার (zero dependency)
test/engine.test.mjs  failover টেস্ট
```
