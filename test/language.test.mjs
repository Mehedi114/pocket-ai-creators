import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const scripts=['language-data','language'].map(f=>readFileSync('assets/'+f+'.js','utf8'));
function setup(saved='en',deny=false){
 const dom=new JSDOM('<html><body><header><a href="/">Home</a></header><main><label>Loan amount<input value="123" placeholder="Your name"></label><select id="form-option"><option>Home</option></select><textarea>Your name</textarea><div id="output">Home</div><article translate="no">Home</article><p id="dynamic">Calculate</p></main></body></html>',{url:'https://pocket-helper.vercel.app',runScripts:'outside-only'});
 const w=dom.window;if(deny)Object.defineProperty(w,'localStorage',{get(){throw new Error('denied');}});else w.localStorage.setItem('pocket_helper_language',saved);
 scripts.forEach(s=>w.eval(s));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));return dom;
}
const dom=setup(),w=dom.window,d=w.document;
for(const [lang,text,dir] of [['bn','Loan-এর পরিমাণ','ltr'],['hi','ऋण राशि','ltr'],['ur','قرض کی رقم','rtl'],['en','Loan amount','ltr']]){
 w.PHLanguage.set(lang);assert.equal(d.querySelector('main label').firstChild.data,text);assert.equal(d.documentElement.dir,dir);
 assert.equal(d.querySelector('input').value,'123');assert.equal(d.querySelector('textarea').value,'Your name');
 assert.equal(d.querySelector('#output').textContent,'Home');assert.equal(d.querySelector('article').textContent,'Home');assert.equal(d.querySelector('#form-option').value,'Home');
 assert.equal(d.querySelector('header a').getAttribute('href'),'/');
}
w.PHLanguage.set('hi');assert.equal(d.querySelector('input').placeholder,'आपका नाम');
d.querySelector('#dynamic').textContent='Download';await new Promise(r=>setTimeout(r,0));assert.equal(d.querySelector('#dynamic').textContent,'डाउनलोड करें');
w.PHLanguage.set('en');assert.equal(d.querySelector('#dynamic').textContent,'Download');
w.PHLanguage.set('bogus');assert.equal(d.documentElement.lang,'en');
w.dispatchEvent(new w.StorageEvent('storage',{key:'pocket_helper_language',newValue:'ur'}));assert.equal(d.documentElement.dir,'rtl');
w.PHLanguage.disconnect();w.close();
for(const [saved,expected,deny] of [['bn','bn',false],['ur','ur',false],['bad','en',false],['en','en',true]]){const x=setup(saved,deny);assert.equal(x.window.document.documentElement.lang,expected);x.window.PHLanguage.disconnect();x.window.close();}
for(const page of ['index.html','everyday-tools.html','creator-tools.html','studio.html','listen.html','blog.html','tool-guides/index.html','guides/write-better-hooks.html'])assert.match(readFileSync('public/'+page,'utf8'),/assets\/language.js/);
for(const page of ['admin.html','adsterra-banner.html'])assert.doesNotMatch(readFileSync('public/'+page,'utf8'),/assets\/language.js/);
console.log('✓ Shared UI languages: persistence, RTL reversal, dynamic labels, input/option/content safety and public-page export');
