// Reuse the tested API handlers; nodejs_compat supplies crypto/zlib/Buffer
// and populates process.env from Worker bindings. Never mutate global env per request.
import access from '../api/access.js';
import chat from '../api/chat.js';
import diagram from '../api/diagram.js';
import generate from '../api/generate.js';
import image from '../api/image.js';
import providers from '../api/providers.js';
import read from '../api/read.js';
import research from '../api/research.js';
import search from '../api/search.js';
import transcribe from '../api/transcribe.js';
import tts from '../api/tts.js';
import vercel from '../vercel.json';

const handlers = { access, chat, diagram, generate, image, providers, read, research, search, transcribe, tts };
const json = (status, payload) => Response.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });

export async function invoke(handler, request) {
    const headers = Object.fromEntries(request.headers);
    // Do not trust a caller-supplied forwarding header for code attempt limits.
    headers['x-forwarded-for'] = request.headers.get('cf-connecting-ip') || 'unknown';
    let body = {};
    if (!['GET', 'HEAD'].includes(request.method)) {
        if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
            return json(415, { error: 'Content-Type must be application/json.' });
        }
        // Base64 audio needs more room than text; bound both declared and streamed size.
        const limit = new URL(request.url).pathname === '/api/transcribe' ? 36 * 1024 * 1024 : 1024 * 1024;
        if (Number(request.headers.get('content-length')) > limit) return json(413, { error: 'Request too large.' });
        const reader = request.body?.getReader();
        const chunks = [];
        let size = 0;
        if (reader) {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                size += value.byteLength;
                if (size > limit) { await reader.cancel(); return json(413, { error: 'Request too large.' }); }
                chunks.push(value);
            }
        }
        try {
            const raw = Buffer.concat(chunks).toString('utf8');
            body = raw ? JSON.parse(raw) : {};
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
        } catch { return json(400, { error: 'A JSON object is required.' }); }
    }
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    let status = 200, response;
    const res = {
        status(code) { status = code; return this; },
        setHeader(key, value) { responseHeaders.set(key, value); return this; },
        json(payload) { responseHeaders.set('Content-Type', 'application/json; charset=utf-8'); return this.end(JSON.stringify(payload)); },
        end(payload = null) { response = new Response(payload, { status, headers: responseHeaders }); return this; }
    };
    await handler({ method: request.method, headers, body }, res);
    return response || json(500, { error: 'No response from handler.' });
}

export default {
    async fetch(request, env) {
        try {
            const url = new URL(request.url);
            if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
                const name = url.pathname.slice(5);
                if (!Object.hasOwn(handlers, name)) return json(404, { error: 'API endpoint not found.' });
                // Fail closed during migration, before secrets have been installed.
                if (!(process.env.ACCESS_CODES || process.env.ACCESS_CODE)?.trim() || !process.env.SESSION_SECRET?.trim()) {
                    return json(503, { error: 'AI Studio setup is not complete. Please try again later.' });
                }
                if (!['GET', 'POST'].includes(request.method)) return json(405, { error: 'Method not allowed.' });
                return await invoke(handlers[name], request);
            }
            if (url.pathname === '/index.html') {
                url.pathname = '/';
                return Response.redirect(url.href, 308);
            }
            if (!['GET', 'HEAD'].includes(request.method)) return json(405, { error: 'Method not allowed.' });
            // With html_handling:none, keep .html URLs exact and map only root.
            const assetUrl = new URL(request.url);
            if (assetUrl.pathname === '/') assetUrl.pathname = '/index.html';
            const asset = await env.ASSETS.fetch(new Request(assetUrl, request));
            const response = new Response(asset.body, asset);
            response.headers.set('X-Content-Type-Options', 'nosniff');
            // Retain private-page CSP, noindex and SW cache policy on the new host.
            for (const rule of vercel.headers) {
                if (rule.source === url.pathname) {
                    for (const { key, value } of rule.headers) response.headers.set(key, value);
                }
            }
            if (url.pathname === '/studio.html') response.headers.set('Cache-Control', 'no-store');
            return response;
        } catch {
            // Never return stack traces, secrets or upstream request headers.
            return json(500, { error: 'Request failed. Please try again.' });
        }
    }
};
