# Pocket Helper: Cloudflare migration

## Status

Cloudflare production deployment succeeded after PR #8, and the user confirmed the website loads. The user has now renamed the Worker to `pockethelper` and reported disconnecting Vercel Git integration (this does not delete or stop existing Vercel deployments). The production branch remains `main`. This rename update must be deployed to align the Worker configuration and generated metadata. AI is intentionally disabled until the user obtains new provider keys; do not request or transfer secrets now. Supabase remains unchanged. Remaining live acceptance checks are listed below.

## Architecture

- `wrangler.jsonc`: Worker + allowlisted `public/` assets. Never upload the repository as static assets.
- `cloudflare/worker.js`: explicit routing for the 11 existing `/api/*` handlers using Node compatibility (crypto, zlib, Buffer and runtime `process.env`). Does not proxy APIs back to Vercel.
- Runtime bindings populate `process.env`; no per-request mutation or bundling of API credentials.
- All requests pass through the Worker so private HTML headers/CSP, service-worker cache headers and unknown-API JSON 404s are preserved. `/` maps to the exported homepage; existing `.html` links remain intact.
- APIs fail closed with 503 until ACCESS_CODES (or ACCESS_CODE) AND SESSION_SECRET exist. Public/local tools still work without provider credentials. API responses are no-store.
- Input is JSON only, bounded to 1 MiB (36 MiB for base64 transcription). Audio responses keep binary bytes and response headers.
- Access-code attempt throttling remains per-isolate, not a globally reliable rate limiter. Add Cloudflare rate limiting/WAF controls where the plan supports them before promoting widely; this code does not claim distributed brute-force protection.
- Request logging disabled by default to reduce unnecessary sensitive request logging.
- Supabase project, tables, RLS, owner auth and media storage are unchanged. No service-role key belongs in the browser or static build.

## Dashboard deployment

After approval, publish this branch and merge its PR into main. **Merge can automatically start Cloudflare production deployment.** Until secrets are entered, AI APIs deliberately show setup unavailable.

The already-selected settings can stay:

- Production branch: `main`
- Root: `/`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Wrangler's own build hook runs `npm run build:cloudflare`, rebuilding the export and updating only generated metadata to the Cloudflare origin. The first dashboard build is redundant but harmless. Do not bypass the Wrangler build hook. Build dependencies must be installed (`npm ci --include=dev` if an install command is available); Node 22.

Default origin: `https://pockethelper.mdmahedulislammehedi.workers.dev`. For a future custom domain set **build-time** `CLOUDFLARE_SITE_ORIGIN` to its HTTPS origin without trailing slash and rebuild. Do not change source Vercel metadata while Vercel remains the fallback.

## Secrets: user enters in Cloudflare dashboard, never in chat

Worker → Settings → Variables and secrets → Add variable → **Secret**. These must be **Worker runtime secrets**, not merely Git build environment variables. Save/deploy the changes as prompted.

Required to unlock AI APIs:
- `ACCESS_CODES`: desired comma-separated AI Studio codes (or singular `ACCESS_CODE`). This is NOT the Creator Login password.
- `SESSION_SECRET`: a long randomly generated secret from a password manager, not a reused password.

Copy whichever provider keys are actually in use from the user's secure source:
- `GROQ_API_KEY`: AI and Whisper transcription; optional Groq speech provider.
- `CEREBRAS_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`: configured AI providers; Gemini also supports speech.
- `YOUTUBE_API_KEY`: YouTube research.
- `TAVILY_API_KEY`: configured search.
- Other optional providers/model settings are documented in `.env.example` (including Jina/Pollinations).

Do not copy blank values or assume a hidden Vercel value can be recovered. No credentials were retrieved or transferred in this change. Do not place secret values in wrangler config, Git, build output or screenshots.

## Local verification

```
npm ci --include=dev
npm run build
npm test
npm run test:deployment
npm run build:cloudflare
npm run test:cloudflare
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
npm run dev:cloudflare
```

The Cloudflare test uses workerd/Miniflare with dummy credentials and checks missing-secret failure, real HMAC login/cookie validation, unauthorized requests, malformed/oversized JSON, private-page headers and static response handling. Its asset binding is a local file fixture. Wrangler dev was separately checked with the real assets binding (homepage, private pages, manifest, model asset, API setup failure, and private-file/unknown-route 404s).

For manually testing authenticated local API requests, put dummy credentials in ignored `.dev.vars`, not in tracked files. Wrangler and its matching Miniflare runtime are development-only dependencies; Miniflare's V4-option converter is used with the installed V5 runtime.

## Required live acceptance checks — still pending

1. Confirm deployment is Ready on the real Worker URL without VPN, using both mobile data and Wi-Fi if possible.
2. Check homepage, 41 tool directory, styling/fonts, photo downloads, background/retouch controls, assignment PDF and guide links.
3. Enter runtime secrets; test invalid and valid AI Studio codes, AI generation/chat, research, search, transcription and binary speech playback/download with actual providers. Sandbox outbound restrictions prevent validating these external providers here.
4. Creator Login: existing owner email/password; verify published content/audio, media uploads and signed private previews. Test logout and access denial. No Supabase schema migration is needed. Add the Cloudflare origin to Supabase Auth allowed redirect URLs before testing recovery/OAuth flows; change the primary Site URL only at confirmed cutover. Password sign-in itself uses the existing project directly.
5. PWA: install anew on the new origin, delayed reminder, offline public fallback; private/API/ads must remain uncached. Existing Vercel installations and local storage do not migrate automatically.
6. Check consent/ad opt-in and ad-free private pages; update ad-provider domain registration if required. Third-party ad availability/revenue is not guaranteed.
7. Verify Cloudflare canonical URLs and all 53 sitemap entries. Add/verify the new origin in Search Console and submit its sitemap. Do not claim existing ranking transfers automatically.
8. Only after acceptance, decide on a custom domain and old-domain redirects/retirement. Keep Vercel available as rollback until then. Do not add a Vercel-to-Cloudflare redirect during initial testing.

Local tests do not prove physical-phone performance, external-provider availability or successful production migration.
