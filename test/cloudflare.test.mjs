import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFile } from 'node:fs/promises';
const bundle = await build({entryPoints:['cloudflare/worker.js'],bundle:true,write:false,format:'esm',platform:'node'});
const options = {
    modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-11-01', compatibilityFlags: ['nodejs_compat'],
    serviceBindings: { ASSETS: async req => {
        const path = new URL(req.url).pathname;
        try { return new Response(await readFile('public' + (path === '/' ? '/index.html' : path))); }
        catch { return new Response('Not found', {status:404}); }
    } }
};
for (const configured of [false, true]) {
    const mf = new Miniflare(convertV4MiniflareOptions({workers: [{name:'test', ...options, bindings: configured ? {ACCESS_CODES:'TEST-ONLY',SESSION_SECRET:'local-test-secret-not-for-production'} : {}}]}));
    const call = (path, init) => mf.dispatchFetch('https://test.example'+path, init);
    const post = (body, token) => ({method:'POST',headers:{'Content-Type':'application/json',...(token ? {'x-access-token':token} : {})},body:JSON.stringify(body)});
    try {
        assert.equal((await call('/')).status,200);
        assert.equal((await call('/.env')).status,404);
        assert.equal((await call('/api/_auth')).status,404);
        const redirect = await call('/index.html?x=1',{redirect:'manual'});
        assert.equal(redirect.status,308);
        assert.equal(redirect.headers.get('location'),'https://test.example/?x=1');
        const admin = await call('/admin.html');
        assert.equal(admin.headers.get('cache-control'),'no-store');
        assert.match(admin.headers.get('content-security-policy'),/frame-ancestors 'none'/);
        assert.match(admin.headers.get('x-robots-tag'),/noindex/);
        assert.match((await call('/sw.js')).headers.get('cache-control'),/no-cache/);
        assert.equal((await call('/studio.html')).headers.get('cache-control'),'no-store');
        const status = await call('/api/access');
        assert.equal(status.status,configured ? 200 : 503);
        if (!configured) {
            assert.equal((await call('/api/generate',post({input:'test'}))).status,503);
            continue;
        }
        assert.equal((await status.json()).required,true);
        for (const endpoint of ['providers','chat','diagram','generate','image','read','research','search','transcribe','tts']) {
            assert.equal((await call('/api/'+endpoint,post({}))).status,401,endpoint+' must require access');
        }
        const login = await call('/api/access',post({code:'TEST-ONLY'}));
        assert.equal(login.status,200);
        assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Lax; Secure/);
        const {token} = await login.json();
        const info = await call('/api/providers',{headers:{'x-access-token':token}});
        assert.equal(info.status,200);
        assert.equal(info.headers.get('cache-control'),'no-store');
        assert.equal((await call('/api/providers',{headers:{cookie:`pocket_access=${token}`}})).status,200);
        assert.equal((await call('/api/providers',{headers:{'x-access-token':token+'invalid'}})).status,401);
        assert.equal((await call('/api/generate',post({},token))).status,400);
        assert.equal((await call('/api/access',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
        assert.equal((await call('/api/access',post(null))).status,400);
        assert.equal((await call('/api/access',{method:'POST',body:'code=oops'})).status,415);
        assert.equal((await call('/api/access',post({code:'x'.repeat(1024*1024)}))).status,413);
        assert.equal((await call('/api/access',{method:'DELETE'})).status,405);
        assert.equal((await call('/api/access',post({code:'wrong'}))).status,401);
    } finally { await mf.dispose(); }
}
console.log('Cloudflare workerd runtime: assets, fail-closed setup, signed access tokens, cookies, guards, JSON limits, and security headers passed.');
