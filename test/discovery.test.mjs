import {JSDOM} from 'jsdom';
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const cases=[['bg remove','/remove-background.html'],['ছবির background','/remove-background.html'],['দাগ','/face-retouch.html'],['passport','/photo-desk.html'],['অ্যাসাইনমেন্ট','/assignment-cover.html']];
for(const page of ['index.html','everyday-tools.html']){
 const dom=new JSDOM(readFileSync(page,'utf8'),{url:'https://pocket-helper.vercel.app/'+page,runScripts:'outside-only'}),w=dom.window,d=w.document;
 if(page==='index.html')for(const s of ['tool-catalog','helper-home'])w.eval(readFileSync('assets/'+s+'.js','utf8'));else w.eval(readFileSync('assets/everyday-tools.bundle.js','utf8'));
 const input=d.querySelector(page==='index.html'?'#helper-search':'#utility-search'),selector=page==='index.html'?'.helper-card':'#utilities-grid .tool-card';
 const first=[...d.querySelectorAll(selector)].slice(0,4).map(a=>a.getAttribute('href'));assert.deepEqual(first,['/remove-background.html','/face-retouch.html','/photo-desk.html','/assignment-cover.html']);
 // Typing a new search escapes a stale category instead of hiding matching tools.
 d.querySelector(page==='index.html'?'[data-category="student"]':'[data-category="Student"]').click();
 for(const [query,path] of cases){input.value=query;input.dispatchEvent(new w.Event('input'));assert.ok([...d.querySelectorAll(selector)].some(a=>a.getAttribute('href')===path),page+' missing '+query);}
 input.value='';input.dispatchEvent(new w.Event('input'));
 if(page==='everyday-tools.html')assert.equal(d.querySelectorAll(selector).length,41);
 for(const a of d.querySelectorAll(selector)){const url=new URL(a.href);assert.ok(existsSync(url.pathname==='/'?'index.html':url.pathname.slice(1)));assert.ok(!a.href.includes('undefined'));}
 dom.window.close();
}
console.log('✓ Discovery: first four new tools, Bengali/English task searches, category recovery and valid destinations on home and All Tools');
