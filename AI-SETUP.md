# AI provider setup and diagnosis

## What was checked locally

- No `.env` or `.env.local` was present; `.env.example` is only documentation.
- The running local `/api/providers` returned only the key-less `llm7` fallback.
- A real `/api/generate` request failed with a `fetch failed` attempt for LLM7.
- This sandbox restricts outbound hosts and does not allow the AI provider hosts.
  A local failure is therefore NOT proof of invalid keys or a broken production API.
- Vercel production secrets were not accessible or inspected. No key value was
  printed, added to browser configuration, or stored in source control.

## Set up production

1. In your Vercel project's Environment Variables, set a supported provider key,
   e.g. `GROQ_API_KEY` or `GEMINI_API_KEY`, using `.env.example` as the reference.
   Choose Production and, if desired, Preview environments separately.
2. Confirm the provider account has quota and the configured model is available.
   Set the corresponding model variable if the default is not supported.
3. Redeploy after changing environment variables. Never paste provider keys into
   `site-config.js`, client JavaScript, public forms, a Git commit or chat.
4. In the live site, open an AI tool and generate a short test. In Creator Tools,
   the provider-check button reports configuration only. A key being present does
   not mean it is valid or its provider is reachable.
5. On failure, inspect Vercel function logs: distinguish authentication (401/403),
   quota/rate limits (429), unsupported model errors and network/timeouts.
6. Preserve `ACCESS_CODES` if you want an access gate. Configure platform-level
   rate/abuse protection before exposing billable AI routes to public traffic.

Local prompt templates, local tag suggestions, calculators, QR/password and
file tools work without AI keys. They are not presented as live model generation.
