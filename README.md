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
| 🎙️ **AI Voiceover** | স্ক্রিপ্ট → অডিও, **বাংলা সহ** | Groq PlayAI → Gemini → Google | **না** |
| 🧠 **Visual Research** | রিসার্চ → মাইন্ড ম্যাপ / ফ্লোচার্ট / চার্ট **ছবি** | mermaid.ink + QuickChart | **না** |

### ঐচ্ছিক boost key

| Variable | পেলে যা হয় | লিংক |
|---|---|---|
| `TAVILY_API_KEY` | ভালো ওয়েব সার্চ, ১০০০/মাস ফ্রি | [app.tavily.com](https://app.tavily.com/home) |
| `JINA_API_KEY` | Reader 20 → 500 RPM, ১০M ফ্রি টোকেন | [jina.ai](https://jina.ai/api-dashboard/) |
| `POLLINATIONS_TOKEN` | ইমেজ থেকে watermark ওঠে, লিমিট বাড়ে | [auth.pollinations.ai](https://auth.pollinations.ai/) |

একটাও না দিলেও সব কাজ করবে — শুধু লিমিট কম থাকবে।

**Groq Whisper ফ্রি লিমিট:** দিনে ২,০০০ রিকোয়েস্ট, ২৮,৮০০ অডিও-সেকেন্ড (~৮ ঘণ্টা), ফাইল সর্বোচ্চ ২৪MB।

---

## ✦ অ্যাক্সেস কোড (ফেসবুকে শেয়ার করার জন্য)

**ডিফল্টে গেট বন্ধ।** `ACCESS_CODES` সেট করা না থাকলে কোনো লক স্ক্রিন
আসে না — সরাসরি অ্যাপ খুলে যায়। নিজে টেস্ট করার সময় এটাই দরকার।

ফেসবুকে শেয়ার করার দিন শুধু একটা variable যোগ করে redeploy দিলেই
লক ফিরে আসবে। কোড থেকে কিছু মুছতে বা ফেরাতে হবে না।

Vercel → Environment Variables:

```
ACCESS_CODES = POCKET2026,FBTEST
```

- কমা দিয়ে একাধিক কোড দেওয়া যায়
- বড়/ছোট হাতের অক্ষর আলাদা ধরা হয় না
- ঢোকার পর টোকেন ১৪ দিন থাকে (`ACCESS_TTL_DAYS` দিয়ে বদলানো যায়)
- **কোড বদলালে আগের সব সেশন সাথে সাথে বাতিল** হয়ে যায়
- ৮ বার ভুল কোড দিলে ১০ মিনিট ব্লক

### Locking it down permanently after the test

Do **not** delete `ACCESS_CODES` — that switches the gate *off* and lets
anyone with the URL walk in. Instead, rotate it:

```
ACCESS_CODES    = <a long random string only you know>
ACCESS_TTL_DAYS = 3650
SESSION_SECRET  = <any long random string>
```

Then **Redeploy**. The moment the deploy goes live:

1. Every token issued under the old code is rejected — everyone who used
   the Facebook code is signed out instantly, on every device.
2. `SESSION_SECRET` changing invalidates the signatures too, as a second lock.
3. `ACCESS_TTL_DAYS=3650` means you enter your private code once and stay
   signed in for ten years.

Optionally rename the deployment under **Settings → Domains** so the old
URL stops resolving as well.

> টোকেন HMAC-SHA256 দিয়ে সই করা, তাই জাল করা যায় না।
> কোনো ডেটাবেস লাগে না।

---

## ✦ Interface

The UI is English, deliberately minimal, and typographic rather than
decorative — an editorial serif (Playfair Display) for headings, a script
wordmark (Italianno) in the header and lock screen, Inter for everything
functional, on near-black with a single champagne accent.

- Three views instead of one long page: **Desk · Studio · Engine**
- Icon rail on desktop, bottom tab bar on mobile
- Hairline grid tiles, no shadows, no neon
- Command palette on **⌘K / Ctrl+K** across all twenty tools
- **Home** is always one tap away: the topbar button, the rail, the mobile
  tab bar, a floating button once you scroll, and **⌘H / Ctrl+H**

AI replies always follow the language you write in — type Bangla, get Bangla.

---

## ✦ PWA — ফোনে অ্যাপের মতো

- ফোনে সাইট খুলে **"Add to Home screen"** চাপুন (বা হেডারের **⬇ Install**)
- আলাদা অ্যাপ আইকন, স্প্ল্যাশ স্ক্রিন, ফুলস্ক্রিন — ব্রাউজারের বার থাকবে না
- সার্ভিস ওয়ার্কার অ্যাপ শেল ক্যাশ করে, তাই সাথে সাথে খোলে
- **API কখনো ক্যাশ হয় না** — AI-এর উত্তর সবসময় তাজা
- হোম স্ক্রিনের আইকনে চেপে ধরলে শর্টকাট: Research · Thumbnail · Diagram

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
| `/api/diagram` | POST | `{ topic, url?, research?, kinds? }` → ডায়াগ্রাম + চার্ট ছবি |

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
**Studio:** Thumbnail Maker · Read Any URL · Live Web Search · Transcribe · AI Voiceover · Visual Research

### Visual Research কীভাবে কাজ করে

1. আপনি বিষয় লেখেন (ঐচ্ছিকভাবে একটা URL-ও দিতে পারেন)
2. **Tavily** দিয়ে লাইভ ওয়েব রিসার্চ হয়
3. AI ফলাফলকে বৈধ **Mermaid** কোড + **Chart.js** ডেটায় বদলায়
4. `mermaid.ink` ও `quickchart.io` সেটাকে আসল ছবিতে রেন্ডার করে

পাওয়া যায়: **Mind Map, Flowchart, Timeline, Audience Journey, Opportunity Matrix, Breakdown pie**
প্রতিটি ডায়াগ্রামে **⬇ PNG** ডাউনলোড, **✎ Edit** (mermaid.live-এ খোলে), **⧉ Code** কপি বোতাম।

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
api/_diagrams.js      mermaid.ink + QuickChart রেন্ডারার
api/diagram.js        Visual Research — রিসার্চ → ডায়াগ্রাম
api/providers.js      ইঞ্জিন + সার্ভিস স্ট্যাটাস endpoint
dev-server.mjs        লোকাল dev সার্ভার (zero dependency)
test/engine.test.mjs  failover টেস্ট
```


---

## ✦ লাইভ যাচাই (২১ আগস্ট ২০২৬)

প্রতিটি বাইরের সার্ভিস আসল রিকোয়েস্ট পাঠিয়ে পরীক্ষা করা হয়েছে:

| সার্ভিস | ফল |
|---|---|
| Pollinations image (Flux) | ✅ আসল ছবি ফেরত দেয় |
| Jina Reader (`r.jina.ai`) | ✅ key ছাড়া কাজ করে |
| mermaid.ink | ✅ কাজ করে (light theme-এ পড়া যায়) |
| QuickChart | ✅ আসল চার্ট ছবি |
| Google Translate TTS | ✅ mp3 ফেরত দেয়, বাংলা সহ |
| ~~Pollinations `openai-audio`~~ | ❌ **404 — মডেল সরিয়ে ফেলা হয়েছে** |
| ~~StreamElements TTS~~ | ❌ **401 — এখন key লাগে** |

শেষ দুটো বাদ দিয়ে ভয়েসওভার তিন স্তরের fallback-এ সরানো হয়েছে।

> ডায়াগ্রামের theme প্রথমে `dark` ছিল — রেন্ডার করে দেখা গেল কালো বাক্সে কালো লেখা,
> পড়াই যায় না। তাই `default` (সাদা ব্যাকগ্রাউন্ড) করা হয়েছে।

## Public marketing website (redesign)

The root `/` is now a public, indexable marketing page. The original gated creator
workspace remains at `/studio.html`; existing API routes and access controls are
unchanged. The landing page has 14 searchable/filterable tools, generation via
`/api/generate`, downloadable results, service inquiries, creator guides, and
privacy/advertising preferences. Fonts are self-hosted (licenses in `assets/fonts`).

### Launch checklist

1. Edit **`site-config.js`** and set `contactEmail` to your real business address.
   The inquiry form opens the visitor's email application; it is not a backend
   lead database. With no address configured, it only downloads a project brief
   and explicitly says it has not been submitted.
2. Configure AI provider credentials in your deployment environment using
   `.env.example`. Never put secrets in `site-config.js`. Existing `ACCESS_CODES`
   still protects generation; visitors can authenticate in Creator Studio.
   Add deployment-level abuse protection/rate limits before opening costly APIs
   to unrestricted public traffic.
3. For Adsterra, obtain approval for your domain and a **banner** placement.
   Open **`adsterra-banner.html`** in the repository root and paste the complete
   banner embed (including script tags) between the `PASTE YOUR FULL BANNER CODE`
   and `END OF BANNER CODE` comments. Save and commit to your hosting-connected
   branch, then wait for its deployment to succeed (or redeploy manually).
   Editing a local file alone does not update production. No other config edit
   is needed. Standard `atOptions` width/height are detected automatically;
   the default is 728×90. The older `site-config.js` key/URL setup remains a
   fallback if the HTML file has no script or iframe. No publisher IDs are invented.
   No advertising script loads before the user explicitly allows advertising
   in Ad preferences. Test your real banner on the deployed domain: its script
   runs in a sandboxed frame, and some formats may not support that isolation.
   An optional popunder is configured in `site-config.js` as `popunderScriptUrl`.
   It loads only when visitors separately opt into popunders AND allow advertising.
   Existing banner consent alone does not enable it. Unlike the sandboxed banner,
   this third-party script runs in the page and may open new tabs/windows after
   interaction. Withdrawing its consent reloads the page to clear vendor handlers.
   Browser popup blockers and provider policies may prevent delivery. Live delivery
   must be tested on the approved domain; automated tests do not execute vendor code.
4. Review the Privacy and Terms dialogs against your actual business, providers,
   jurisdiction and retention practices. Add real contact details before launch.
   Current service imagery is clearly labeled illustrative, not client work.
5. Advertising income is not guaranteed; it depends on approval, legitimate
   traffic, geography, fill rates and provider terms. Never encourage ad clicks.
6. Run `npm install` and `npm test`. `npm run dev` serves on `0.0.0.0:3000`.
   Deploy the repository to Vercel for the existing serverless API routes.

The marketing interaction tests use JSDOM with mocked AI responses; they do not
prove a live provider or Adsterra placement is available. The service worker now
caches navigation by pathname so the homepage and studio cannot replace each
other's offline cache entry.

### Optional Social Bar

The supplied Social Bar URL is configured as `socialBarScriptUrl` in
`site-config.js`. It is loaded in the page only when advertising is accepted
and the visitor separately checks **Also allow Social Bar ads**. Existing banner
consent does not opt visitors into this format. Social Bar may show floating ads
or overlays. Withdrawing this permission reloads the page to clear vendor code
and UI. Set the URL to an empty string to disable future loads. Tests check the
exact script URL, consent, single insertion, and withdrawal without executing
third-party scripts; real delivery still requires testing on the approved domain.

## Everyday Tools

Open `/everyday-tools.html`, linked from the homepage navigation and promo section.
Nine utilities run client-side without an API key: QR codes (PNG/SVG), passwords,
word/character counts and text cleanup, metric/US unit conversion, percentages,
UTM links, JSON formatting, UTF-8 Base64 and URL-component encoding.

- Direct links use stable fragments, e.g. `/everyday-tools.html#qr` or `#units`.
- `tools/utility-core.js` contains shared testable logic; `tools/everyday.js`
  handles the UI. `npm run build:tools` bundles the QR library and UI into
  `assets/everyday-tools.bundle.js`. Rebuild after changing these source files.
- The bundle is checked in for the no-build local server; `npm run build` rebuilds
  it on hosting services. The QR library license is in `assets/licenses/`.
- This page intentionally does not load homepage ads or analytics: third-party
  in-page scripts should not have access to password or developer-tool inputs.
  Hosting access logs are separate; no claim of anonymous hosting is made.
- Passwords use Web Crypto with rejection sampling, guarantee selected character
  classes, and are not saved. Copying uses the system clipboard; use a password
  manager to store passwords. QR codes encode the original URL without a redirect.
- Tests include independent QR decoding, Unicode round trips, conversion edge
  cases, password character rules, and browser-DOM interaction tests. These do
  not replace a real-device scan test before printing a QR code.

## Extended creator, finance and file tools

The tool directory now links to `/creator-tools.html#<tool>` for 14 additional
workflows (23 directory entries total). Thumbnails, tags, readability, prompt
building, freelance rate/tax estimates, mortgage/loan/compound interest, SaaS or
store margins, image conversion and PDF operations are available there.

- Tags and prompts default to clearly labeled rule/template-based local mode.
  AI mode calls the existing protected `/api/generate` endpoint. It requires a
  working provider and may incur that provider's usage costs.
- Financial results are estimates; tax reserves use a user-provided flat rate,
  not national tax brackets or filing rules. Loan rates are nominal annual rates
  divided by 12. Compound interest adds contributions at each month end.
- AVIF is encoded by a single-threaded WebAssembly worker with the self-hosted
  codec at `assets/codecs/avif_enc.wasm`. WebP uses canvas, with actual output MIME
  checked to prevent accidentally downloading a PNG labeled as WebP.
- PDFs are processed locally with pdf-lib. Merge order is editable; split accepts
  page ranges. Compression is best-effort structural optimization and returns
  the original if rewriting does not reduce size. Keep original signed/form PDFs.
- Image size limits: 15 MB input, 16 MP decoded, 2048 px max output dimension.
  PDF limits: 20 MB total input, 10 files, 500 pages per source/output.
- Thumbnail loading contacts YouTube. CORS can prevent direct download; open-image
  fallback is provided. No availability or copyright permission is inferred.
- The `Check provider configuration` button reports configuration, not live health.
  Only a successful actual generation demonstrates provider connectivity.
- `npm test` includes real PDF merge/extraction and actual AVIF WASM encoding, but
  no live YouTube/provider/browser image-download test is possible in restricted
  environments. Browser-specific behavior still needs live-device validation.

## Tool-specific search pages

Run `npm run build` after editing tool content. It now generates 36 tool guides
and the guide hub, updates sitemap.xml, builds browser assets, then refreshes
crawlable homepage/directory card markup. Content lives in `tools/seo-content.json`
and `tools/ai-seo-content.json`. See `SEO-LAUNCH.md` for claims, indexing and launch
requirements. The guide pages have canonical URLs and unique content, with direct
launch links to their tools; the duplicated YouTube tag entry shares one guide.

## Advertising visibility and first-visit consent

The homepage now loads `privacy-controls.js` independently of tool UI code.
A first-time visitor with no saved choice sees a visible consent panel. They can
allow banner ads, choose essential-only, or open settings to separately opt into
popunder and Social Bar. Returning visitors keep their choice; the persistent
**Privacy & ads** button reopens settings. Private-input utility pages deliberately
remain ad-free. Choices still apply for the current page when localStorage is
unavailable, but in that case they cannot persist across visits.

The homepage's **Advertisement → Check ad loading status** reports whether the
banner configuration was read and publisher scripts loaded, failed or gave no
response. **A loaded script is not verified ad delivery or an impression.** Real
ads still depend on domain approval, provider inventory, browser restrictions and
compatibility with the sandboxed banner frame. No provider code or publisher IDs
were changed in this fix. Ads never auto-enable without consent.

The service-worker cache version is bumped; current consent/config/UI assets use
network-first fetching and versioned homepage URLs to avoid stale pre-fix scripts.
Vercel is told not to cache sw.js or privacy-controls.js without revalidation.
Deployment must succeed on the actual production domain for these changes to show.

Tests: `test/consent.test.mjs` covers storage, opt-in, diagnostics and withdrawal.
The optional `test/browser-consent.mjs` uses real Chromium and mocked/blocked
vendor scripts to verify actual iframe rendering, first-visit mobile visibility,
independent initialization, and persistent choices. It does not claim live
Adsterra inventory was shown. Run with Playwright Core and an installed Chromium:

```sh
CHROMIUM_PATH=/path/to/chromium AUDIT_BASE_URL=http://localhost:3000 node test/browser-consent.mjs
```

## Vercel deployment output fix

The production deployment of commit `0c5d0a0` completed its build but then failed
with `STATIC_BUILD_NO_OUT_DIR`: Vercel expected `public/`, while the build generated
pages and bundles only in the source tree. This is confirmed from the deployment
build log, not inferred from the browser cache.

`npm run build` now ends with `scripts/export-static.mjs`, which publishes an
explicit allowlist of browser files to ignored `public/`. `vercel.json` explicitly
sets that output directory, runs `npm ci --include=dev` (build tools are required),
and runs the build. API files remain outside public and are handled as functions.
Node is pinned to the tested `22.x` runtime instead of automatically jumping to
newer major releases through `>=18`.

Run `npm run build && npm run test:deployment` to verify every sitemap page and
linked asset exists in public, that the AVIF codec and consent code are included,
and that API sources, environment files, tests and build scripts are NOT public.
The Vercel project does contain sensitive provider environment-variable entries;
the earlier zero-credential report was specific to the local sandbox, not proof
that production variables were absent. No sensitive values were decrypted.
