import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const dom=new JSDOM('<button><span>Go</span></button><button disabled>Disabled</button>',{runScripts:'outside-only'}),w=dom.window;
let reduce=false,desktop=true,count=0,cancelled=0;
w.matchMedia=q=>({get matches(){return q.includes('reduced-motion')?reduce:desktop;},addEventListener(){}});
w.Element.prototype.animate=function(){count++;return {cancel(){cancelled++;this.oncancel?.();}};};
w.eval(readFileSync('assets/ui-motion.js','utf8'));
function press(el=w.document.querySelector('span'),pointerType='mouse',button=0){const e=new w.MouseEvent('pointerdown',{bubbles:true,cancelable:true,button});Object.defineProperty(e,'pointerType',{value:pointerType});el.dispatchEvent(e);assert.equal(e.defaultPrevented,false);}
press();assert.equal(count,1);press();assert.equal(count,2);assert.equal(cancelled,1);
press(undefined,'touch');press(undefined,'mouse',2);press(w.document.querySelector('[disabled]'));assert.equal(count,2);
reduce=true;press();assert.equal(count,2);reduce=false;desktop=false;press();assert.equal(count,2);
desktop=true;w.document.querySelector('button').dispatchEvent(new w.MouseEvent('click',{bubbles:true,detail:0}));assert.equal(count,3);
w.dispatchEvent(new w.Event('pagehide'));w.close();console.log('✓ Desktop pop: pointer/keyboard, disabled/reduced-motion/touch guards, no prevented clicks, cleanup');
