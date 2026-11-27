import {JSDOM} from 'jsdom';
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'https://pocket-helper.vercel.app',runScripts:'outside-only'});
const w=dom.window,d=w.document;
for(const file of ['language-data','language','tool-catalog','helper-home'])w.eval(readFileSync('assets/'+file+'.js','utf8'));
d.dispatchEvent(new w.Event('DOMContentLoaded'));

assert.equal(d.querySelectorAll('.helper-card').length,12);
for(const link of d.querySelectorAll('.helper-card')){
 const url=new URL(link.href);assert.ok(existsSync(url.pathname.slice(1)));
}
d.querySelector('[data-category="files"]').click();assert.equal(d.querySelectorAll('.helper-card').length,4);
d.querySelector('[data-category="all"]').click();
const search=d.querySelector('#helper-search');search.value='কিস্তি';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.helper-card').length,1);
const lang=d.querySelector('#helper-language');lang.value='bn';lang.dispatchEvent(new w.Event('change'));
assert.equal(d.querySelector('.helper-card h3').textContent,'Loan-এর হিসাব');assert.equal(w.localStorage.getItem('pocket_helper_language'),'bn');assert.equal(d.documentElement.lang,'bn');
search.value='no-such-helper';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelector('#helper-empty').hidden,false);
lang.value='en';lang.dispatchEvent(new w.Event('change'));assert.equal(d.querySelector('h1').textContent,'Welcome to your virtual working office');
assert.ok(d.querySelector('meta[name="google-site-verification"]'));assert.ok(d.title.includes('Pocket Helper'));
assert.equal(d.querySelector('#creator-name').textContent,'Md Mahedul Islam Mehedi');
assert.ok(d.querySelector('footer a[href="#creator"]'));
assert.ok(existsSync(d.querySelector('#creator img').getAttribute('src').slice(1)));
assert.match(d.querySelector('#creator').textContent,/2025–2026/);
lang.value='bn';lang.dispatchEvent(new w.Event('change'));
assert.match(d.querySelector('#creator').textContent,/ব্যবস্থাপনা বিভাগ/);
assert.ok(d.querySelector('#creator a[href="mailto:mdmahedulislammehedi@gmail.com"]'));
const whatsapp=d.querySelector('#creator a[href="https://wa.me/8801932211123"]');assert.ok(whatsapp);assert.equal(whatsapp.target,'_blank');assert.ok(whatsapp.rel.includes('noopener'));
w.PHLanguage.disconnect();w.close();console.log('✓ Helper home: links, search in Bengali, category filters, language switch and persistence');
