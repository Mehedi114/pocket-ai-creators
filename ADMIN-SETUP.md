# Pocket Helper Creator Desk

## Implemented
- `/admin.html`: owner login, overview, searchable blog/audio lists, Markdown writing shortcuts, sanitized preview, cover/audio/PDF uploads, explicit draft/publish/unpublish, media preview and unused-file deletion, password reset/update, logout.
- `/blog.html`: published blog listing/search and post reader (`?post=<UUID>`). Currently client-rendered; individual posts are not statically generated or separately added to sitemap. No indexing guarantee.
- `/listen.html`: reads published Supabase audio episodes, resolves a fresh short-lived media URL when selected, and offers PDF slides links. The old static episode catalog remains an optional fallback; prefer admin publishing now.
- Files are uploaded directly to Supabase, not through Vercel serverless upload limits. Audio UI limit 10 MB, PDF 20 MB, images 5 MB. Storage bucket enforces a 20 MB overall limit and allowed MIME types. This is not malware scanning or audio compression/transcoding.
- Published media URLs are signed for 60 seconds. Reload/reopen a recording if a later seek needs an expired link. Unpublishing stops new public URLs, but already-issued URLs may work until expiry and downloaded copies cannot be recalled.
- Draft content/files are not public. Attachments become publicly readable only when referenced by a published entry. Replaced/detached files remain private until explicitly deleted in Media library.
- Publishing requires reviewer and rights confirmations. These are owner declarations, not automated fact/copyright verification.

## Supabase setup completed in this session
Project `pocket-helper`, ref `hypcrygviekhvqbthktj`, Singapore.
- Applied `pocket_helper_creator_cms` and `audio_end_date_required` migrations. Local combined SQL: `supabase/migrations/001_creator_cms.sql` (do not run twice).
- Created `public.ph_entries` with Row Level Security, publication constraints, UUID path ownership and timestamp updates.
- Created private `ph-media` storage bucket and owner/public-read policies.
- Created browser **publishable** key in `tools/cms-client.js`. This is intentionally public; no service-role/secret key is used or committed.
- Disabled public signup and phone login; email verification required. Auth redirect destination is only `https://pocket-helper.vercel.app/admin.html`.
- Owner policy uses the authenticated user ID and confirmed Auth email `mdmahedulislammehedi@gmail.com`, not an editable user-metadata role or a frontend-only email check.
- No password from chat was used. No owner account has been created yet.

## Remaining owner onboarding (required)
1. Approve release of this branch first; `/admin.html` and its bundle must be deployed before invite/reset links can work on production. Do not send an invite while the target page is absent.
2. In Supabase dashboard → project → Authentication → Users → Add user → Invite user, invite **mdmahedulislammehedi@gmail.com**. Use the exact approved email. There is deliberately no public signup button.
3. Open the invitation from that inbox. On the deployed admin page, Account & help lets you set a **new, unique password (at least 12 characters)**. Do not use the password previously shared in chat or send a password/API secret to the agent.
4. If the email does not arrive, check Supabase Auth logs, delivery restrictions and SMTP configuration. A configured Auth API does not prove email delivery. Configure a legitimate SMTP provider in the dashboard if needed; no SMTP credentials are configured by this code.
5. Sign out and sign in with the new password. Upload a real small audio recording and PDF, save a draft, and confirm in an incognito window that it is not listed or downloadable.
6. Preview, confirm review/rights, publish, and check `/listen.html` and `/blog.html`. Then unpublish and check that no new public media URL is issued.

Supabase dashboard membership is NOT the same as a website Auth account. The connected Supabase login does not automatically create your website admin login.

## Editor behavior and limitations
- Explicit Save only, no automatic/background publication. Save as draft on a published entry confirms unpublish. Publish saves changes to public content immediately.
- Concurrent edits are rejected using the last `updated_at`; copy unsaved text and reload the entry if another session edited it.
- No automatic deletion of attached files. Media deletion requires detaching and saving first. A browser/network failure after upload may leave an unused private object; it can be removed in Media library.
- Admin lists load up to 1,000 entries. Public feed loads the latest 200 entries (direct blog URLs can retrieve older published posts). Media lists up to 100 folders / 100 files per folder. Pagination beyond these caps is future work.
- Rich formatting is Markdown with toolbar helpers, not a full Blogger WYSIWYG editor. Raw HTML is sanitized, unsafe links/embedded scripts are removed. Inline images are not supported; use the cover image upload.
- PDF slides are opened in the browser's PDF viewer; PPT/PPTX conversion is not implemented.
- No analytics counts, fabricated visitor metrics, scheduling, multi-author roles or comments are presented as implemented.

## Security and privacy
- Admin has no ad scripts. Auth session is memory-only, not localStorage/sessionStorage; reload requires sign-in again. Supabase refreshes the active in-memory session.
- Invite/recovery URL tokens are consumed and removed from the address bar; page uses no-referrer, no-store, noindex and a restrictive production CSP.
- Service worker bypasses admin page and CMS bundles. Supabase responses/media are cross-origin and not cached by this service worker.
- Files, requests and Auth are handled by Supabase. Confirm current plan bandwidth/storage/email limits before increasing usage.
- SQL migrations and build-source modules are excluded from static deployment. Only bundled browser code with the publishable key is served.

## Validation performed
- Full existing tests, build and static export checks.
- Mock-backend admin UI tests: login, non-owner denial, save draft, publish, unpublish, sanitized Markdown preview, audio upload wiring, failure recovery and logout cleanup. These are not real password/email/storage delivery tests.
- Real database transaction tests (rolled back): anonymous draft denial, published content read, published-only storage reads, non-owner write denial, verified-owner create/update/unpublish, unverified-owner denial. All fixtures and the temporary test Auth record were rolled back.
- Real owner login, invitation delivery, browser upload, signed URL playback and production CMS routes remain to be tested after owner onboarding and approved deploy.
