# Pocket AI — tool audit

## Scope and method

Audited the current local working tree at `http://localhost:3000`, not the deployed
Vercel production site. Used an actual headless Chromium browser with web security
left enabled, file uploads, real download events, file signatures, and PDF page
checks. Browser dependencies were installed temporarily, not added to the app's
production dependencies. Tested desktop and 390px mobile layouts. No API secrets
were printed or changed. No changes were committed or pushed.

These are representative workflow tests, not a promise that every possible input,
file, browser or device will succeed. No uncaught page JavaScript errors occurred
in this browser run. `npm test` also passed.

## Link shortener clarification

**There is no link-shortener implementation in this repository.**
The UTM Link Builder adds campaign parameters; it does not shorten links. Its
browser test passed and its description/help now explicitly says it is not a
shortener. URL Encoder and Link-to-QR also do not shorten URLs. A public shortener
would need a durable redirect store or a configured third-party shortening service;
none is set up here. No fake short links were added.

## Actual browser results

| Tool / workflow | Result | What was checked |
|---|---|---|
| Link to QR | PASS | Generated a real URL QR, downloaded PNG and SVG, checked file signatures |
| Password | PASS | Generated 20-character password; downloaded matching text |
| Word counter & case conversion | PASS | Two-word input and uppercase transformation |
| Unit conversion | PASS | 0°C → 32°F |
| Percentage | PASS | 15% of 200 → 30 |
| UTM link builder | PASS | Campaign parameters, existing query and fragment retained |
| JSON | PASS | Valid formatting and visible invalid-input error |
| Base64 | PASS | Unicode text encode/decode round trip |
| URL components | PASS | Unicode URL-component round trip |
| Freelancer hourly rate | PASS | Form submission and calculated output |
| Freelancer tax reserve | PASS | Flat-rate estimate, not country tax rules |
| Mortgage | PASS | Monthly repayment and stated extras |
| Loan | PASS | Monthly payment and interest output |
| Compound interest | PASS | Contributions and growth output |
| Profit margin | PASS | Profit, margin and markup output |
| English readability | PASS | English prose and Flesch estimates |
| Tag generator, local mode | PASS | Clearly labeled rule-based suggestions |
| Prompt builder, local mode | PASS | Clearly labeled structured template |
| WebP conversion | PASS | Uploaded actual PNG and downloaded valid WebP |
| AVIF conversion | PASS | Worker + WASM loaded; actual PNG converted and AVIF downloaded |
| PDF merge | PASS | Two uploaded 2-page PDFs downloaded as a 4-page PDF |
| PDF split/extract | PASS | Selected page downloaded as a 1-page PDF |
| PDF compress/optimize | PASS | Uploaded PDF processed; downloaded PDF parsed with pages retained |
| Mobile layouts | PASS | No horizontal overflow on directory, QR and image workbench at 390px |
| YouTube thumbnails | BLOCKED | Actual external images failed to load; cards show unavailable/blocked |
| AI generation | BLOCKED | Actual request returned provider failure; local modes remain available |

PDF optimization is structural, not image downsampling, and does not guarantee
smaller files. Thumbnail direct downloads may require the open-image fallback due
to CORS. Readability is an English-language heuristic. Financial outputs are estimates.

## All AI and Studio endpoint probes

The local configuration reported **zero explicitly credentialed AI providers** and
only the keyless `llm7` fallback. All 14 homepage AI tools and the added AI Prompt
Refiner were submitted individually with a short test prompt. All returned HTTP
502 because the fallback request failed. Thus local template success is not being
reported as AI success.

Other live local endpoint probes:

| Endpoint/tool | Result |
|---|---|
| AI image/thumbnail generation | 502 — all AI providers failed |
| Read URL | 500 — external fetch failed |
| Live web search | 502 — search services failed |
| YouTube channel research | 500 — YOUTUBE_API_KEY not configured locally |
| Visual research | 502 — AI provider failed |
| Voiceover | 502 — external voice services failed |
| Transcription | 500 — GROQ_API_KEY missing; this was a configuration probe, not successful speech recognition |

The sandbox only permits a restricted set of outbound hosts; AI providers,
YouTube images and several Studio services are outside that allowlist. These local
failures **do not prove the production keys are invalid or the deployed site fails**.
Vercel production environment variables were not accessible or verified here.

## Fixes made during audit

- Clarified UTM builder text: it builds tracking links, not short URLs.
- Replaced Studio's misleading “models ready” status with configuration/unverified
  language. A keyless fallback no longer displays a false configured-key checkmark.
- Service cards explicitly distinguish configuration availability from a live
  connectivity test.
- Saved optional browser regression runner at `test/browser-audit.mjs`.

## Remaining deployment actions

1. Configure an appropriate AI provider key and available model in Vercel's
   intended environment, then redeploy. See `AI-SETUP.md`.
2. Configure GROQ_API_KEY for transcription and YOUTUBE_API_KEY for channel research
   if those features are required. These are separate from thumbnail downloading.
3. Repeat network-dependent checks on the approved live domain, where sandbox
   restrictions do not apply. Check browser console/network and function logs.
4. A link shortener remains **not implemented**, rather than labeled working.

To rerun the optional browser audit on a machine with Chromium:

```sh
npm install --no-save --package-lock=false playwright-core
CHROMIUM_PATH=/path/to/chromium AUDIT_BASE_URL=http://localhost:3000 node test/browser-audit.mjs
```

The browser audit performs real AI and thumbnail requests. AI calls can incur
provider charges if credentials are configured; the audit used only the keyless
fallback here. File and calculator tests do not need external APIs.
