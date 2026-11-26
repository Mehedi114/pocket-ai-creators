/* Tactile desktop feedback. Never delay a click, navigation or form submission. */
(() => {
 const desktop=window.matchMedia?.('(hover: hover) and (pointer: fine)');
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const active=new Map();
 const targetFor=event=>event.target?.closest?.('button,.button,.helper-card,.tool-card,.helper-shortcuts > a');
 function pop(event){
  if(!desktop?.matches||reduced?.matches)return;
  if(event.type==='pointerdown'&&(event.button!==0||event.pointerType==='touch'))return;
  // Mouse feedback starts on press; keyboard activation starts on click.
  if(event.type==='click'&&event.detail!==0)return;
  const el=targetFor(event);
  if(!el||el.disabled||el.getAttribute('aria-disabled')==='true'||!el.animate)return;
  active.get(el)?.cancel();
  const animation=el.animate([
   {scale:'1',offset:0},
   {scale:'.965',offset:.22},
   {scale:'1.025',offset:.62},
   {scale:'1',offset:1}
  ],{duration:300,easing:'cubic-bezier(.22,.8,.35,1)'});
  active.set(el,animation);
  const clean=()=>{if(active.get(el)===animation)active.delete(el);};
  animation.onfinish=clean;animation.oncancel=clean;
 }
 document.addEventListener('pointerdown',pop,{passive:true});
 document.addEventListener('click',pop);
 const clear=()=>{for(const animation of active.values())animation.cancel();active.clear();};
 reduced?.addEventListener?.('change',clear);
 window.addEventListener('pagehide',clear);
})();
