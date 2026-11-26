import {createClient} from '@supabase/supabase-js';
import {marked} from 'marked';
import DOMPurify from 'dompurify';
// Publishable key is public by design; all authorization is enforced by RLS.
export const cms=createClient('https://hypcrygviekhvqbthktj.supabase.co','sb_publishable_Tz4TfZjcqoy8-6p7KOUFsA_OYO9qx5q',{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:location.pathname==='/admin.html'}});
export const bucket='ph-media';
export function must(result){if(result.error)throw result.error;return result.data;}
export async function mediaURL(path){if(!path)return null;return must(await cms.storage.from(bucket).createSignedUrl(path,60)).signedUrl;}
export function renderBody(el,text){el.innerHTML=DOMPurify.sanitize(marked.parse(text||'',{async:false}),{ALLOWED_TAGS:['p','br','h2','h3','h4','strong','em','ul','ol','li','blockquote','code','pre','a','hr'],ALLOWED_ATTR:['href','title']});el.querySelectorAll('a').forEach(a=>{try{const u=new URL(a.getAttribute('href'));if(!['https:','mailto:'].includes(u.protocol))a.removeAttribute('href');else {a.rel='noopener noreferrer';a.target='_blank';}}catch{a.removeAttribute('href');}});}
export function sourcesFromText(text){return text.split('\n').map(s=>s.trim()).filter(Boolean).map(line=>{const i=line.indexOf('|');if(i<1)throw new Error('Sources: use Title | https://… on each line.');const title=line.slice(0,i).trim(),url=new URL(line.slice(i+1).trim());if(url.protocol!=='https:'||url.username||url.password)throw new Error('Sources must use public HTTPS URLs.');return {title,url:url.href};});}
export function validateUpload(file,kind){const formats={audio:{mp3:'audio/mpeg',m4a:'audio/mp4',wav:'audio/wav',ogg:'audio/ogg'},slides:{pdf:'application/pdf'},cover:{jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}};const ext=file.name.split('.').pop().toLowerCase(),mime=formats[kind]?.[ext];const max=kind==='cover'?5:kind==='audio'?10:20;if(!mime)throw new Error('Unsupported file type for '+kind);if(!file.size||file.size>max*1024*1024)throw new Error(`${kind}: choose a non-empty file up to ${max} MB.`);return {ext,mime};}
