// Normalize public metadata without indexing private admin/studio pages.
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
const origin='https://pocket-helper.vercel.app';
const newTools=JSON.parse(fs.readFileSync('tools/new-tool-seo.json','utf8'));
const map=new JSDOM(fs.readFileSync('sitemap.xml','utf8'),{contentType:'text/xml'});
const routes=[...map.window.document.querySelectorAll('loc')].map(n=>new URL(n.textContent).pathname);map.window.close();
const context={window:{}};vm.runInNewContext(fs.readFileSync('assets/tool-catalog.js','utf8'),context);
const allTools=context.window.POCKET_TOOL_CATALOG;
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
for(const route of routes){
 const file=route==='/'?'index.html':route.slice(1);let html=fs.readFileSync(file,'utf8');
 const dom=new JSDOM(html),d=dom.window.document;
 if(route==='/'){
  d.title='Pocket Helper — Photo, Student, PDF & AI Tools';
  d.querySelector('meta[name="description"]').content='Find 41 tools and helpers for photo editing, passport print sheets, assignment covers, PDFs, calculations and optional AI writing. Made in Bangladesh, for everyone.';
 }
 const meta=(key,value,property=false)=>{const attr=property?'property':'name';let el=d.head.querySelector(`meta[${attr}="${key}"]`);if(!el){el=d.createElement('meta');el.setAttribute(attr,key);d.head.append(el);}el.setAttribute('content',value);};
 const description=d.querySelector('meta[name="description"]').content;
 meta('og:site_name','Pocket Helper',true);meta('og:title',d.title,true);meta('og:description',description,true);meta('og:url',origin+route,true);meta('og:type','website',true);meta('og:image',origin+'/assets/icon-512.png',true);meta('og:image:alt','Pocket Helper logo',true);
 meta('twitter:card','summary');meta('twitter:title',d.title);meta('twitter:description',description);meta('twitter:image',origin+'/assets/icon-512.png');
 // Keep existing structured-data names/descriptions aligned with visible metadata.
 for(const el of d.querySelectorAll('script[type="application/ld+json"]')){const data=JSON.parse(el.textContent);const nodes=data['@graph']||[data];for(const n of nodes){if(n['@type']==='WebPage'&&n.url===origin+route){n.name=d.title;n.description=description;}if(n['@type']==='WebSite'){n.name='Pocket Helper';delete n.alternateName;}}el.textContent=JSON.stringify(data).replaceAll('<','\\u003c');}
 if(route==='/everyday-tools.html'){
  d.querySelector('#tool-list-schema')?.remove();const script=d.createElement('script');script.id='tool-list-schema';script.type='application/ld+json';script.textContent=JSON.stringify({'@context':'https://schema.org','@type':'ItemList',name:'Pocket Helper tool directory',numberOfItems:allTools.length,itemListElement:allTools.map((t,i)=>({'@type':'ListItem',position:i+1,name:t.name,url:origin+t.href}))}).replaceAll('<','\\u003c');d.head.append(script);
 }
 html=html.replace(/<head>[\s\S]*?<\/head>/i,'<head>'+d.head.innerHTML+'</head>');
 const record=newTools.find(t=>t.href===route);
 if(record){
  const section=`<section id="tool-seo-help" class="wrap tool-seo-help" aria-labelledby="tool-help-title"><h2 id="tool-help-title">How to use ${escape(record.name)}</h2><p>${escape(record.intro)}</p><ol>${record.steps.map(s=>'<li>'+escape(s)+'</li>').join('')}</ol><h3>Before you download</h3><p>${escape(record.limits)}</p><a href="/tool-guides/${record.slug}.html">Read the full ${escape(record.name)} guide ↗</a><span> · </span><a href="/everyday-tools.html">Browse all Pocket Helper tools ↗</a></section>`;
  html=html.replace(/<section id="tool-seo-help"[\s\S]*?<\/section>/,'');html=html.replace('</main>',section+'</main>');
  if(!html.includes('href="/assets/tool-seo.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/tool-seo.css"></head>');
 }
 fs.writeFileSync(file,html);dom.window.close();
}
console.log(`Refreshed canonical public metadata for ${routes.length} pages; added crawlable help for ${newTools.length} new tools.`);
