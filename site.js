const $ = s => document.querySelector(s);
const tools = [
 ['YouTube Title Generator','Titles that make people stop scrolling and start watching.','YouTube','▷','peach','Popular'],
 ['Blog Writer','Go from a blank page to a thoughtful first draft in minutes.','Content','✎','purple',''],
 ['Ad Copy','Turn your product’s best features into your next great campaign.','Marketing','↗','sage',''],
 ['Script Generator','Give your next video a strong hook, a clear story, and a great ending.','YouTube','▤','blue','Popular'],
 ['Facebook Caption','Find the right words for your next scroll-stopping post.','Content','▧','pink',''],
 ['Content Calendar','Less last-minute scrambling. More content with a plan.','Productivity','▦','yellow',''],
 ['SEO Description Generator','Write clear, search-friendly descriptions for your next video.','YouTube','⌕','sage',''],
 ['YouTube Tags','Discover relevant tags that describe your content.','YouTube','#','peach',''],
 ['Thumbnail Ideas','Explore visual directions for a thumbnail that stands out.','YouTube','◈','purple',''],
 ['Hook Generator','Make your first five seconds count with stronger openings.','Content','✦','yellow',''],
 ['Rewrite & Improve','Turn your rough notes into clear, compelling copy.','Productivity','✎','blue',''],
 ['Repurpose Content','Give one idea a new life across multiple platforms.','Productivity','⤴','sage',''],
 ['Product Description','Connect your product’s features to what customers care about.','Marketing','◇','pink',''],
 ['Competitor Angle','Explore a fresh perspective for your next campaign.','Marketing','◎','purple','']
];
let filter = 'All tools', expanded = false, currentTool, generating = false;
function renderTools(){
 const query = $('#tool-search').value.trim().toLowerCase();
 const matches = tools.filter(t => (filter === 'All tools' || t[2] === filter) && `${t[0]} ${t[1]}`.toLowerCase().includes(query));
 const shown = expanded || filter !== 'All tools' || query ? matches : matches.slice(0,6);
 $('#tool-grid').innerHTML = shown.map(t => `<button class="tool-card" data-tool="${tools.indexOf(t)}"><div class="tool-card-top"><span class="tool-icon ${t[4]}">${t[3]}</span>${t[5] ? '<span class="badge popular">✦ Popular</span>' : ''}</div><h3>${t[0]}</h3><p>${t[1]}</p><div class="tool-card-bottom"><span>${t[2]}</span><strong>Try this tool <span>↗</span></strong></div></button>`).join('');
 $('#no-results').hidden = matches.length > 0;
 $('#show-tools').hidden = filter !== 'All tools' || !!query;
 $('#show-tools').innerHTML = expanded ? 'Show fewer tools <span>↑</span>' : 'Explore all 14 tools <span>↓</span>';
}
renderTools();
$('.filters').addEventListener('click', e => { const b=e.target.closest('[data-filter]'); if(!b)return; filter=b.dataset.filter; document.querySelectorAll('[data-filter]').forEach(el=>{el.classList.toggle('active',el===b);el.setAttribute('aria-pressed',el===b)});renderTools(); });
document.querySelectorAll('[data-filter]').forEach(el=>el.setAttribute('aria-pressed',el.classList.contains('active')));
$('#tool-search').addEventListener('input',renderTools);
$('#show-tools').onclick=()=>{expanded=!expanded;renderTools()};
$('.menu-toggle').onclick=()=>{const open=$('.header nav').classList.toggle('open');$('.menu-toggle').setAttribute('aria-expanded',open)};
$('.header nav').onclick=()=>{$('.header nav').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false')};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('dialog[open]')){e.preventDefault();$('#tool-search').focus()}});
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.dialog-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}})});
$('#tool-grid').onclick=e=>{const card=e.target.closest('[data-tool]');if(!card)return;if(generating){$('#tool-dialog').showModal();return}currentTool=tools[Number(card.dataset.tool)];$('#tool-title').textContent=currentTool[0];$('#tool-description').textContent=currentTool[1];$('#tool-input').value='';$('#tool-result').hidden=true;$('#result-actions').hidden=true;$('#generation-status').textContent='';$('#tool-dialog').showModal()};
$('#generate-form').onsubmit=async e=>{
 e.preventDefault();if(generating)return;const input=$('#tool-input').value.trim();if(!input){$('#tool-input').focus();return}generating=true;$('#generate-button').disabled=true;$('#generate-button').textContent='Creating your first draft…';$('#generation-status').textContent='A little creative thinking in progress…';$('#tool-result').hidden=true;$('#result-actions').hidden=true;
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),65000);
 try{let token='';try{token=localStorage.getItem('pocket_access_token')||''}catch{}const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json',...(token?{'X-Access-Token':token}:{})},body:JSON.stringify({tool:currentTool[0],input,mode:'single'}),signal:controller.signal});const data=await res.json();if(!res.ok){if(res.status===401)throw new Error('This studio requires an access code. Use the Creator Studio link below to sign in, then try again.');throw new Error('Generation is unavailable right now. The site owner may need to configure an AI provider. Please try again later or use Creator Studio.')}if(!data.result)throw new Error('No content was returned. Please try a more specific prompt.');$('#tool-result').textContent=data.result;$('#tool-result').hidden=false;$('#result-actions').hidden=false;$('#generation-status').textContent='Your first draft is ready. Review facts and make it your own before publishing.';
 }catch(err){$('#generation-status').textContent=err.name==='AbortError'?'This is taking longer than expected. Please try again.':err.message}finally{clearTimeout(timeout);generating=false;$('#generate-button').disabled=false;$('#generate-button').textContent='Generate ideas ✦'}
};
function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#copy-result').onclick=async()=>{try{await navigator.clipboard.writeText($('#tool-result').textContent);$('#copy-result').textContent='Copied!';setTimeout(()=>$('#copy-result').textContent='Copy result',2000)}catch{$('#generation-status').textContent='Clipboard unavailable. Select the output to copy it, or use Download.'}};
$('#download-result').onclick=()=>download($('#tool-result').textContent,'pocket-ai-draft.txt');
const config=window.POCKET_SITE||{};
function openContact(service){if(service)$('#contact-form').elements.service.value=service;$('#contact-status').textContent='';$('#contact-note').textContent=config.contactEmail?'This opens your email app with your brief. Nothing is submitted until you send the email.':'Direct contact is not configured yet. Download your project brief to save it and share with the site owner. Your information is not sent or stored.';$('#send-brief').textContent=config.contactEmail?'Open email with my brief ↗':'Download project brief ↓';$('#contact-dialog').showModal()}
$('#contact-open').onclick=()=>openContact();document.querySelectorAll('.service-inquiry').forEach(b=>b.onclick=()=>openContact(b.dataset.service));
$('#contact-form').onsubmit=e=>{e.preventDefault();const d=new FormData(e.target);const brief=`POCKET AI — PROJECT BRIEF\n\nName: ${d.get('name')}\nEmail: ${d.get('email')}\nService: ${d.get('service')}\n\n${d.get('message')}`;if(config.contactEmail){window.location.href=`mailto:${encodeURIComponent(config.contactEmail)}?subject=${encodeURIComponent('Project inquiry: '+d.get('service'))}&body=${encodeURIComponent(brief)}`;$('#contact-status').textContent='Your email app was requested. Please send the message there. If no app opens, save your brief and email the address below.';const link=document.createElement('button');link.type='button';link.className='button outline';link.textContent='Download brief instead';link.onclick=()=>download(brief,'pocket-ai-project-brief.txt');$('#contact-status').append(document.createElement('br'),document.createTextNode(config.contactEmail),document.createElement('br'),link)}else{download(brief,'pocket-ai-project-brief.txt');$('#contact-status').textContent='Brief prepared for download. It has not been submitted to Pocket AI.'}};
const articles=[
 ['Write a hook they can’t scroll past.','CONTENT CREATION','Start with a specific promise','A good hook helps the right person recognize that a piece of content is for them. Instead of “Here are some content tips,” try “Three ways to plan next week’s posts in twenty minutes.” Make the benefit concrete, realistic, and connected to the actual content.','Create curiosity, not confusion','Give your audience enough context to care. A useful pattern is problem, surprise, payoff: “Your posts might not need better design. They might need a clearer first sentence. Here’s how to fix it.” Avoid manufactured urgency and promises you cannot keep.','Write five versions before choosing one','Try a question, a direct benefit, a personal observation, a common mistake, and a practical checklist. Read them aloud. Pick the one that sounds natural and gets to the point fastest. The Hook Generator can help you explore alternatives, but your judgment should make the final call.','Test what happens after the click','A high click rate is not enough if people immediately leave. Compare watch time, meaningful comments, and saves. Keep the promise made in your opening, and change one element at a time so you can learn what actually helped.'],
 ['Turn one good idea into a week of content.','WORK SMARTER','Choose an idea with real substance','Start with a question your customers genuinely ask. Write a useful answer with an example, a mistake to avoid, and an action someone can take today. That original answer becomes the source for the week, not a set of seven disconnected posts.','Adapt the format, not just the length','On Monday, publish the full answer as a short article. On Tuesday, turn the main lesson into a carousel. On Wednesday, film a quick demonstration. On Thursday, share the mistake and its fix. On Friday, invite your audience to ask follow-up questions.','Keep a simple content map','For each post, note the audience, takeaway, format, and call to action. A video needs a spoken opening; a carousel needs a visual sequence; an email needs a clear subject line. Repurposing should make the idea native to each platform, not copy and paste it everywhere.','Leave room for your audience','Batch drafts, but do not automate away the conversation. Review comments and adjust the next post to address the questions people actually ask. Use the Content Calendar tool as a planning assistant and leave flexible slots for timely ideas.'],
 ['Find a brand voice that sounds like you.','BRAND BUILDING','Start with people, not adjectives','Think about who you serve and what they need to feel: understood, confident, excited, or reassured. Then write down how you would explain your offer to one of those people in a real conversation. Your natural language is often a better starting point than a list of fashionable brand words.','Choose three useful principles','For example: clear, not technical; warm, not overly familiar; confident, not exaggerated. Pair each principle with a sentence you would use and one you would avoid. Concrete examples make a voice guide usable by teammates and AI tools.','Build a small language library','Collect five headlines, five calls to action, and five support replies that sound right. Note recurring words, sentence lengths, and how you address the reader. Also record language you avoid, especially unsupported claims and empty superlatives.','Review it in the real world','Use your guide on a landing page, a social post, and an email. Does the voice still feel like the same person while fitting each context? Ask a customer what they understood, not only whether they liked it. Refine your guide as your business learns.']
];
document.querySelectorAll('[data-article]').forEach(b=>b.onclick=()=>{const a=articles[Number(b.dataset.article)];const el=$('#reading-content');el.replaceChildren();const tag=document.createElement('div');tag.className='eyebrow';tag.textContent=a[1];const title=document.createElement('h2');title.textContent=a[0];el.append(tag,title);for(let i=2;i<a.length;i+=2){const h=document.createElement('h3'),p=document.createElement('p');h.textContent=a[i];p.textContent=a[i+1];el.append(h,p)}$('#reading-dialog').showModal()});
const policies={privacy:'<div class="eyebrow">YOUR PRIVACY</div><h2>Privacy policy</h2><p>Prompts entered in AI tools are sent to this site’s server and configured third-party AI providers to generate a response. Do not submit sensitive or confidential information. Provider retention and processing depend on the services configured by the operator.</p><h3>Local storage and project briefs</h3><p>Your ad preference and any studio access token can be stored in this browser. Project briefs are prepared locally; this website does not submit them to a database. If you choose email, your email application and provider handle delivery. Hosting providers may retain technical access logs.</p><h3>Optional advertising</h3><p>Only after advertising consent, configured Adsterra scripts may process device information, IP addresses and cookies. Withdraw consent through Cookie preferences. Withdrawal stops future ad loads but cannot erase information already processed by a third party.</p><p>For privacy requests, use the site’s configured business contact. Before public launch, the operator must add their contact details and review this notice against their actual provider setup and applicable laws.</p>',terms:'<div class="eyebrow">THE BASICS</div><h2>Terms of use</h2><p>AI tools produce drafts, not professional advice. You are responsible for checking accuracy, rights, and suitability before use. Availability depends on configured providers, service limits, and any studio access requirements.</p><p>Do not use the tools for unlawful, deceptive, abusive, or rights-infringing activities. Do not send information you do not have permission to process.</p><h3>Creative services</h3><p>A project inquiry is not an order or a contract. Scope, timeline, ownership, and pricing must be agreed separately before work starts. The illustrative concepts on this website are not representations of completed client projects.</p><h3>Advertising</h3><p>Sponsored placements are third-party advertising, not endorsements. Advertising revenue and business outcomes are not guaranteed.</p>'};
document.querySelectorAll('[data-policy]').forEach(b=>b.onclick=()=>{$('#reading-content').innerHTML=policies[b.dataset.policy];$('#reading-dialog').showModal()});
let adLoaded=false;function getConsent(){try{return localStorage.getItem('pocket_ad_consent')}catch{return null}}
function loadConfiguredAd(){const ad=config.adsterra;if(adLoaded||getConsent()!=='accepted'||!ad?.key||!ad.scriptUrl)return;let url;try{url=new URL(ad.scriptUrl);if(url.protocol!=='https:')return}catch{return}adLoaded=true;const frame=document.createElement('iframe');frame.title='Advertisement';frame.width=Number(ad.width)||728;frame.height=Number(ad.height)||90;frame.style.border='0';frame.style.flexShrink='0';frame.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');const options=JSON.stringify({key:ad.key,format:'iframe',height:Number(ad.height)||90,width:Number(ad.width)||728,params:{}}).replace(/</g,'\\u003c');const script=JSON.stringify(url.href).replace(/</g,'\\u003c');frame.srcdoc=`<!doctype html><html><body style="margin:0"><script>window.atOptions=${options};var s=document.createElement('script');s.src=${script};document.body.appendChild(s);<\/script></body></html>`;$('#ad-slot').replaceChildren(frame)}
// The editable HTML is fetched as inert text, only after consent. It is never
// inserted into the main document: publisher scripts run inside a sandbox.
let adLoading = false;
async function loadAd(){
 if(adLoaded || adLoading || getConsent() !== 'accepted') return;
 adLoading = true;
 try {
  const response = await fetch('/adsterra-banner.html', {cache:'no-store'});
  if(!response.ok) throw new Error('Banner file unavailable');
  const html = await response.text();
  if(getConsent() !== 'accepted') return;
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  if(!parsed.querySelector('script, iframe')) { loadConfiguredAd(); return; }
  const scripts = [...parsed.querySelectorAll('script')].map(s => s.textContent).join('\n');
  // Read conventional atOptions dimensions without executing publisher code.
  const dimension = (key, fallback, max) => {
   const match = scripts.match(new RegExp("['\"]?" + key + "['\"]?\\s*:\\s*(\\d+)", 'i'));
   return match ? Math.max(1, Math.min(max, Number(match[1]))) : fallback;
  };
  const frame = document.createElement('iframe');
  frame.title = 'Advertisement';
  frame.width = dimension('width', 728, 1200);
  frame.height = dimension('height', 90, 600);
  frame.style.border = '0';
  frame.style.flexShrink = '0';
  frame.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');
  frame.srcdoc = html;
  $('#ad-slot').replaceChildren(frame);
  adLoaded = true;
 } catch {
  // Keep the supporter placeholder if the file is empty or unavailable.
  loadConfiguredAd();
 } finally { adLoading = false; }
}
['#ad-preferences','#footer-ad-preferences'].forEach(s=>$(s).onclick=()=>$('#consent-dialog').showModal());
function setConsent(value){try{localStorage.setItem('pocket_ad_consent',value)}catch{}$('#consent-dialog').close();if(value==='accepted')loadAd();else if(adLoaded){$('#ad-slot').textContent='Advertising is disabled. Thank you for visiting Pocket AI.';adLoaded=false}}
$('#accept-ads').onclick=()=>setConsent('accepted');$('#reject-ads').onclick=()=>setConsent('rejected');loadAd();$('#year').textContent=new Date().getFullYear();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
