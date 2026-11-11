import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('index.html','utf8');
const code=readFileSync('privacy-controls.js','utf8');
const embed=readFileSync('adsterra-banner.html','utf8');
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup({saved=null,storageBlocked=false}={}){
 const dom=new JSDOM(html,{url:'https://example.com',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
 if(saved)w.localStorage.setItem('pocket_ad_consent',saved);
 if(storageBlocked)Object.defineProperty(w,'localStorage',{get(){throw new Error('Storage denied')}});
 w.eval(readFileSync('site-config.js','utf8'));
 const calls=[];w.fetch=async(...args)=>{calls.push(args);return {ok:true,text:async()=>embed}};
 // Do not initialize site.js: advertising controls must survive unrelated UI failures.
 w.eval(code);
 return {w,d,calls,click:s=>d.querySelector(s).click()};
}
{
 const {w,d,calls,click}=setup();
 assert.equal(d.querySelector('#privacy-notice').hidden,false);
 assert.equal(calls.length,0);assert.equal(d.querySelectorAll('script[src^="https://"]').length,0);
 click('#privacy-customize');assert.equal(d.querySelector('#consent-dialog').open,true);
 assert.equal(d.querySelector('#allow-popunder').checked,false);
 click('#consent-dialog .dialog-close');assert.equal(d.querySelector('#privacy-notice').hidden,false);
 click('#privacy-accept');await tick();
 assert.equal(d.querySelector('#privacy-notice').hidden,true);
 assert.equal(d.querySelector('#floating-ad-preferences').hidden,false);
 const frame=d.querySelector('#ad-slot iframe');assert.equal(frame.width,'300');assert.equal(frame.height,'250');
 assert.equal(d.querySelector('#adsterra-popunder'),null);assert.equal(d.querySelector('#adsterra-social-bar'),null);
 assert.match(d.querySelector('#ad-status-banner').textContent,/Loading banner script/);
 const token=frame.srcdoc.match(/const token=("[^"]+")/);assert.ok(token);
 const data={type:'pocket-banner-resource',token:JSON.parse(token[1]),state:'load'};
 w.dispatchEvent(new w.MessageEvent('message',{source:w,data}));assert.match(d.querySelector('#ad-status-banner').textContent,/Loading/);
 w.dispatchEvent(new w.MessageEvent('message',{source:frame.contentWindow,data}));assert.match(d.querySelector('#ad-status-banner').textContent,/impressions are not verified/);
 w.dispatchEvent(new w.MessageEvent('message',{source:frame.contentWindow,data:{...data,state:'error'}}));assert.match(d.querySelector('#ad-status-banner').textContent,/blocked or unreachable/);
 click('#floating-ad-preferences');click('#reject-ads');assert.equal(d.querySelector('#ad-slot iframe'),null);
 assert.equal(w.localStorage.getItem('pocket_ad_consent'),'rejected');
 w.close();
}
{
 const {w,d,calls}=setup({saved:'rejected'});assert.equal(d.querySelector('#privacy-notice').hidden,true);assert.equal(d.querySelector('#floating-ad-preferences').hidden,false);assert.equal(calls.length,0);w.close();
}
{
 const {w,d,calls}=setup({saved:'accepted'});await tick();assert.equal(d.querySelector('#privacy-notice').hidden,true);assert.equal(calls.length,1);assert.ok(d.querySelector('#ad-slot iframe'));w.close();
}
{
 const {w,d,calls,click}=setup({storageBlocked:true});click('#privacy-accept');await tick();assert.equal(calls.length,1);assert.ok(d.querySelector('#ad-slot iframe'));click('#floating-ad-preferences');click('#reject-ads');assert.equal(d.querySelector('#ad-slot iframe'),null);w.close();
}
{
 const {w,d,click}=setup();click('#privacy-customize');d.querySelector('#allow-popunder').checked=true;d.querySelector('#allow-social-bar').checked=true;click('#accept-ads');await tick();
 d.querySelector('#adsterra-social-bar').dispatchEvent(new w.Event('error'));assert.match(d.querySelector('#ad-status-social').textContent,/blocked or unreachable/);
 d.querySelector('#adsterra-popunder').dispatchEvent(new w.Event('load'));assert.match(d.querySelector('#ad-status-popunder').textContent,/impressions unverified/);
 let reload=0;w.PocketAds.reload=()=>reload++;click('#floating-ad-preferences');click('#reject-ads');assert.equal(reload,1);assert.equal(d.querySelector('#adsterra-popunder'),null);assert.equal(d.querySelector('#adsterra-social-bar'),null);w.close();
}
console.log('✓ First-visit consent, independent initialization, opt-in-only requests, persistent rejection, blocked storage, resource diagnostics and withdrawal');
