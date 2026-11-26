import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
const origin='https://pocket-helper.vercel.app';
const sitemap=new JSDOM(readFileSync('sitemap.xml','utf8'),{contentType:'text/xml'});
const urls=[...sitemap.window.document.querySelectorAll('loc')].map(el=>el.textContent);
const local=JSON.parse(readFileSync('tools/seo-content.json','utf8'));
const extra=JSON.parse(readFileSync('tools/new-tool-seo.json','utf8'));
const ai=JSON.parse(readFileSync('tools/ai-seo-content.json','utf8'));
assert.equal(urls.length,13+local.length+ai.length+extra.length);
assert.equal(new Set(urls).size,urls.length);
const titles=new Set(),descriptions=new Set();
for(const url of urls){
 const path=new URL(url).pathname;
 const dom=new JSDOM(readFileSync(path==='/'?'index.html':path.slice(1),'utf8'));
 const d=dom.window.document;
 if(path==='/'){
  assert.equal(d.head.querySelectorAll('meta[name="google-site-verification"]').length,1);
  assert.equal(d.head.querySelector('meta[name="google-site-verification"]').content,'qtv0x8CzDsHnDQVbHB2YM59e1xNsolbZ77xIezpAovw');
 }
 assert.equal(d.querySelectorAll('h1').length,1);
 assert.equal(d.querySelectorAll('title').length,1);
 assert.equal(d.querySelectorAll('meta[name="description"]').length,1);
 assert.equal(d.querySelector('link[rel="canonical"]').href,url);
 assert.equal(d.querySelector('meta[property="og:url"]').content,url);
 assert.ok(!d.querySelector('meta[name="robots"]').content.includes('noindex'));
 const schema=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent);
 const title=d.querySelector('title').textContent,description=d.querySelector('meta[name="description"]').content;
 assert.ok(!titles.has(title),'Duplicate title: '+title);titles.add(title);
 assert.ok(!descriptions.has(description),'Duplicate description: '+description);descriptions.add(description);
 if(path.startsWith('/tool-guides/')&&!path.endsWith('/index.html')){
  assert.ok(d.querySelectorAll('.tool-launch').length>=1);
  const target=d.querySelector('.tool-launch').getAttribute('href');
  assert.ok(target.startsWith('/everyday-tools.html#')||target.startsWith('/creator-tools.html#')||target.startsWith('/?tool=')||extra.some(t=>t.href===target));
  assert.equal(d.querySelectorAll('.seo-steps li').length,3);
  assert.ok(d.querySelectorAll('.seo-related a').length>=2);
  assert.ok(schema['@graph'].some(item=>item['@type']==='BreadcrumbList'));
 }
 for(const link of d.querySelectorAll('a[href^="/tool-guides/"]')){
  assert.ok(urls.includes(origin+link.getAttribute('href')),'Guide absent from sitemap: '+link.href);
 }
 if(path==='/'){
  assert.equal(d.querySelectorAll('#tool-grid h3').length,6);
  assert.equal(d.querySelectorAll('a.resource[href^="/guides/"]').length,3);
 }
 dom.window.close();
}
assert.ok(readFileSync('robots.txt','utf8').includes(`Sitemap: ${origin}/sitemap.xml`));
assert.ok(!urls.some(url=>url.includes('studio')||url.includes('adsterra')));
sitemap.window.close();
console.log('✓ SEO: sitemap, canonicals, unique metadata, structured data, crawlable tools and guide links');
// Each discoverable helper has a crawlable guide (YouTube Tags shares its guide).
const seoLinks=new JSDOM('',{runScripts:'outside-only'});
seoLinks.window.eval(readFileSync('assets/tool-catalog.js','utf8'));
seoLinks.window.eval(readFileSync('assets/seo-links.js','utf8'));
const {toolSEOPaths}=await import('../tools/seo-paths.js');
for(const tool of seoLinks.window.POCKET_TOOL_CATALOG){const guide=tool.isAI?seoLinks.window.POCKET_SEO.ai[tool.name]:toolSEOPaths[tool.id];assert.ok(guide,'Missing SEO guide: '+tool.name);assert.ok(urls.includes(origin+guide));}
seoLinks.window.close();
for(const url of urls){const path=new URL(url).pathname;const text=readFileSync(path==='/'?'index.html':path.slice(1),'utf8');assert.doesNotMatch(text,/Pocket AI|PocketAI|Pocket Helper Creators/);const page=new JSDOM(text),doc=page.window.document;assert.ok(doc.title.includes('Pocket Helper'));assert.equal(doc.querySelector('meta[property="og:site_name"]').content,'Pocket Helper');assert.equal(doc.querySelector('meta[name="twitter:title"]').content,doc.title);page.window.close();}
for(const path of ['admin.html','studio.html']){const page=new JSDOM(readFileSync(path,'utf8'));assert.match(page.window.document.querySelector('meta[name="robots"]').content,/noindex/);page.window.close();}
console.log('✓ All 41 helpers mapped to guides, public branding/social metadata consistent, private pages remain noindex');
