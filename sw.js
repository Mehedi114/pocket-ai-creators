/**
 * Pocket AI — Service Worker
 * --------------------------
 * অ্যাপ শেল ক্যাশ করে রাখে, যাতে ফোনে ইনস্টল করার পর
 * সাথে সাথে খোলে এবং নেট না থাকলেও অন্তত ইন্টারফেসটা দেখা যায়।
 *
 * /api/* কখনো ক্যাশ হয় না — AI-এর উত্তর সবসময় তাজা থাকবে।
 */

const VERSION = "pocket-ai-v5";
const SHELL = `${VERSION}-shell`;

const SHELL_FILES = [
    "/",
    "/index.html",
    "/research.js",
    "/studio.html",
    "/site.css",
    "/site.js",
    "/site-config.js",
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
                keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k))
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
    if (url.pathname.startsWith("/api/") || url.pathname === "/adsterra-banner.html") return;

    // পেজ নেভিগেশন: আগে নেটওয়ার্ক, না পেলে ক্যাশ থেকে
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(SHELL).then(c => c.put(url.pathname, copy));
                    return response;
                })
                .catch(() => caches.match(url.pathname).then(r => r || fetch(request)))
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
                        caches.open(SHELL).then(c => c.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || network;
        })
    );
});
