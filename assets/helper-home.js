/* Dashboard filtering; shared language.js owns UI copy and locale persistence. */
(() => {
 const grid=document.querySelector('#helper-grid');if(!grid)return;
 const groups={Photo:'photo',Student:'student',Files:'files',Writing:'writing',Finance:'money',Everyday:'daily',AI:'ai',Creators:'creators',Marketing:'marketing',Developer:'developer'};
 const featured=['remove-background','face-retouch','passport-photo','assignment-cover','qr','pdf-merge','loan','image','words','percent','units','password'];
 const entries=(window.POCKET_TOOL_CATALOG||[]).map(t=>[t.id,t.id==='loan'?'Loan calculator':t.name,t.keywords||'',t.desc,'',groups[t.category]||'daily',t.icon,t.href]);
 let category='all';
 const search=document.querySelector('#helper-search');
 const tr=text=>window.PHLanguage?.t(text)||text;
 function render(){
  const query=search.value.trim().toLowerCase();
  const found=entries.filter(e=>(category==='all'||e[5]===category)&&query.split(/\s+/).every(word=>[...e.slice(0,6),tr(e[1]),tr(e[3])].join(' ').toLowerCase().includes(word)));
  const matches=!query&&category==='all'?featured.map(id=>entries.find(e=>e[0]===id)).filter(Boolean):found;
  document.querySelector('#helper-count').textContent=query||category!=='all'?`${matches.length} tools found`:`${entries.length} tools · popular picks below`;
  grid.replaceChildren();
  matches.forEach(e=>{
   const link=document.createElement('a');link.className='helper-card helper-'+e[5];link.href=e[7];link.lang=window.PHLanguage?.tag||'en';
   const icon=document.createElement('span');icon.className='helper-card-icon';icon.textContent=e[6];icon.setAttribute('aria-hidden','true');
   const title=document.createElement('h3');title.textContent=e[1];
   const desc=document.createElement('p');desc.textContent=e[3];
   const action=document.createElement('span');action.className='helper-card-action';action.textContent='Open helper ↗';
   link.append(icon,title,desc,action);grid.append(link);
  });
  document.querySelector('#helper-empty').hidden=matches.length!==0;
 }
 window.addEventListener('ph-language-change',()=>{render();window.PHLanguage?.apply();});
 search.addEventListener('input',()=>{category='all';document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category==='all')));render();});
 document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
 render();
})();
