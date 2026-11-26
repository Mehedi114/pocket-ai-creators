/* Progressive enhancement: no overlay exists if this script/CSS is unavailable.
 * Native modal dialog isolates background focus. No global site/consent changes.
 */
(() => {
 'use strict';
 const key='ph-intro-seen';
 if(!document.body.classList.contains('helper-home')||location.hash||new URLSearchParams(location.search).has('tool'))return;
 const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 if(motion?.matches||typeof HTMLDialogElement==='undefined'||!HTMLDialogElement.prototype.showModal)return;
 if(getComputedStyle(document.documentElement).getPropertyValue('--ph-intro-ready').trim()!=='1')return;
 // Prefer skipping to showing the intro repeatedly when session storage is blocked.
 try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch{return;}
 if(document.querySelector('dialog[open]'))return;
 const previousFocus=document.activeElement,previousOverflow=document.documentElement.style.overflow;
 const dialog=document.createElement('dialog');dialog.id='ph-intro';dialog.setAttribute('aria-label','Welcome to Pocket Helper');
 let autoTimer,exitTimer,safetyTimer,finished=false,closing=false;
 function cleanup(){
  if(finished)return;finished=true;
  clearTimeout(autoTimer);clearTimeout(exitTimer);clearTimeout(safetyTimer);
  motion?.removeEventListener?.('change',onMotion);window.removeEventListener('pagehide',cleanup);
  if(dialog.open)dialog.close();dialog.remove();document.documentElement.style.overflow=previousOverflow;
  if(previousFocus&&previousFocus!==document.body&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});
  else document.querySelector('.header .logo')?.focus({preventScroll:true});
 }
 function finish(immediate=false){if(finished||closing)return;closing=true;if(immediate){cleanup();return;}dialog.classList.add('ph-out');exitTimer=setTimeout(cleanup,350);}
 function onMotion(event){if(event.matches)cleanup();}
 // Safety cleanup is scheduled before any modal or scroll lock is activated.
 safetyTimer=setTimeout(cleanup,3000);
 try{
  const rx=Math.min(innerWidth*.3,250),ry=Math.min(innerHeight*.23,155);
  const items=[['▦','#e8edd8'],['▤','#e9e4f5'],['৳','#fbebd0'],['Aa','#f3ddd3'],['%','#fbebd0'],['⇄','#e8edd8']];
  const chips=items.map(([label,color],i)=>{const a=(-90+i*60)*Math.PI/180;return `<div class="ph-chip" style="--i:${i};--x:${(Math.cos(a)*rx).toFixed(1)}px;--y:${(Math.sin(a)*ry).toFixed(1)}px;background:${color}">${label}</div>`;}).join('');
  dialog.innerHTML=`<div class="ph-stage" aria-hidden="true"><div class="ph-blob ph-b1"></div><div class="ph-blob ph-b2"></div><div class="ph-center"><div class="ph-ripple"></div>${chips}</div><div class="ph-lockup"><svg class="ph-mark" viewBox="0 0 96 96" focusable="false"><rect width="96" height="96" rx="26" fill="#2d6a4f"/><rect x="26" y="24" width="13" height="54" rx="6.5" fill="#fffdf0"/><circle cx="55" cy="44" r="17" fill="none" stroke="#fffdf0" stroke-width="13"/><path d="M55 36L57.2 41.8 63 44 57.2 46.2 55 52 52.8 46.2 47 44 52.8 41.8Z" fill="#e9c46a"/></svg><div class="ph-word"><span>pocket helper<i>.</i></span></div></div><div class="ph-tag">A little help. A lighter day.</div></div><button class="ph-skip" type="button" autofocus>Skip / বাদ দিন</button>`;
  dialog.querySelector('button').addEventListener('click',()=>finish(true));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(true);});
  dialog.addEventListener('close',cleanup);
  document.body.append(dialog);dialog.showModal();document.documentElement.style.overflow='hidden';
  dialog.querySelector('button').focus({preventScroll:true});
  motion?.addEventListener?.('change',onMotion);window.addEventListener('pagehide',cleanup);
  autoTimer=setTimeout(()=>finish(),2050);
 }catch{cleanup();}
})();
