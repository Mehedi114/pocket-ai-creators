import {cms,must,mediaURL,renderBody} from './cms-client.js';
const node=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
window.POCKET_CMS_MEDIA=mediaURL;
window.POCKET_CMS_FEED=(async()=>{
 const rows=must(await cms.from('ph_entries').select('*').eq('status','published').order('published_at',{ascending:false}).limit(200));
 if(document.querySelector('#blog-list'))renderBlog(rows.filter(r=>r.kind==='blog'));
 return rows.filter(r=>r.kind==='audio').map(r=>({id:r.id,title:r.title,summary:r.summary,topic:r.topic,published:r.published_at.slice(0,10),weekStart:r.week_start,weekEnd:r.week_end,audioPath:r.audio_path,slidesPath:r.slides_path,reviewed:r.reviewed,reviewedBy:r.reviewed_by,rightsConfirmed:r.rights_confirmed,sources:r.sources,transcript:r.body}));
})();
// Errors are visible, not silently misreported as an empty catalog.
window.POCKET_CMS_FEED.catch(e=>{const status=document.querySelector('#blog-status');if(status)status.textContent='লেখা লোড করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।';});
async function renderBlog(rows){
 const list=document.querySelector('#blog-list'),article=document.querySelector('#blog-article'),search=document.querySelector('#blog-search');
 function render(){list.replaceChildren();const matches=rows.filter(r=>(r.title+' '+r.topic+' '+r.summary).toLowerCase().includes(search.value.toLowerCase()));if(!matches.length)list.append(node('p',rows.length?'No matching posts / কোনো লেখা পাওয়া যায়নি।':'প্রথম লেখার অপেক্ষায়। এখনো কোনো blog post প্রকাশিত হয়নি।'));for(const r of matches){const a=node('a','');a.className='blog-card';a.href='/blog.html?post='+encodeURIComponent(r.id);a.append(node('small',r.topic+' · '+r.published_at.slice(0,10)),node('h2',r.title),node('p',r.summary),node('span','পড়ুন / Read →'));list.append(a);}}
 search.oninput=render;render();const id=new URLSearchParams(location.search).get('post');if(!id)return;
 let entry=rows.find(r=>r.id===id);if(!entry&&/^[0-9a-f-]{36}$/i.test(id)){try{entry=must(await cms.from('ph_entries').select('*').eq('id',id).eq('kind','blog').eq('status','published').maybeSingle());}catch{}}
 if(!entry){document.querySelector('#blog-status').textContent='This post is unavailable or not published.';return;}
 list.hidden=true;document.querySelector('#blog-tools').hidden=true;article.hidden=false;article.append(node('h1',entry.title),node('p',entry.summary),node('small',`${entry.topic} · ${entry.published_at.slice(0,10)} · ${entry.reviewed_by}`));
 document.title=entry.title+' | Pocket Helper';
 const body=node('div','');body.className='prose';renderBody(body,entry.body);article.append(body);
 if(entry.cover_path)try{const image=document.createElement('img');image.src=await mediaURL(entry.cover_path);image.alt=entry.title;image.className='blog-cover';article.prepend(image);}catch{article.append(node('p','Cover image unavailable.'));}
 if(Array.isArray(entry.sources)&&entry.sources.length){article.append(node('h2','Sources / আরও পড়ুন'));for(const s of entry.sources){try{const url=new URL(s.url);if(url.protocol!=='https:')continue;const a=node('a',s.title+' ↗');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';article.append(a,document.createElement('br'));}catch{}}}
}
