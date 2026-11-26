# Pocket Helper installable web app

- Footer button: **Install Pocket Helper**. Native install prompts are shown only after a user click when the browser supplies `beforeinstallprompt`.
- iPhone/iPad: Safari → Share → Add to Home Screen. On Android/desktop, use a supporting browser's Install App menu when a prompt is unavailable. Open previews in their own HTTPS tab rather than an embedded frame.
- Manifest: standalone window, stable `/` identity, own icons, shortcuts to tools, assignment cover and retouch.
- Offline: shell/directory cached; other public assets cached as visited. An uncached page shows an offline explanation. Not every tool is offline-ready, and caches may be evicted. AI, creator authentication and online content require internet.
- Private admin/studio pages, API calls, ad frame and external requests bypass the service worker cache. User images/form inputs are not saved by this worker.
- No APK, Play Store release, push notifications or background synchronization. Installation does not bypass ISP restrictions.
- Automated prompt and cache-boundary tests pass. Physical Android/iOS installation still needs device testing after the preview deployment.

- After 12 seconds, a non-modal install reminder appears once per tab session, unless already installed, storage is blocked, consent/dialog is open, or an input is focused. It can be dismissed; it never opens the browser install prompt automatically.
