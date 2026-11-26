import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {adjustLight,softenSpot} from '../tools/retouch-core.js';
const identity={data:new Uint8ClampedArray([15,30,90,128]),width:1,height:1};adjustLight(identity);assert.deepEqual([...identity.data],[15,30,90,128]);
const brighter={data:new Uint8ClampedArray([100,100,100,255]),width:1,height:1};adjustLight(brighter,1);assert.deepEqual([...brighter.data],[200,200,200,255]);
const shadow={data:new Uint8ClampedArray([0,0,0,255,255,255,255,255]),width:2,height:1};adjustLight(shadow,0,80);assert.ok(shadow.data[0]>0);assert.equal(shadow.data[4],255);
const image={data:new Uint8ClampedArray(21*21*4).fill(200),width:21,height:21};for(let i=3;i<image.data.length;i+=4)image.data[i]=255;const centre=(10*21+10)*4;image.data[centre]=image.data[centre+1]=image.data[centre+2]=30;softenSpot(image,10,10,3,.5);assert.equal(image.data[centre],115);assert.equal(image.data[0],200);assert.equal(image.data[centre+3],255);
for(const f of ['remove-background.html','face-retouch.html']){const html=readFileSync(f,'utf8'),dom=new JSDOM(html),d=dom.window.document;assert.ok(d.querySelector('#editor-file'));assert.ok(d.querySelector('#export-png'));assert.ok(d.querySelector('#export-jpg'));assert.ok(d.querySelector('#workspace').hidden);assert.doesNotMatch(html,/privacy-controls|adsterra|site\.js/);if(f.includes('remove')){assert.ok(d.querySelector('#custom-background'));assert.equal(d.querySelectorAll('[data-bg]').length,5);assert.ok(!d.querySelector('#exposure'));}else{assert.ok(d.querySelector('#spot-mode'));assert.ok(d.querySelector('#undo-spot'));assert.equal(d.querySelector('#softness').value,'0');assert.ok(!d.querySelector('#source-colour'));}dom.window.close();}
console.log('✓ Separate editors: adjustment identity/clamping, shadow lift, feathered spot blend, untouched alpha and distinct upload/download controls');
// Preview work is bounded; exports explicitly recompute from the larger source.
const editor=readFileSync('tools/image-workbench.js','utf8');
assert.match(editor,/720\/Math.max/);assert.match(editor,/render\(true\)/);
assert.match(editor,/epoch!==faceEpoch\|\|id!==version/);
assert.match(editor,/requestAnimationFrame\(\(\)=>render\(\)\)/);
const manifest=JSON.parse(readFileSync('assets/models/tiny_face_detector_model-weights_manifest.json','utf8'));
for(const group of manifest){for(const path of group.paths)assert.ok(readFileSync('public/assets/models/'+path).length>0);const bytes=group.weights.reduce((total,w)=>total+w.shape.reduce((a,b)=>a*b,1)*(w.quantization?.dtype==='uint8'?1:4),0);assert.equal(group.paths.reduce((total,p)=>total+readFileSync('assets/models/'+p).length,0),bytes);}
const mobileCSS=readFileSync('assets/image-workbench.css','utf8');assert.match(mobileCSS,/overflow-y:auto/);assert.match(mobileCSS,/100dvh/);
console.log('✓ Mobile retouch: bounded preview, full export path, stale-detection guards and local model weights validated');
