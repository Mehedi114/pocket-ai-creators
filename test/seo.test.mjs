import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
const origin='https://pocket-ai-creators.vercel.app';
const sitemap=new JSDOM(readFileSync('sitemap.xml','utf8'),{contentType:'text/xml'});
const urls=[...sitemap.window.document.querySelectorAll('loc')].map(el=>el.textContent);
const local=JSON.parse(readFileSync('tools/seo-content.json','utf8'));
const ai=JSON.parse(readFileSync('tools/ai-seo-content.json','utf8'));
assert.equal(urls.length,7+local.length+ai.length);
assert.equal(new Set(urls).size,urls.length);
const titles=new Set(),descriptions=new Set();
for(const url of urls){
 const path=new URL(url).pathname;
 const dom=new JSDOM(readFileSync(path==='/'?'index.html':path.slice(1),'utf8'));
 const d=dom.window.document;
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
  assert.ok(target.startsWith('/everyday-tools.html#')||target.startsWith('/creator-tools.html#')||target.startsWith('/?tool='));
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
