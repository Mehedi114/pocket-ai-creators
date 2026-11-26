import {JSDOM} from 'jsdom';
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'https://pocket-helper.vercel.app',runScripts:'outside-only'});
const w=dom.window,d=w.document;
w.eval(readFileSync('assets/helper-home.js','utf8'));
assert.equal(d.querySelectorAll('.helper-card').length,8);
for(const link of d.querySelectorAll('.helper-card')){
 const url=new URL(link.href);assert.ok(existsSync(url.pathname.slice(1)));assert.ok(url.hash);
}
d.querySelector('[data-category="files"]').click();assert.equal(d.querySelectorAll('.helper-card').length,2);
d.querySelector('[data-category="all"]').click();
const search=d.querySelector('#helper-search');search.value='ঋণ';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.helper-card').length,1);
const lang=d.querySelector('#helper-language');lang.value='bn';lang.dispatchEvent(new w.Event('change'));
assert.equal(d.querySelector('.helper-card h3').textContent,'ঋণের হিসাব');assert.equal(w.localStorage.getItem('pocket_helper_language'),'bn');assert.equal(d.querySelector('h1').lang,'bn');
search.value='no-such-helper';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelector('#helper-empty').hidden,false);
lang.value='en';lang.dispatchEvent(new w.Event('change'));assert.equal(d.querySelector('h1').textContent,'Make yourself at home.');
assert.ok(d.querySelector('meta[name="google-site-verification"]'));assert.ok(d.title.includes('Pocket Helper'));
assert.equal(d.querySelector('#creator-name').textContent,'Md Mahedul Islam Mehedi');
assert.ok(d.querySelector('footer a[href="#creator"]'));
assert.ok(existsSync(d.querySelector('#creator img').getAttribute('src').slice(1)));
assert.match(d.querySelector('#creator').textContent,/2025–2026/);
lang.value='bn';lang.dispatchEvent(new w.Event('change'));
assert.match(d.querySelector('#creator').textContent,/ব্যবস্থাপনা বিভাগ/);
assert.ok(d.querySelector('#creator a[href="mailto:mdmahedulislammehedi@gmail.com"]'));
const whatsapp=d.querySelector('#creator a[href="https://wa.me/8801932211123"]');assert.ok(whatsapp);assert.equal(whatsapp.target,'_blank');assert.ok(whatsapp.rel.includes('noopener'));
w.close();console.log('✓ Helper home: links, search in Bengali, category filters, language switch and persistence');
