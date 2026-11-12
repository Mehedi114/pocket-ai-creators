import {readFileSync,existsSync,readdirSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const config=JSON.parse(readFileSync('vercel.json','utf8'));
assert.equal(config.outputDirectory,'public');assert.equal(config.buildCommand,'npm run build');
assert.ok(existsSync('public/index.html'),'Run npm run build before this test.');
for(const file of ['api','scripts','test','.env','.env.example','package.json','README.md','tools/advanced-core.js','tools/seo-content.json'])assert.ok(!existsSync('public/'+file),'Private/build source leaked: '+file);
const map=new JSDOM(readFileSync('public/sitemap.xml','utf8'),{contentType:'text/xml'});
for(const loc of map.window.document.querySelectorAll('loc')){const route=new URL(loc.textContent).pathname;assert.ok(existsSync('public'+(route==='/'?'/index.html':route)),'Missing sitemap page '+route);}
map.window.close();
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of walk('public').filter(p=>p.endsWith('.html'))){
 const dom=new JSDOM(readFileSync(file,'utf8'));
 for(const el of dom.window.document.querySelectorAll('[src],link[href]')){
  const raw=el.getAttribute('src')||el.getAttribute('href');if(!raw?.startsWith('/')||raw.startsWith('//'))continue;
  const pathname=new URL(raw,'https://example.com').pathname;
  assert.ok(existsSync('public'+pathname),`${file}: missing asset ${pathname}`);
 }
 dom.window.close();
}
for(const file of ['privacy-controls.js','site-config.js','site.js','sw.js','assets/codecs/avif_enc.wasm','assets/avif-worker.js','adsterra-banner.html'])assert.deepEqual(readFileSync('public/'+file),readFileSync(file));
assert.ok(Object.keys(config.functions).every(file=>existsSync(file)), 'API sources remain available for Vercel functions');
console.log('✓ Vercel output: sitemap pages, browser assets, codec, consent and API sources accounted for; private/build files excluded');
