import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {presets,dimensions,cropRect,removeBackdrop,sheetLayout} from '../tools/photo-core.js';
assert.deepEqual(dimensions(413,531),[413,531]);for(const n of [0,NaN,Infinity,2401,50.5])assert.throws(()=>dimensions(n,100));
assert.deepEqual(cropRect(1000,500,100,100,1,0,0),[250,0,500,500]);
for(const x of [-1,0,1]){const [sx,sy,w,h]=cropRect(1200,1800,413,531,2,x,x);assert.ok(sx>=0&&sy>=0&&sx+w<=1200&&sy+h<=1800);}
const pixels=new Uint8ClampedArray(5*5*4).fill(255);
// A white centre surrounded by a black ring must survive flood removal.
for(let y=1;y<=3;y++)for(let x=1;x<=3;x++)if(x!==2||y!==2){let i=(y*5+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;}
const image=removeBackdrop({data:pixels,width:5,height:5},[255,255,255],10);
assert.equal(image.data[3],0);assert.equal(image.data[(2*5+2)*4+3],255);assert.equal(image.data[(1*5+1)*4+3],255);
assert.equal(sheetLayout(101.6,152.4,35,45,6).length,6);assert.throws(()=>sheetLayout(101.6,152.4,50.8,50.8,6));
assert.throws(()=>sheetLayout(101.6,152.4,300,300,1));assert.throws(()=>sheetLayout(210,297,35,45,1.5));
for(const p of Object.values(presets)){const slots=sheetLayout(210,297,p[2],p[3],4);assert.ok(slots.every(s=>s.x+p[2]<=205&&s.y+p[3]<=292));}
const html=readFileSync('photo-desk.html','utf8'),d=new JSDOM(html).window.document;
for(const id of ['photo-file','photo-canvas','download-jpg','download-png','download-sheet','target-kb','remove-background','face-strength'])assert.ok(d.getElementById(id));
assert.equal(d.querySelector('#face-strength').value,'0');assert.equal(d.querySelector('#remove-background').checked,false);
assert.doesNotMatch(html,/privacy-controls|adsterra|site\.js/);
assert.match(readFileSync('index.html','utf8'),/href="\/photo-desk.html"/);
console.log('✓ Photo desk: crop bounds, dimensions, connected background mask, print geometry/capacity, safe defaults and ad-free page');
