// Pure helpers shared by the browser UI and automated tests. No network calls.
export function wordStats(text) {
 const words = typeof Intl.Segmenter === 'function'
  ? [...new Intl.Segmenter(undefined, {granularity:'word'}).segment(text)].filter(s=>s.isWordLike).length
  : (text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[]).length;
 return {words, characters:[...text].length, noSpaces:[...text.replace(/\s/gu,'')].length,
  lines:text ? text.split(/\r\n|\r|\n/).length : 0, readingSeconds:Math.ceil(words/200*60)};
}
export function textCase(text, mode) {
 if(mode==='upper') return text.toLocaleUpperCase();
 if(mode==='lower') return text.toLocaleLowerCase();
 if(mode==='trim') return text.split(/\r?\n/).map(s=>s.trim().replace(/[\t ]+/g,' ')).join('\n').trim();
 return text;
}
export function formatJSON(text, compact=false) {
 if(text.length>200000) throw new Error('Use JSON under 200,000 characters.');
 return JSON.stringify(JSON.parse(text),null,compact?0:2);
}
export function base64(text, decode=false) {
 if(!decode){const bytes=new TextEncoder().encode(text);let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary);}
 const clean=text.replace(/\s/g,'');
 if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(clean))throw new Error('Enter valid, padded Base64 text.');
 return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(clean),c=>c.charCodeAt(0)));
}
export function urlCode(text, decode=false){return decode?decodeURIComponent(text):encodeURIComponent(text);}
export function safeURL(value){
 let url;try{url=new URL(value.trim());}catch{throw new Error('Enter a complete link beginning with https:// or http://.');}
 if(!['https:','http:'].includes(url.protocol))throw new Error('Use an HTTPS or HTTP website link.');
 if(url.username||url.password)throw new Error('Links containing usernames or passwords are not supported.');
 return url;
}
export function campaignURL(link, source, medium, campaign, term='', content=''){
 const url=safeURL(link);
 for(const [key,value] of Object.entries({utm_source:source,utm_medium:medium,utm_campaign:campaign,utm_term:term,utm_content:content})){
  if(['utm_source','utm_medium','utm_campaign'].includes(key)&&!value.trim())throw new Error('Source, medium and campaign are required.');
  if(value.trim())url.searchParams.set(key,value.trim());else url.searchParams.delete(key);
 }
 return url.href;
}
const groups={lower:'abcdefghijklmnopqrstuvwxyz',upper:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',digits:'0123456789',symbols:'!@#$%^&*()-_=+[]{};:,.?'};
function randomInt(max){
 const limit=Math.floor(4294967296/max)*max;const bytes=new Uint32Array(1);let n;
 do{globalThis.crypto.getRandomValues(bytes);n=bytes[0];}while(n>=limit);
 return n%max;
}
export function password(length, selected=['lower','upper','digits','symbols']){
 if(!Number.isInteger(length)||length<8||length>128)throw new Error('Choose a length between 8 and 128.');
 const sets=[...new Set(selected)].map(key=>groups[key]);
 if(!sets.length||sets.some(s=>!s))throw new Error('Select at least one character type.');
 const pool=sets.join('');const chars=sets.map(set=>set[randomInt(set.length)]);
 while(chars.length<length)chars.push(pool[randomInt(pool.length)]);
 for(let i=chars.length-1;i>0;i--){const j=randomInt(i+1);[chars[i],chars[j]]=[chars[j],chars[i]];}
 return chars.join('');
}
export const units={
 Length:{Meter:1,Kilometer:1000,Centimeter:.01,Millimeter:.001,Inch:.0254,Foot:.3048,Yard:.9144,Mile:1609.344},
 Weight:{Kilogram:1,Gram:.001,'US pound':.45359237,Ounce:.028349523125},
 Volume:{Liter:1,Milliliter:.001,'US gallon':3.785411784,'US fluid ounce':.0295735295625,'US cup':.2365882365},
 Temperature:{Celsius:1,Fahrenheit:1,Kelvin:1}
};
export function convert(value,category,from,to){
 if(!Number.isFinite(value))throw new Error('Enter a finite number.');
 if(!units[category]||!Object.hasOwn(units[category],from)||!Object.hasOwn(units[category],to))throw new Error('Choose valid units.');
 if(category==='Temperature'){
  const c=from==='Fahrenheit'?(value-32)*5/9:from==='Kelvin'?value-273.15:value;
  if(c< -273.150000001)throw new Error('Temperature cannot be below absolute zero.');
  return to==='Fahrenheit'?c*9/5+32:to==='Kelvin'?c+273.15:c;
 }
 const result=value*units[category][from]/units[category][to];
 if(!Number.isFinite(result))throw new Error('The result is too large.');return result;
}
export function percentage(a,b,mode){
 if(!Number.isFinite(a)||!Number.isFinite(b))throw new Error('Enter two finite numbers.');
 let result;
 if(mode==='of')result=a/100*b;
 else if(mode==='is'){if(b===0)throw new Error('The total cannot be zero.');result=a/b*100;}
 else if(mode==='change'){if(a===0)throw new Error('Percentage change from zero is undefined.');result=(b-a)/Math.abs(a)*100;}
 else throw new Error('Choose a calculation type.');
 if(!Number.isFinite(result))throw new Error('The result is too large.');return result;
}
