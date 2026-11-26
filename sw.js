/**
 * Pocket Helper — Service Worker
 * --------------------------
 * অ্যাপ শেল ক্যাশ করে রাখে, যাতে ফোনে ইনস্টল করার পর
 * সাথে সাথে খোলে এবং নেট না থাকলেও অন্তত ইন্টারফেসটা দেখা যায়।
 *
 * /api/* কখনো ক্যাশ হয় না — AI-এর উত্তর সবসময় তাজা থাকবে।
 */

const VERSION = "pocket-helper-v14-install";
const SHELL = `${VERSION}-shell`;

const SHELL_FILES = [
    "/",
    "/index.html",
    "/research.js",
    "/offline.html",
    "/everyday-tools.html",
    "/assets/everyday-tools.bundle.js",
    "/tools/everyday.css",
    "/assets/pwa-install.js",
    "/assets/pwa-install.css",
    "/site.css",
    "/site.js",
    "/site-config.js",
    "/privacy-controls.js",
    "/manifest.webmanifest",
    "/assets/icon-192.png",
    "/assets/icon-512.png",
    "/assets/apple-touch-icon.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(SHELL)
            .then(cache => cache.addAll(SHELL_FILES))
            .then(() => self.skipWaiting())
            .catch(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => (k.startsWith("pocket-helper-") || k.startsWith("pocket-ai-")) && !k.startsWith(VERSION)).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("message", event => {
    if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", event => {
    const { request } = event;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // নিজের ডোমেইনের বাইরের জিনিস (ছবি, ডায়াগ্রাম) ব্রাউজারকেই সামলাতে দিই
    if (url.origin !== self.location.origin) return;

    // API কখনো ক্যাশ নয়
    if (["/studio.html", "/admin.html", "/assets/admin.bundle.js", "/assets/public-content.bundle.js", "/assets/listen.js"].includes(url.pathname)) return;

    if (url.pathname.startsWith("/api/") || url.pathname === "/adsterra-banner.html") return;

    // Consent/config/UI code must not lag behind the live HTML after deployment.
    if (["/site.js", "/site-config.js", "/privacy-controls.js", "/site.css", "/assets/language.js", "/assets/language-data.js", "/assets/language.css", "/assets/helper-home.js", "/assets/tool-catalog.js", "/assets/everyday-tools.bundle.js"].includes(url.pathname)) {
        event.respondWith(fetch(request, { cache: "no-cache" }).then(response => {
            if (response.ok) {
                const copy = response.clone();
                event.waitUntil(caches.open(SHELL).then(cache => cache.put(request, copy)));
            }
            if(!response.ok)throw new Error("Network asset unavailable");
            return response;
        }).catch(async () => (await caches.match(request)) || Response.error()));
        return;
    }

    // পেজ নেভিগেশন: আগে নেটওয়ার্ক, না পেলে ক্যাশ থেকে
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if(response.ok && !url.searchParams.has("post")){
                        const copy = response.clone();
                        event.waitUntil(caches.open(SHELL).then(c => c.put(url.pathname, copy)));
                    }
                    return response;
                })
                .catch(() => caches.match(url.pathname).then(r => r || caches.match("/offline.html")))
        );
        return;
    }

    // বাকি স্ট্যাটিক ফাইল: আগে ক্যাশ, পাশাপাশি ব্যাকগ্রাউন্ডে আপডেট
    event.respondWith(
        caches.match(request).then(cached => {
            const network = fetch(request)
                .then(response => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        event.waitUntil(caches.open(SHELL).then(c => c.put(request, copy)));
                    }
                    return response;
                })
                .catch(() => cached || Response.error());

            return cached || network;
        })
    );
});
