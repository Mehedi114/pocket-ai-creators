/* Bilingual dashboard only. Existing tool forms retain their own language. */
(() => {
 const grid=document.querySelector('#helper-grid');if(!grid)return;
 const entries=[
 ['qr','QR code maker','QR কোড তৈরি','Turn a link into a scannable code.','লিংক থেকে QR কোড তৈরি করুন।','daily','▦','/everyday-tools.html#qr'],
 ['pdf','Merge PDFs','PDF একত্র করুন','Bring your documents together.','একাধিক PDF এক ফাইলে রাখুন।','files','▤','/creator-tools.html#pdf-merge'],
 ['loan','Loan calculator','ঋণের হিসাব','Plan your monthly repayments.','মাসিক কিস্তির আনুমানিক হিসাব।','money','৳','/creator-tools.html#loan'],
 ['image','Image converter','ছবি রূপান্তর','Make a WebP or AVIF image.','ছবিকে WebP বা AVIF করুন।','files','◈','/creator-tools.html#image'],
 ['words','Word counter','শব্দ গণনা','A little clarity for your writing.','লেখার শব্দ ও অক্ষর গুনুন।','writing','Aa','/everyday-tools.html#words'],
 ['percent','Percentage calculator','শতাংশের হিসাব','Work out percentages and changes.','শতাংশ ও পরিবর্তনের হিসাব করুন।','money','%','/everyday-tools.html#percent'],
 ['units','Unit converter','একক রূপান্তর','Length, weight and temperature.','দৈর্ঘ্য, ওজন ও তাপমাত্রা।','daily','⇄','/everyday-tools.html#units'],
 ['password','Password generator','পাসওয়ার্ড তৈরি','Create a strong random password.','এলোমেলো শক্তিশালী পাসওয়ার্ড বানান।','daily','✳','/everyday-tools.html#password']
 ];
 let language='en',category='all';
 try{if(localStorage.getItem('pocket_helper_language')==='bn')language='bn';}catch{}
 const selector=document.querySelector('#helper-language'),search=document.querySelector('#helper-search');
 function render(){
  const query=search.value.trim().toLowerCase();
  const matches=entries.filter(e=>(category==='all'||e[5]===category)&&e.slice(0,6).join(' ').toLowerCase().includes(query));
  grid.replaceChildren();
  matches.forEach(e=>{
   const link=document.createElement('a');link.className='helper-card helper-'+e[5];link.href=e[7];link.lang=language;
   const icon=document.createElement('span');icon.className='helper-card-icon';icon.textContent=e[6];icon.setAttribute('aria-hidden','true');
   const title=document.createElement('h3');title.textContent=e[language==='bn'?2:1];
   const desc=document.createElement('p');desc.textContent=e[language==='bn'?4:3];
   const action=document.createElement('span');action.className='helper-card-action';action.textContent=language==='bn'?'টুল খুলুন ↗':'Open helper ↗';
   link.append(icon,title,desc,action);grid.append(link);
  });
  document.querySelector('#helper-empty').hidden=matches.length!==0;
 }
 function translate(){
  selector.value=language;
  document.querySelectorAll('[data-en][data-bn]').forEach(el=>{el.textContent=el.dataset[language];el.lang=language;});
  search.placeholder=language==='bn'?'টুল খুঁজুন · PDF, ঋণ, QR…':'Search helpers · PDF, loan, QR…';
  render();
 }
 selector.addEventListener('change',()=>{language=selector.value;try{localStorage.setItem('pocket_helper_language',language);}catch{}translate();});
 search.addEventListener('input',render);
 document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
 translate();
})();
