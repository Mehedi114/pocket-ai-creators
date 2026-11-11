import {toolSEOPaths} from './seo-paths.js';
import QRCode from 'qrcode';
import {wordStats,textCase,formatJSON,base64,urlCode,safeURL,campaignURL,password,units,convert,percentage} from './utility-core.js';
const $=s=>document.querySelector(s);
const catalog=[
 {id:'qr',name:'Link to QR Code',category:'Everyday',icon:'▦',color:'peach',desc:'A link, a scan, a connection. Create a QR code and download it as PNG or SVG.'},
 {id:'password',name:'Password Generator',category:'Everyday',icon:'✳',color:'sage',desc:'Generate a random password with your choice of length and character types.'},
 {id:'words',name:'Word Counter & Text Tools',category:'Writing',icon:'✎',color:'purple',desc:'Count words and characters, estimate reading time, and clean up your text.'},
 {id:'units',name:'Unit Converter',category:'Everyday',icon:'⇄',color:'blue',desc:'Miles to kilometers, pounds to kilograms, Fahrenheit to Celsius. Sorted.'},
 {id:'percent',name:'Percentage Calculator',category:'Everyday',icon:'%',color:'yellow',desc:'Find a percentage, compare values, or calculate an increase or decrease.'},
 {id:'utm',name:'UTM Link Builder',category:'Marketing',icon:'↗',color:'sage',desc:'Add campaign tracking parameters to a URL. This is a link builder, not a link shortener.'},
 {id:'json',name:'JSON Formatter',category:'Developer',icon:'{}',color:'peach',desc:'Validate, format, or minify JSON. Make your data a little easier to read.'},
 {id:'base64',name:'Base64 Encoder / Decoder',category:'Developer',icon:'64',color:'purple',desc:'Convert UTF-8 text to Base64 and back, including non-English characters.'},
 {id:'url',name:'URL Encoder / Decoder',category:'Developer',icon:'↔',color:'blue',desc:'Encode or decode URL components without breaking spaces and special characters.'}
,{"id":"thumbnail","name":"YouTube Thumbnail Downloader","category":"Creators","icon":"▷","color":"peach","desc":"Find available thumbnail sizes from a YouTube link. Download or open the image.","href":"/creator-tools.html#thumbnail"},
{"id":"tags","name":"YouTube Tag Generator","category":"Creators","icon":"#","color":"sage","desc":"Generate keyword suggestions locally, or switch to AI mode with a configured provider.","href":"/creator-tools.html#tags"},
{"id":"readability","name":"Word Count & Readability","category":"Writing","icon":"✎","color":"purple","desc":"Check English readability, estimated grade level and reading time.","href":"/creator-tools.html#readability"},
{"id":"prompt","name":"AI Prompt Generator & Refiner","category":"Creators","icon":"✦","color":"purple","desc":"Structure a reusable prompt locally or improve it with a configured AI provider.","href":"/creator-tools.html#prompt"},
{"id":"hourly","name":"Freelancer Hourly Rate","category":"Finance","icon":"$","color":"sage","desc":"Plan your hourly rate around take-home goals, billable time and expenses.","href":"/creator-tools.html#hourly"},
{"id":"tax","name":"Freelancer Tax Reserve","category":"Finance","icon":"%","color":"yellow","desc":"Estimate a flat-rate tax reserve. Clear assumptions, no hidden tax-law claims.","href":"/creator-tools.html#tax"},
{"id":"mortgage","name":"Mortgage Calculator","category":"Finance","icon":"⌂","color":"blue","desc":"Estimate monthly principal, interest and your stated housing extras.","href":"/creator-tools.html#mortgage"},
{"id":"loan","name":"Loan Payment Calculator","category":"Finance","icon":"÷","color":"peach","desc":"Estimate monthly repayments and total interest for a fixed-rate loan.","href":"/creator-tools.html#loan"},
{"id":"compound","name":"Compound Interest Calculator","category":"Finance","icon":"↗","color":"sage","desc":"Explore monthly compounding with regular contributions and a constant return.","href":"/creator-tools.html#compound"},
{"id":"margin","name":"SaaS & E-commerce Profit Margin","category":"Finance","icon":"%","color":"purple","desc":"See profit, margin and markup from the revenue and costs you enter.","href":"/creator-tools.html#margin"},
{"id":"image","name":"WebP & AVIF Image Converter","category":"Files","icon":"◈","color":"blue","desc":"Convert still images locally, with quality and size controls.","href":"/creator-tools.html#image"},
{"id":"pdf-merge","name":"Merge PDFs","category":"Files","icon":"⊕","color":"peach","desc":"Combine PDFs in your chosen order. No upload required.","href":"/creator-tools.html#pdf-merge"},
{"id":"pdf-split","name":"Split / Extract PDF Pages","category":"Files","icon":"▤","color":"sage","desc":"Save selected pages or ranges into a new PDF in your browser.","href":"/creator-tools.html#pdf-split"},
{"id":"pdf-compress","name":"Compress / Optimize PDF","category":"Files","icon":"↓","color":"purple","desc":"Try lossless structural optimization. Savings depend on the source PDF.","href":"/creator-tools.html#pdf-compress"}
];
let category='All tools',active,output='',qrText='',qrSize=512;
const input=(id,label,placeholder='',type='text',value='')=>`<label for="${id}">${label}</label><input id="${id}" type="${type}" placeholder="${placeholder}" value="${value}" required maxlength="4000">`;
const area=label=>`<label for="utility-input">${label}</label><textarea id="utility-input" maxlength="200000" spellcheck="false" placeholder="Paste or type here…"></textarea>`;
const select=(id,label,options)=>`<label for="${id}">${label}</label><select id="${id}">${options.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>`;
const action=text=>`<button class="button primary" type="submit">${text} <span>↗</span></button>`;
const categoryInfo={
 Everyday:{title:'Everyday essentials',description:'Quick fixes for the things you do every day.',icon:'◈'},
 Creators:{title:'YouTube & prompts',description:'Make your next creative task easier.',icon:'▷'},
 Writing:{title:'Writing & text',description:'Make every word count.',icon:'✎'},
 Finance:{title:'Freelance & finance',description:'Planning estimates with clearly stated assumptions.',icon:'$'},
 Files:{title:'Images & PDFs',description:'Convert and organize files without uploading them.',icon:'▤'},
 Marketing:{title:'Marketing & links',description:'Make your next campaign easier to track.',icon:'↗'},
 Developer:{title:'Developer tools',description:'Clean, encode and validate without the extra tabs.',icon:'{}'}
};
const searchTerms={qr:'url link barcode scan png svg',password:'secure random generator login',words:'word count characters uppercase lowercase reading text',units:'convert conversion feet foot inches miles kilometers km pounds kg fahrenheit celsius temperature weight length volume',percent:'percentage percent discount increase decrease calculator',utm:'campaign tracking marketing analytics link url',json:'json pretty print minify validate format developer',base64:'base64 encode decode unicode utf8 developer',url:'url uri percent encode decode component developer'};
const taskLabels={qr:'Create QR code',password:'Generate password',words:'Count & clean text',units:'Convert units',percent:'Calculate percentage',utm:'Build campaign link',json:'Format JSON',base64:'Convert Base64',url:'Encode or decode'};
function toolCard(t){return `<div class="tool-card-wrap"><a class="tool-card" href="${t.href||'#'+t.id}"><div class="tool-card-top"><span class="tool-icon ${t.color}" aria-hidden="true">${t.icon}</span><span class="badge">${['tags','prompt'].includes(t.id)?'Local + AI':'Free'}</span></div><h3>${t.name}</h3><p>${t.desc}</p><div class="tool-card-bottom"><span>${t.category}</span><strong>${taskLabels[t.id]||'Open tool'} ↗</strong></div></a><a class="tool-guide-link" href="${toolSEOPaths[t.id]}">How to use ${t.name} →</a></div>`}

