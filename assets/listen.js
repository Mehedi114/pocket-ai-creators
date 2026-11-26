/* One player, no autoplay, no upload endpoint and no third-party ad scripts. */
(async () => {
 'use strict';
 const $=s=>document.querySelector(s), audio=$('#weekly-audio');if(!audio)return;
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
 const https=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
 const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
 let raw=Array.isArray(window.POCKET_AUDIO_EPISODES)?window.POCKET_AUDIO_EPISODES:[];
 if(window.POCKET_CMS_FEED){try{raw=[...raw,...await window.POCKET_CMS_FEED];}catch{$('#catalog-status').textContent='Published episodes could not load. Check your connection and reload. Private preview is still available.';}}
 const ids=new Set();
 const episodes=raw.filter(e=>{
  const valid=e&&typeof e.id==='string'&&/^[a-z0-9-]{1,80}$/.test(e.id)&&!ids.has(e.id)&&typeof e.title==='string'&&e.title.trim()&&typeof e.summary==='string'&&typeof e.topic==='string'&&validDate(e.published)&&validDate(e.weekStart)&&validDate(e.weekEnd)&&e.weekStart<=e.weekEnd&&(https(e.audioUrl)||(typeof e.audioPath==='string'&&typeof window.POCKET_CMS_MEDIA==='function'))&&e.reviewed===true&&typeof e.reviewedBy==='string'&&e.reviewedBy.trim()&&e.rightsConfirmed===true&&Array.isArray(e.sources)&&e.sources.length>0&&e.sources.every(s=>s&&typeof s.title==='string'&&s.title.trim()&&https(s.url));
  if(valid)ids.add(e.id);return valid;
 }).sort((a,b)=>b.published.localeCompare(a.published));
 let current=null,objectURL=null,lastSaved=0;
 const readProgress=id=>{try{const n=Number(localStorage.getItem('pocket_audio_position_'+id));return Number.isFinite(n)&&n>0?n:0;}catch{return 0;}};
 function saveProgress(){if(!current||current.local||!Number.isFinite(audio.currentTime))return;try{localStorage.setItem('pocket_audio_position_'+current.id,String(audio.ended?0:audio.currentTime));}catch{}}
 function stop(){saveProgress();audio.pause();audio.removeAttribute('src');audio.load();if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null;}current=null;}
 function sourceNotes(e){
  const wrap=$('#episode-notes');wrap.replaceChildren();if(e.local)return;
  wrap.append(node('h3','উৎস ও যাচাই'),node('p',`সময়কাল: ${e.weekStart} — ${e.weekEnd} · প্রকাশ: ${e.published}`),node('p',`AI-assisted audio · Reviewed by ${e.reviewedBy}`));
  const list=node('ul');for(const source of e.sources){const li=node('li'),link=node('a',source.title+' ↗');link.href=https(source.url);link.target='_blank';link.rel='noopener noreferrer';li.append(link);list.append(li);}wrap.append(list);
  if(e.slidesPath){const b=node('button','PDF slides খুলুন ↗');b.type='button';b.addEventListener('click',async()=>{b.disabled=true;try{const url=await window.POCKET_CMS_MEDIA(e.slidesPath);if(current!==e)return;const a=node('a','Open slides (link valid for 60 seconds) ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';wrap.append(a);}catch{$('#audio-status').textContent='Slides unavailable. Try again.';}finally{b.disabled=false;}});wrap.append(b);}
  if(typeof e.transcript==='string'&&e.transcript.trim()){const details=node('details'),text=node('p',e.transcript);text.className='transcript-text';details.append(node('summary','Transcript / পড়ার নোট'),text);wrap.append(details);}
 }
 async function select(e){
  stop();current=e;lastSaved=0;
  if(e.local){objectURL=URL.createObjectURL(e.file);audio.src=objectURL;}else if(e.audioPath){try{const url=await window.POCKET_CMS_MEDIA(e.audioPath);if(current!==e)return;audio.src=url;}catch{if(current===e){$('#audio-status').textContent='Audio link unavailable. Reopen the episode to retry.';$('#audio-player').hidden=false;}return;}}else audio.src=https(e.audioUrl);
  audio.playbackRate=Number($('#audio-speed').value);$('#playing-title').textContent=e.title;$('#playing-description').textContent=e.summary;
  $('#playing-kind').textContent=e.local?'PRIVATE PREVIEW · NOT PUBLISHED':'NOW LISTENING · AI-ASSISTED';
  $('#audio-status').textContent='শুরু করতে player-এর Play চাপুন।';$('#audio-player').hidden=false;sourceNotes(e);audio.load();
  $('#audio-player').scrollIntoView?.({behavior:'smooth',block:'nearest'});
 }
 function render(){
  const query=$('#episode-search').value.trim().toLowerCase(),topic=$('#episode-topic').value;
  const matches=episodes.filter(e=>(topic==='all'||e.topic===topic)&&[e.title,e.summary,e.topic,e.weekStart,e.weekEnd].join(' ').toLowerCase().includes(query));
  const list=$('#episode-list');list.replaceChildren();
  for(const e of matches){const card=node('article',undefined,'episode-card');card.append(node('span',e.topic+' · '+e.weekStart+' — '+e.weekEnd,'episode-meta'),node('h3',e.title),node('p',e.summary));
   const button=node('button','শোনার player খুলুন →','button primary');button.type='button';button.addEventListener('click',()=>select(e));card.append(button);if(readProgress(e.id)>0)card.append(node('small','আগের শোনার অবস্থান রাখা আছে'));list.append(card);
  }
  $('#episode-count').textContent=episodes.length.toLocaleString('bn-BD')+'টি প্রকাশিত এপিসোড';$('#episode-empty').hidden=matches.length>0;
  $('#episode-empty h3').textContent=episodes.length?'এই খোঁজে কোনো এপিসোড নেই':'প্রথম অডিও আসার অপেক্ষায়';
  $('#episode-empty p').textContent=episodes.length?'অন্য শব্দ বা বিষয় দিয়ে আবার খুঁজুন।':'এখনো কোনো এপিসোড প্রকাশিত হয়নি। প্রকাশ হলে অডিও, সপ্তাহের তারিখ এবং মূল উৎস এখানে পাওয়া যাবে।';
 }
 for(const topic of [...new Set(episodes.map(e=>e.topic))]){const option=node('option',topic);option.value=topic;$('#episode-topic').append(option);}
 if(raw.length!==episodes.length)$('#catalog-status').textContent='কিছু episode-এর তথ্য অসম্পূর্ণ, তাই প্রকাশিত তালিকায় দেখানো হয়নি।';
 $('#episode-search').addEventListener('input',render);$('#episode-topic').addEventListener('change',render);
 $('#audio-file').addEventListener('change',()=>{
  const file=$('#audio-file').files?.[0];if(!file)return;
  if(!/\.(mp3|m4a|wav|ogg|oga|aac|flac|webm)$/i.test(file.name)&&!file.type.startsWith('audio/')){$('#file-status').textContent='অনুগ্রহ করে একটি audio file বেছে নিন।';return;}
  if(file.size>150*1024*1024){$('#file-status').textContent='Preview-এর জন্য সর্বোচ্চ 150 MB file বেছে নিন।';return;}
  $('#file-status').textContent='শুধু এই device-এ preview হচ্ছে। Upload বা publish হয়নি।';
  select({local:true,title:file.name,summary:'নিজের তৈরি audio পরীক্ষা করুন। Browser ভেদে format support আলাদা হতে পারে।',file});
 });
 audio.addEventListener('loadedmetadata',()=>{if(!current)return;const position=current.local?0:readProgress(current.id);if(position&&Number.isFinite(audio.duration)&&position<audio.duration-2){audio.currentTime=position;$('#audio-status').textContent='আগের শোনার জায়গা থেকে প্রস্তুত। Play চাপুন।';}audio.playbackRate=Number($('#audio-speed').value);});
 audio.addEventListener('timeupdate',()=>{const now=Date.now();if(now-lastSaved>5000){saveProgress();lastSaved=now;}});
 audio.addEventListener('pause',saveProgress);audio.addEventListener('ended',()=>{saveProgress();$('#audio-status').textContent='শোনা শেষ। মূল উৎসে আরও পড়তে পারেন।';render();});
 audio.addEventListener('playing',()=>{$('#audio-status').textContent='চলছে…';});
 audio.addEventListener('waiting',()=>{$('#audio-status').textContent='অডিও লোড হচ্ছে…';});
 audio.addEventListener('error',()=>{if(current)$('#audio-status').textContent='অডিও চালানো যায়নি। সংযোগ, file link বা browser-এর format support পরীক্ষা করুন।';});
 $('#audio-speed').addEventListener('change',()=>{audio.playbackRate=Number($('#audio-speed').value);});
 function seek(delta){if(!current||!Number.isFinite(audio.duration))return;audio.currentTime=Math.max(0,Math.min(audio.duration,audio.currentTime+delta));saveProgress();}
 $('#audio-back').addEventListener('click',()=>seek(-15));$('#audio-forward').addEventListener('click',()=>seek(15));
 $('#close-player').addEventListener('click',()=>{stop();$('#audio-player').hidden=true;render();});
 window.addEventListener('pagehide',saveProgress);render();
})();
