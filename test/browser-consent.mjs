// Optional Chromium regression test. External ads are mocked or blocked, not clicked.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/tmp/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote']});
const base=process.env.AUDIT_BASE_URL||'http://localhost:3000';
const adHost=url=>['bauval.org','abscloud.org'].includes(new URL(url).hostname);
const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
const page=await context.newPage();let requests=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
await context.route('**/*',async route=>{const url=route.request().url();if(adHost(url)){requests.push(url);await route.fulfill({status:200,contentType:'text/javascript',body:url.includes('/22/')?"const p=document.createElement('p');p.textContent='TEST SPONSOR — mock creative, not a real ad';document.body.appendChild(p);":"// Mock vendor resource; no tracking or popup behavior."});}else await route.continue()});
await page.goto(base+'/');await page.locator('#privacy-notice').waitFor({state:'visible'});assert.equal(requests.length,0);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
await page.click('#privacy-accept');await page.waitForFunction(()=>document.querySelector('#ad-status-banner').textContent.includes('script loaded'));
assert.equal(requests.length,1);assert.ok(requests[0].includes('/22/'));
assert.equal(await page.locator('#privacy-notice').isVisible(),false);
assert.equal(await page.locator('#floating-ad-preferences').isVisible(),true);
assert.equal(await page.frameLocator('#ad-slot iframe').getByText('TEST SPONSOR — mock creative, not a real ad').count(),1);
await page.reload();await page.locator('#floating-ad-preferences').waitFor();assert.equal(await page.locator('#privacy-notice').isVisible(),false);
await page.click('#floating-ad-preferences');await page.check('#allow-popunder');await page.check('#allow-social-bar');await page.click('#accept-ads');
await page.waitForFunction(()=>document.querySelector('#ad-status-popunder').textContent.startsWith('Script loaded')&&document.querySelector('#ad-status-social').textContent.startsWith('Script loaded'));
assert.ok(requests.some(x=>x.includes('/1/')));assert.ok(requests.some(x=>x.includes('/14/')));
await page.click('#floating-ad-preferences');await page.click('#reject-ads');await page.waitForFunction(()=>localStorage.getItem('pocket_ad_consent')==='rejected'&&!document.querySelector('#adsterra-popunder'));
const before=requests.length;await page.reload();await page.locator('#floating-ad-preferences').waitFor();assert.equal(requests.length,before);assert.equal(await page.locator('#ad-slot iframe').count(),0);
assert.deepEqual(errors,[]);await context.close();
// Consent must initialize even if unrelated site.js fails to load; blocked scripts get an honest status.
const isolated=await browser.newContext({serviceWorkers:'block'});await isolated.route('**/site.js*',r=>r.abort());
await isolated.route('https://bauval.org/**',r=>r.abort());const isolatedPage=await isolated.newPage();await isolatedPage.goto(base+'/');await isolatedPage.locator('#privacy-notice').waitFor({state:'visible'});await isolatedPage.click('#privacy-accept');await isolatedPage.waitForFunction(()=>document.querySelector('#ad-status-banner').textContent.includes('blocked or unreachable'));await isolated.close();
await browser.close();console.log('PASS: first visit and mobile visibility; no ad requests before consent; mock banner frame rendering; separate vendor opt-ins; returning preferences; withdrawal and reload; independent initialization; blocked-resource feedback. Real Adsterra delivery is not tested.');
