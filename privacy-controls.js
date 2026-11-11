/* Homepage advertising only. No vendor requests before explicit consent.
 * Kept separate from site.js so unrelated tool/UI failures cannot hide consent.
 */
(() => {
 'use strict';
 const $ = selector => document.querySelector(selector);
 if (!$('#ad-slot') || !$('#consent-dialog')) return;
 const config = window.POCKET_SITE || {};
 const keys = {banner:'pocket_ad_consent',popunder:'pocket_popunder_consent',social:'pocket_social_bar_consent'};
 const session = {};
 const state = {banner:'Waiting for your choice.',popunder:'Separate permission required.',social:'Separate permission required.'};
 let loading = false, mounted = false, revision = 0, frame = null, frameToken = '', bannerTimer;
 const vendorScripts = new Map();
 const vendorTimers = new Map();
 function preference(kind) {
  if (Object.hasOwn(session,kind)) return session[kind];
  try { const value=localStorage.getItem(keys[kind]); return ['accepted','rejected'].includes(value)?value:null; }
  catch { return null; }
 }
 function store(kind,value) { session[kind]=value;try {localStorage.setItem(keys[kind],value);} catch {} }
 function status(kind,message) {
  state[kind]=message;
  const el=$('#ad-status-'+kind);if(el)el.textContent=message;
 }
 function refreshChoice() {
  const consent=preference('banner');
  $('#privacy-notice').hidden=consent!==null;
  $('#floating-ad-preferences').hidden=consent===null;
  $('#ad-consent-summary').textContent=consent==='accepted'
   ? 'Banner permission is on. Script loading does not guarantee an ad impression.'
   : consent==='rejected'?'Advertising is off by your choice. You can change this in Ad settings.'
   : 'Ads are paused until you make a choice. Core tools work without ads.';
  if(consent!=='accepted') {
   status('banner',consent==='rejected'?'Off — permission declined.':'Waiting for advertising permission.');
   status('popunder','Off — separate permission required.');
   status('social','Off — separate permission required.');
  }
 }
 function openPreferences() {
  $('#allow-popunder').checked=preference('popunder')==='accepted';
  $('#allow-social-bar').checked=preference('social')==='accepted';
  if(!$('#consent-dialog').open)$('#consent-dialog').showModal();
 }
 function clearBanner() {
  clearTimeout(bannerTimer);frame=null;frameToken='';mounted=false;
  $('#ad-slot').replaceChildren();
  const p=document.createElement('p');p.className='ad-placeholder';
  p.textContent='Sponsored space · Advertising is paused. Use Ad settings to choose your preference.';
  $('#ad-slot').append(p);
 }
 function mountBanner(html,width,height) {
  frame=document.createElement('iframe');
  frame.title='Advertisement';frame.width=width;frame.height=height;
  frame.style.border='0';frame.style.flexShrink='0';
  frame.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');
  frameToken=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
  // Only report resource events, not ad impressions. Vendor code stays isolated.
  const doc=new DOMParser().parseFromString(html,'text/html');
  const observer=doc.createElement('script');
  observer.textContent=`(() => {const token=${JSON.stringify(frameToken)};const notify=state=>parent.postMessage({type:'pocket-banner-resource',token,state},'*');for(const type of ['load','error'])document.addEventListener(type,e=>{if(e.target?.tagName==='SCRIPT'&&e.target.src)notify(type);},true);})();`;
  doc.head.prepend(observer);
  frame.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;
  $('#ad-slot').replaceChildren(frame);mounted=true;
  status('banner','Loading banner script…');
  bannerTimer=setTimeout(()=>{if(mounted&&state.banner==='Loading banner script…')status('banner','No script response confirmed. Check network/ad blocking and the approved domain.');},15000);
 }
 window.addEventListener('message',event=>{
  if(!frame||event.source!==frame.contentWindow||event.data?.type!=='pocket-banner-resource'||event.data.token!==frameToken||preference('banner')!=='accepted')return;
  if(event.data.state==='error') {clearTimeout(bannerTimer);status('banner','Banner script blocked or unreachable. Ad delivery is not confirmed.');}
  else if(event.data.state==='load'&&!state.banner.includes('blocked')) {clearTimeout(bannerTimer);status('banner','Banner script loaded. Ad delivery/impressions are not verified.');}
 });
 function fallbackBanner() {
  const ad=config.adsterra;let url;
  try {url=new URL(ad?.scriptUrl);if(url.protocol!=='https:'||!ad?.key)return false;} catch {return false;}
  const width=Math.max(1,Math.min(1200,Number(ad.width)||728)),height=Math.max(1,Math.min(600,Number(ad.height)||90));
  const options=JSON.stringify({key:ad.key,format:'iframe',width,height,params:{}}).replace(/</g,'\\u003c');
  const src=JSON.stringify(url.href).replace(/</g,'\\u003c');
  mountBanner(`<html><head></head><body style="margin:0"><script>window.atOptions=${options};const s=document.createElement('script');s.src=${src};document.body.appendChild(s);<\/script></body></html>`,width,height);return true;
 }
 async function loadBanner() {
  if(loading||mounted||preference('banner')!=='accepted')return;
  loading=true;const requestRevision=revision;
  status('banner','Reading banner configuration…');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try {
   const response=await fetch('/adsterra-banner.html',{cache:'no-store',signal:controller.signal});
   if(!response.ok)throw new Error('Banner file unavailable');
   const html=await response.text();
   if(requestRevision!==revision||preference('banner')!=='accepted')return;
   const doc=new DOMParser().parseFromString(html,'text/html');
   if(!doc.querySelector('script,iframe')) {
    if(!fallbackBanner())status('banner','No banner embed configured. The site owner needs to add its publisher code.');
    return;
   }
   const text=[...doc.querySelectorAll('script')].map(s=>s.textContent).join('\n');
   const size=(key,fallback,max)=>{const match=text.match(new RegExp("['\"]?"+key+"['\"]?\\s*:\\s*(\\d+)",'i'));return match?Math.max(1,Math.min(max,Number(match[1]))):fallback;};
   mountBanner(html,size('width',728,1200),size('height',90,600));
  } catch {
   if(requestRevision===revision&&preference('banner')==='accepted'&&!fallbackBanner())status('banner','Could not read banner configuration. Check the deployment or connection.');
  } finally {
   clearTimeout(timer);loading=false;
   // A reject/accept while an old request was pending must start a fresh request.
   if(requestRevision!==revision&&preference('banner')==='accepted'&&!mounted)void loadBanner();
  }
 }
 function loadVendor(kind,urlValue,id) {
  if(preference('banner')!=='accepted'||preference(kind)!=='accepted')return;
  if(vendorScripts.has(kind))return;
  let url;try{url=new URL(urlValue);if(url.protocol!=='https:')throw new Error();}catch{status(kind,'No valid HTTPS publisher script configured.');return;}
  const script=document.createElement('script');script.id=id;script.src=url.href;script.setAttribute('data-cfasync','false');
  vendorScripts.set(kind,script);status(kind,'Loading publisher script…');
  script.onload=()=>{clearTimeout(vendorTimers.get(kind));if(preference(kind)==='accepted')status(kind,'Script loaded. Display depends on the provider and browser; impressions unverified.');};
  script.onerror=()=>{clearTimeout(vendorTimers.get(kind));if(preference('banner')==='accepted'&&preference(kind)==='accepted')status(kind,'Script blocked or unreachable. Ad delivery is not confirmed.');};
  vendorTimers.set(kind,setTimeout(()=>{if(state[kind]==='Loading publisher script…')status(kind,'No script response confirmed. It may be blocked or unavailable.');},15000));
  document.body.appendChild(script);
 }
 function loadAll() {
  void loadBanner();loadVendor('popunder',config.popunderScriptUrl,'adsterra-popunder');loadVendor('social',config.socialBarScriptUrl,'adsterra-social-bar');
 }
 function saveChoice(value,popunder=false,social=false) {
  revision++;
  const reload=[['popunder',popunder],['social',social]].some(([kind,allow])=>vendorScripts.has(kind)&&(value!=='accepted'||!allow));
  store('banner',value);store('popunder',value==='accepted'&&popunder?'accepted':'rejected');store('social',value==='accepted'&&social?'accepted':'rejected');
  $('#consent-dialog').close();refreshChoice();
  if(value!=='accepted')clearBanner();
  if(reload) {
   for(const script of vendorScripts.values())script.remove();
   for(const timer of vendorTimers.values())clearTimeout(timer);
   // Removing a tag cannot undo vendor handlers; reload stops in-page vendor code.
   window.PocketAds.reload();return;
  }
  if(!popunder)status('popunder','Off — separate permission required.');
  if(!social)status('social','Off — separate permission required.');
  if(value==='accepted')loadAll();
 }
 window.PocketAds={loadBanner,openPreferences,reload:()=>window.location.reload()};
 ['#ad-preferences','#footer-ad-preferences','#floating-ad-preferences','#privacy-customize'].forEach(selector=>$(selector)?.addEventListener('click',openPreferences));
 $('#consent-dialog .dialog-close').onclick=()=>$('#consent-dialog').close();
 $('#accept-ads').onclick=()=>saveChoice('accepted',$('#allow-popunder').checked,$('#allow-social-bar').checked);
 $('#reject-ads').onclick=()=>saveChoice('rejected');
 $('#privacy-accept').onclick=()=>saveChoice('accepted');
 $('#privacy-reject').onclick=()=>saveChoice('rejected');
 refreshChoice();loadAll();
})();