function render(){
 const q=$('#utility-search').value.trim().toLowerCase();
 const matches=catalog.filter(t=>(category==='All tools'||t.category===category)&&q.split(/\s+/).every(word=>`${t.name} ${t.desc} ${searchTerms[t.id]||''}`.toLowerCase().includes(word)));
 $('#utilities-grid').innerHTML=Object.entries(categoryInfo).map(([key,info])=>{
  const items=matches.filter(t=>t.category===key);if(!items.length)return '';
  return `<section class="tool-group" aria-labelledby="group-${key}"><div class="tool-group-heading"><div><h3 id="group-${key}">${info.title} <span>${items.length}</span></h3><p>${info.description}</p></div><span aria-hidden="true">${info.icon}</span></div><div class="group-card-grid">${items.map(toolCard).join('')}</div></section>`;
 }).join('');
 $('#utility-empty').hidden=matches.length!==0;
 $('#tool-count').textContent=`${matches.length} of ${catalog.length} tools`;
 document.querySelectorAll('[data-category]').forEach(el=>{const key=el.dataset.category;const count=key==='All tools'?catalog.length:catalog.filter(t=>t.category===key).length;el.innerHTML=`<span>${key==='All tools'?'All tools':categoryInfo[key].title}</span><span class="category-count">${count}</span>`;el.classList.toggle('active',key===category);el.setAttribute('aria-pressed',String(key===category))});
}
$('#utility-search').addEventListener('input',render);
$('#utility-filters').onclick=e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;render()};
$('#reset-tool-filters').onclick=()=>{category='All tools';$('#utility-search').value='';render();$('#utility-search').focus()};
$('#switch-utility').innerHTML=catalog.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
$('#switch-utility').onchange=e=>{const tool=catalog.find(t=>t.id===e.target.value);if(tool?.href)location.href=tool.href;else location.hash=e.target.value};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('#utility-search').focus()}});
function result(text){output=text;$('#result-placeholder').hidden=true;$('#utility-output').textContent=text;$('#utility-output').hidden=false;$('#utility-result-actions').hidden=false;$('#utility-status').textContent='Ready. Your input was processed in this browser.';}
function clearResult(){$('#result-placeholder').hidden=false;output='';qrText='';$('#utility-output').textContent='';$('#utility-output').hidden=true;$('#utility-result-actions').hidden=true;$('#qr-preview').hidden=true;$('#qr-downloads').hidden=true;$('#utility-status').textContent='';}
function populateUnits(){const group=$('#unit-category').value;const names=Object.keys(units[group]);for(const id of ['#unit-from','#unit-to']){$(id).replaceChildren(...names.map(name=>new Option(name,name)))}$('#unit-to').selectedIndex=1;clearResult()}
function textStats(){const s=wordStats($('#utility-input').value);$('#text-stats').textContent=`${s.words.toLocaleString()} words · ${s.characters.toLocaleString()} characters · ${s.noSpaces.toLocaleString()} without spaces · ${s.lines.toLocaleString()} lines · ~${s.readingSeconds} sec reading time`}
function openTool(){const id=location.hash.slice(1);active=catalog.find(t=>t.id===id);if(active?.href){location.href=active.href;return}if(!active){$('#utility-workspace').hidden=true;return}$('#utility-workspace').hidden=false;$('#switch-utility').value=id;$('#utility-title').textContent=active.name;$('#utility-description').textContent=active.desc;clearResult();let form='';
 if(id==='qr')form=input('qr-url','Website link','https://example.com','url')+select('qr-size','PNG image size',[['256','256 × 256 px'],['512','512 × 512 px'],['1024','1024 × 1024 px']])+'<p class="subnote">Static QR codes do not expire, but the destination link must stay available. Test your downloaded code with a phone before printing. No tracking or link shortening.</p>'+action('Create QR code');
 if(id==='password')form=input('password-length','Password length (8–128)','','number','20')+'<fieldset><legend>Include characters</legend>'+[['lower','Lowercase (a–z)'],['upper','Uppercase (A–Z)'],['digits','Numbers (0–9)'],['symbols','Symbols (!@#)']].map(([v,l])=>`<label class="check-option"><input type="checkbox" name="character-set" value="${v}" checked>${l}</label>`).join('')+'</fieldset><p class="subnote">Uses your browser’s cryptographic random generator. Save passwords in a trusted password manager; use a unique password for each account.</p>'+action('Generate password');
 if(id==='words')form=area('Your text')+'<div id="text-stats" class="stats-panel" role="status"></div><div class="utility-actions">'+[['upper','UPPERCASE'],['lower','lowercase'],['trim','Clean spacing']].map(([v,l])=>`<button class="button outline" type="button" data-case="${v}">${l}</button>`).join('')+'</div>'+action('Get text');
 if(id==='units')form=select('unit-category','Measurement',Object.keys(units).map(k=>[k,k]))+input('unit-value','Value','','number','1')+'<div class="form-row">'+select('unit-from','From',[])+select('unit-to','To',[])+'</div><p class="subnote">Volume uses US customary units, not Imperial or metric cups. Results are rounded for display.</p>'+action('Convert units');
 if(id==='percent')form=select('percent-mode','Calculation',[['of','What is A% of B?'],['is','A is what percentage of B?'],['change','Percentage change from A to B']])+'<div class="form-row">'+input('percent-a','A','','number','15')+input('percent-b','B','','number','200')+'</div><p class="subnote">Percentage change = (B − A) ÷ |A| × 100. Zero starting values are undefined.</p>'+action('Calculate');
 if(id==='utm')form=input('utm-url','Destination URL','https://example.com/offer','url')+'<div class="form-row">'+input('utm-source','Campaign source','newsletter')+input('utm-medium','Campaign medium','email')+'</div>'+input('utm-campaign','Campaign name','summer_launch')+'<div class="form-row">'+input('utm-term','Keyword / term (optional)','running shoes')+input('utm-content','Ad / content (optional)','hero_button')+'</div><p class="subnote">This does not shorten links: it adds campaign tracking parameters. Existing query parameters and the #fragment are preserved. Blank optional UTM parameters are removed. Attribution requires analytics on your destination website.</p>'+action('Build campaign link');
 if(id==='json')form=area('JSON input')+select('json-mode','Output',[['pretty','Pretty print (2 spaces)'],['compact','Minify']])+'<p class="subnote">Strict JSON only: no comments or trailing commas. JavaScript number precision applies; quote large numeric IDs to preserve their digits.</p>'+action('Validate & format');
 if(id==='base64'||id==='url')form=area(id==='base64'?'UTF-8 text or Base64':'Text or encoded URL component')+select('codec-mode','Operation',[['encode','Encode'],['decode','Decode']])+`<p class="subnote">${id==='base64'?'Base64 is encoding, not encryption. This tool processes UTF-8 text, not binary files.':'Encodes one URL component, not a whole navigable URL. Decoding keeps literal + signs unchanged; it is not form-urlencoded decoding.'}</p>`+action('Convert text');
 $('#utility-form').innerHTML=form;$('#utility-form').querySelectorAll('input[type="number"]').forEach(el=>el.step='any');
 if(id==='password'){$('#password-length').min=8;$('#password-length').max=128;$('#password-length').step=1}
 if(id==='utm'){for(const el of ['#utm-term','#utm-content'])$(el).required=false}
 if(id==='qr'){$('#qr-size').value='512';$('#qr-url').maxLength=1500}
 if(id==='units'){populateUnits();$('#unit-category').onchange=populateUnits}
 if(id==='words'){textStats();$('#utility-input').addEventListener('input',textStats);document.querySelectorAll('[data-case]').forEach(b=>b.onclick=()=>{$('#utility-input').value=textCase($('#utility-input').value,b.dataset.case);textStats();clearResult()})}
 $('#utility-form').oninput=()=>clearResult();
 $('#utility-workspace').scrollIntoView?.({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('#utility-title').focus({preventScroll:true});
}
function downloadFile(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
$('#utility-form').onsubmit=async e=>{e.preventDefault();clearResult();const id=active?.id;try{
 if(id==='qr'){const link=safeURL($('#qr-url').value).href;const size=Number($('#qr-size').value);await QRCode.toCanvas($('#qr-canvas'),link,{width:size,margin:4,errorCorrectionLevel:'M',color:{dark:'#172019',light:'#ffffff'}});if(active?.id!=='qr'||safeURL($('#qr-url').value).href!==link)return;qrText=link;qrSize=size;$('#result-placeholder').hidden=true;$('#qr-preview').hidden=false;$('#qr-downloads').hidden=false;$('#utility-status').textContent='QR code ready. Scan it with your phone to verify the destination.';}
 if(id==='password')result(password(Number($('#password-length').value),[...document.querySelectorAll('[name="character-set"]:checked')].map(el=>el.value)));
 if(id==='words')result($('#utility-input').value);
 if(id==='json')result(formatJSON($('#utility-input').value,$('#json-mode').value==='compact'));
 if(id==='base64')result(base64($('#utility-input').value,$('#codec-mode').value==='decode'));
 if(id==='url')result(urlCode($('#utility-input').value,$('#codec-mode').value==='decode'));
 if(id==='utm')result(campaignURL(...['url','source','medium','campaign','term','content'].map(k=>$('#utm-'+k).value)));
 if(id==='units'){const from=$('#unit-from').value,to=$('#unit-to').value;const value=Number($('#unit-value').value);const answer=convert(value,$('#unit-category').value,from,to);result(`${value} ${from} = ${Number(answer.toPrecision(12))} ${to}`)}
 if(id==='percent'){const mode=$('#percent-mode').value;result(`${Number(percentage(Number($('#percent-a').value),Number($('#percent-b').value),mode).toPrecision(12))}${mode==='of'?'':'%'}`)}
 }catch(err){$('#utility-status').textContent=id==='json'?`Invalid JSON: ${err.message}`:err.message||'Unable to process this input. Please check it and try again.'}
};
$('#utility-copy').onclick=async()=>{try{await navigator.clipboard.writeText(output);$('#utility-status').textContent='Copied to clipboard.'}catch{$('#utility-status').textContent='Clipboard unavailable. Select the result to copy it, or download it.'}};
$('#utility-download').onclick=()=>downloadFile(new Blob([output],{type:'text/plain;charset=utf-8'}),active.id==='json'?'formatted.json':`pocket-${active.id}.txt`);
$('#qr-png').onclick=()=>{if(!qrText)return;$('#qr-canvas').toBlob(blob=>{if(blob)downloadFile(blob,'pocket-qr.png');else $('#utility-status').textContent='PNG export failed. Please try SVG.'},'image/png')};
$('#qr-svg').onclick=async()=>{if(!qrText)return;try{const svg=await QRCode.toString(qrText,{type:'svg',width:qrSize,margin:4,errorCorrectionLevel:'M'});downloadFile(new Blob([svg],{type:'image/svg+xml'}),'pocket-qr.svg')}catch{$('#utility-status').textContent='SVG export failed. Please regenerate the code.'}};
$('#utility-reset').onclick=()=>{openTool()};
window.addEventListener('hashchange',openTool);
render();openTool();
