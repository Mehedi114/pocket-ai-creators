import {PDFDocument} from 'pdf-lib';
import {wrapLines,dateLabel,coverLabels} from './cover-layout.js';
const form=document.querySelector('#cover-form'),canvas=document.querySelector('#cover-canvas'),status=document.querySelector('#cover-status'),$=s=>document.querySelector(s);
let logo=null,logoEpoch=0,frame,busy=false,fontReady=false;
const values=()=>Object.fromEntries(new FormData(form));
const family='"DM Sans", "Cover Bengali", sans-serif';
async function fonts(){await Promise.all([document.fonts.load('400 20px "DM Sans"'),document.fonts.load('600 20px "DM Sans"'),document.fonts.load('400 20px "Cover Bengali"','বাংলা'),document.fonts.load('600 20px "Cover Bengali"','বাংলা')]);await document.fonts.ready;fontReady=true;}
const fontPromise=fonts().catch(()=>{status.textContent='Font load হয়নি। Connection ঠিক করে page reload করো; বাংলা export এখন বন্ধ।';});
function render(target=canvas,data=values(),scale=1){target.width=Math.round(794*scale);target.height=Math.round(1123*scale);const c=target.getContext('2d');c.scale(scale,scale);c.fillStyle='#fff';c.fillRect(0,0,794,1123);const accent=data.accent,L=coverLabels[data.language]||coverLabels.en,issues=[];
 const line=(x,y,w,colour=accent,weight=1)=>{c.strokeStyle=colour;c.lineWidth=weight;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.stroke();};
 function text(value,x,y,width,height,size=20,weight=400,align='left',colour='#27332e'){value=String(value||'');if(!value.trim())return;let lines,actual=size;for(;actual>=10;actual-=.5){c.font=`${weight} ${actual}px ${family}`;lines=wrapLines(value,width,s=>c.measureText(s).width);if(lines.length*actual*1.45<=height)break;}if(actual<10){issues.push(value.slice(0,25));actual=10;c.font=`${weight} ${actual}px ${family}`;}c.save();c.beginPath();c.rect(x,y,width,height);c.clip();c.textAlign=align;c.textBaseline='top';c.fillStyle=colour;const tx=align==='center'?x+width/2:x;lines.forEach((v,i)=>c.fillText(v,tx,y+i*actual*1.45));c.restore();}
 if(data.design==='classic'){c.strokeStyle=accent;c.lineWidth=1.5;c.strokeRect(34,34,726,1055);c.lineWidth=.5;c.strokeRect(42,42,710,1039);}else if(data.design==='editorial'){c.fillStyle=accent;c.fillRect(35,44,8,1035);line(68,52,658,accent,2);line(68,1074,658,accent,1);}else if(data.design==='corners'){
  c.strokeStyle=accent;c.lineWidth=2;
  for(const [x,y,dx,dy] of [[45,45,1,1],[749,45,-1,1],[45,1078,1,-1],[749,1078,-1,-1]]){c.beginPath();c.moveTo(x+dx*90,y);c.lineTo(x,y);c.lineTo(x,y+dy*90);c.stroke();}
  line(95,302,604,'#dde3df');line(95,610,604,'#dde3df');
 }else if(data.design==='arch'){
  c.strokeStyle=accent;c.lineWidth=1.5;c.beginPath();c.moveTo(45,1078);c.lineTo(45,160);c.quadraticCurveTo(45,42,165,42);c.lineTo(629,42);c.quadraticCurveTo(749,42,749,160);c.lineTo(749,1078);c.stroke();line(45,1078,704);
  c.beginPath();c.arc(397,239,62,0,Math.PI*2);c.stroke();
 }else if(data.design==='scholar'){
  line(48,45,698,accent,3);line(48,53,698,accent,.6);line(48,1070,698,accent,.6);line(48,1078,698,accent,3);
  c.fillStyle=accent;c.fillRect(64,315,4,53);c.fillRect(726,315,4,53);
  c.strokeStyle='#d9dfda';c.lineWidth=.8;c.strokeRect(63,619,316,380);c.strokeRect(415,619,316,380);
 }else{line(54,44,686,accent,4);line(54,1078,686,accent,1);c.fillStyle=accent;c.fillRect(706,44,34,16);}
 text(data.institution||L.institution,65,72,664,64,25,600,'center',accent);text(data.department,80,140,634,40,16,400,'center');
 if(logo){const ratio=Math.min(94/logo.width,94/logo.height),w=logo.width*ratio,h=logo.height*ratio;c.drawImage(logo,(794-w)/2,192+(94-h)/2,w,h);}else{line(363,237,68,accent,2);}
 text(data.heading||'ASSIGNMENT',72,315,650,60,32,600,'center',accent);line(324,386,146,accent,1);text(data.topic||L.topic,82,410,630,100,25,600,'center');
 text(data.course?L.course+': '+data.course:'',82,525,630,40,16,400,'center');text(data.code?L.code+': '+data.code:'',82,567,630,30,14,400,'center');
 const colW=292,left=75,right=427,top=631;
 text(L.by,left,top,colW,33,17,600,'left',accent);text(L.to,right,top,colW,33,17,600,'left',accent);line(left,top+39,colW,'#cfd6d1');line(right,top+39,colW,'#cfd6d1');
 let y=top+56;const rows=[['student',data.student],['roll',data.roll],['registration',data.registration],['session',data.session],['semester',data.semester],['section',data.section],['department',data.department]].filter(([,v])=>v?.trim());
 for(const [key,value] of rows){text(L[key],left,y,88,37,11,600,'left','#68726c');text(value,left+96,y,colW-96,37,14,400);y+=43;}
 text(data.teacher,right,top+56,colW,62,21,600);text(data.designation,right,top+126,colW,62,16);text(data.teacherDepartment||data.department,right,top+199,colW,80,16);
 const date=dateLabel(data.date,data.language);if(date){line(252,1010,290,'#d9dfda');text(L.date+': '+date,75,1027,644,38,14,400,'center');}
 return issues;
}
function preview(){const issues=render();if(issues.length)status.textContent='কিছু লেখা জায়গার চেয়ে বড়। ছোট করো: '+issues.join(', ');else status.textContent='Live preview · '+(values().student&&values().institution&&values().topic?'Download-এর আগে সব তথ্য দেখে নাও।':'নিজের নাম, প্রতিষ্ঠান ও topic বসাও।');}
form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(preview);});
$('#cover-logo').addEventListener('change',async e=>{const id=++logoEpoch,file=e.target.files[0];if(!file)return;if(file.size>3*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)){status.textContent='3 MB-এর মধ্যে PNG, JPG বা WebP logo দাও।';return;}try{const bitmap=await createImageBitmap(file);if(id!==logoEpoch){bitmap.close();return;}if(bitmap.width*bitmap.height>12e6){bitmap.close();throw new Error('Logo 12 MP-এর বেশি।');}const buffer=document.createElement('canvas'),ratio=Math.min(1,600/Math.max(bitmap.width,bitmap.height));buffer.width=Math.max(1,Math.round(bitmap.width*ratio));buffer.height=Math.max(1,Math.round(bitmap.height*ratio));buffer.getContext('2d').drawImage(bitmap,0,0,buffer.width,buffer.height);bitmap.close();logo=buffer;$('#remove-logo').disabled=false;preview();}catch{status.textContent='Logo খোলা যায়নি। অন্য ছবি চেষ্টা করো।';}});
$('#remove-logo').onclick=()=>{logoEpoch++;logo=null;$('#cover-logo').value='';$('#remove-logo').disabled=true;preview();};
$('#cover-example').onclick=()=>{const sample={institution:'Your University',department:'Department of Management',heading:'ASSIGNMENT',topic:'The Role of Leadership in Modern Organisations',course:'Principles of Management',code:'MGT 101',student:'Your Name',roll:'123456',registration:'',session:'2025–2026',semester:'1st Year',section:'A',teacher:'Teacher Name',designation:'Assistant Professor',teacherDepartment:'Department of Management'};for(const [key,value] of Object.entries(sample))form.elements[key].value=value;preview();status.textContent='Sample details দেওয়া হয়েছে—জমা দেওয়ার আগে নিজের তথ্য বসাও।';};
$('#cover-clear').onclick=()=>{if(!window.confirm('সব তথ্য ও logo মুছে ফেলবে?'))return;logoEpoch++;form.reset();logo=null;$('#remove-logo').disabled=true;preview();};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
const png=target=>new Promise((resolve,reject)=>target.toBlob(b=>b?resolve(b):reject(new Error('Image export failed')),'image/png'));
async function exportCover(type){if(busy)return;busy=true;const buttons=[...document.querySelectorAll('.cover-downloads button')];buttons.forEach(b=>b.disabled=true);try{await fontPromise;if(!fontReady)throw new Error('Fonts load হয়নি। Reload করে আবার চেষ্টা করো।');const data=values();if(!data.student.trim()||!data.institution.trim()||!data.topic.trim())throw new Error('Student name, institution আর topic আগে পূরণ করো।');const output=document.createElement('canvas');const issues=render(output,data,2480/794);if(issues.length)throw new Error('লেখা বেশি বড়—ছোট করে আবার export করো।');if(type==='print'){render(canvas,data,2480/794);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));window.print();preview();return;}const image=await png(output);if(type==='png')download(image,'assignment-cover.png');else{const pdf=await PDFDocument.create(),page=pdf.addPage([595.2756,841.8898]),embedded=await pdf.embedPng(await image.arrayBuffer());page.drawImage(embedded,{x:0,y:0,width:page.getWidth(),height:page.getHeight()});download(new Blob([await pdf.save()],{type:'application/pdf'}),'assignment-cover.pdf');}status.textContent='Cover download প্রস্তুত। বানান ও তথ্য মিলিয়ে নাও।';}catch(e){status.textContent=e.message;}finally{busy=false;buttons.forEach(b=>b.disabled=false);}}
$('#cover-pdf').onclick=()=>exportCover('pdf');$('#cover-png').onclick=()=>exportCover('png');$('#cover-print').onclick=()=>exportCover('print');
preview();fontPromise.then(preview);
