/* Shared, local-only UI translation. Never sends inputs/content to a service. */
(() => {
 'use strict';
 if(window.PHLanguage)return;
 const supported=['en','bn','hi','ur'],tags={en:'en',bn:'bn',hi:'hi',ur:'ur'};
 const names={en:'English',bn:'বাংলা + English',hi:'हिन्दी',ur:'اردو'};
 const rows=new Map(),extraAliases={};
 for(const line of (window.PH_LANGUAGE_ROWS||'').trim().split('\n')){
  const parts=line.split('|');if(parts.length===5){const original=parts.shift();extraAliases[original]=parts[0];}if(parts.length!==4)continue;
  rows.set(parts[0],parts);
 }
 const aliases={'শুনে শিখি':'Listen','All / সব':'All','Everyday / দৈনন্দিন':'Everyday','Files / ফাইল':'Files','Money / হিসাব':'Money','Writing / লেখা':'Writing','No matching helpers. Try PDF, QR or loan / অন্য নামে খুঁজে দেখুন।':'No matching helpers. Try PDF, QR or loan.'};
 const protectedSelector='script,style,noscript,textarea,pre,code,[contenteditable],[translate="no"],.notranslate,.logo,#tool-result,#utility-result,#advanced-result,#utility-output,#advanced-output,#output,.prose,#blog-article,.blog-card h2,.blog-card p,.blog-card small,.episode-card h3,.episode-card p,.episode-meta,#playing-title,#playing-description,#source-notes,#episode-transcript,#episode-notes,#pdf-file-list';
 let language='en';try{const saved=localStorage.getItem('pocket_helper_language');if(supported.includes(saved))language=saved;}catch{}
 const sources=new WeakMap(),attributes=new WeakMap();let observer;
 function t(text){const key=extraAliases[text]||aliases[text]||text;return rows.get(key)?.[supported.indexOf(language)]||key;}
 function ignore(el){return !el||Boolean(el.closest(protectedSelector));}
 function text(node){
  if(ignore(node.parentElement))return;
  let record=sources.get(node);
  if(!record||node.data!==record.rendered){record={original:node.data};sources.set(node,record);}
  const key=record.original.trim();if(!key)return;
  const value=record.original.replace(key,t(key));
  record.rendered=value;if(node.data!==value)node.data=value;
 }
 function attr(el,name){
  if(!el.hasAttribute(name))return;
  let record=attributes.get(el);if(!record){record={};attributes.set(el,record);}
  const current=el.getAttribute(name);let item=record[name];
  if(!item||current!==item.rendered)item=record[name]={original:current};
  item.rendered=t(item.original);if(current!==item.rendered)el.setAttribute(name,item.rendered);
 }
 function translate(root=document.body){
  if(!root)return;
  if(root.nodeType===3){text(root);return;}
  if(root.nodeType!==1||ignore(root))return;
  // Never let translated option text change submitted values.
  const elements=[root,...root.querySelectorAll('*')];
  for(const el of elements){
   if(ignore(el)&&!(el.matches('textarea')&&!el.closest('[translate="no"],[contenteditable]')))continue;
   if(el.tagName==='OPTION'&&!el.hasAttribute('value'))el.setAttribute('value',el.textContent);
   for(const name of ['placeholder','aria-label','title'])attr(el,name);
  }
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walk.nextNode())text(walk.currentNode);
 }
 function observe(){if(!window.document?.body)return;observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});}
 function apply(){
  observer?.disconnect();
  document.documentElement.lang=tags[language];document.documentElement.dir=language==='ur'?'rtl':'ltr';
  document.querySelectorAll('[data-ph-language],#helper-language').forEach(s=>{s.value=language;});
  translate();observe();
 }
 function set(value){
  if(!supported.includes(value))value='en';language=value;
  try{localStorage.setItem('pocket_helper_language',value);}catch{}
  apply();window.dispatchEvent(new CustomEvent('ph-language-change',{detail:{language:value,tag:tags[value]}}));
 }
 window.PHLanguage={t,set,apply,disconnect:()=>observer?.disconnect(),get language(){return language;},get tag(){return tags[language];}};
 function init(){
  // Legacy dashboard copy becomes canonical English; one engine owns all locales.
  document.querySelectorAll('[data-en][data-bn]').forEach(el=>{el.textContent=el.dataset.en;el.removeAttribute('lang');});
  let selector=document.querySelector('#helper-language');
  if(!selector){
   const host=document.querySelector('header')||document.body;
   const label=document.createElement('label');label.className='ph-language-control';
   const title=document.createElement('span');title.textContent='Language';
   selector=document.createElement('select');selector.id='ph-language';selector.setAttribute('aria-label','Language');
   label.append(title,selector);host.append(label);
  }
  selector.setAttribute('data-ph-language','');selector.setAttribute('translate','no');selector.replaceChildren();
  for(const code of supported){const option=document.createElement('option');option.value=code;option.textContent=names[code];option.lang=tags[code];selector.append(option);}
  // Explicitly mark this first rollout as a preview, not complete localization.
  const note=document.createElement('small');note.className='ph-language-note';note.setAttribute('translate','no');note.textContent='UI languages · Preview';note.title='Some interface text and guides are still in English. Published content stays in its original language.';selector.parentElement.append(note);
  selector.addEventListener('change',()=>set(selector.value));
  observer=new MutationObserver(records=>{
   observer.disconnect();
   const roots=new Set();for(const r of records){if(r.type==='childList')r.addedNodes.forEach(n=>roots.add(n));else roots.add(r.target);}
   roots.forEach(translate);observe();
  });
  apply();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 window.addEventListener('storage',event=>{if(event.key==='pocket_helper_language')set(event.newValue||'en');});
})();
