import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const tick=()=>new Promise(r=>setTimeout(r,0));
for(const mode of ['on','off','banner-off','failure','malformed','withdraw']){
 const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'https://pockethelper.phapps.workers.dev',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.eval(readFileSync('site-config.js','utf8'));
 let policyCalls=0,bannerCalls=0,release;
 w.fetch=async url=>{
  if(url.includes('ph_ad_settings')){policyCalls++;
   if(mode==='withdraw')await new Promise(r=>release=r);
   if(mode==='failure')throw Error('offline');
   return {ok:true,json:async()=>mode==='malformed'?[]:[{enabled:mode!=='off',banner:mode!=='banner-off',social:true,popunder:true}]};
  }
  bannerCalls++;return {ok:true,text:async()=>readFileSync('adsterra-banner.html','utf8')};
 };
 w.eval(readFileSync('privacy-controls.js','utf8'));
 assert.equal(policyCalls,0);assert.equal(bannerCalls,0);
 d.querySelector('#privacy-accept').click();
 if(mode==='withdraw'){d.querySelector('#privacy-reject').click();release();}
 await tick();await tick();
 assert.equal(policyCalls,1);
 assert.equal(bannerCalls,mode==='on'?1:0);
 assert.equal(!!d.querySelector('#ad-slot iframe'),mode==='on');
 if(mode==='off')assert.match(d.querySelector('#ad-status-banner').textContent,/disabled by the site owner/);
 if(mode==='failure')assert.match(d.querySelector('#ad-status-banner').textContent,/could not verify/);
 w.close();
}
const sql=readFileSync('supabase/migrations/202611270001_ad_controls.sql','utf8');
assert.match(sql,/enable row level security/);assert.match(sql,/using \(public.ph_is_admin\(\)\) with check/);assert.match(sql,/grant update \(enabled,banner,popunder,social\).*authenticated/);
console.log('✓ Global ad policy: owner OFF, per-banner OFF, fail-closed network/schema, consent and withdrawal race');
