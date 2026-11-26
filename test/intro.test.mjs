import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const code=readFileSync('assets/helper-intro.js','utf8');
function setup({seen=false,reduce=false,blocked=false,css=true,hash='',failModal=false}={}){
 const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'https://example.com/'+hash,runScripts:'outside-only'}),w=dom.window,d=w.document;
 const timers=new Map();let id=0,change;
 w.setTimeout=(fn,ms)=>{timers.set(++id,{fn,ms});return id;};w.clearTimeout=i=>timers.delete(i);
 w.matchMedia=()=>({matches:reduce,addEventListener:(name,fn)=>{change=fn;},removeEventListener:()=>{change=null;}});
 w.getComputedStyle=()=>({getPropertyValue:()=>css?'1':''});
 w.HTMLDialogElement.prototype.showModal=function(){if(failModal)throw new Error('not supported');this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 if(seen)w.sessionStorage.setItem('ph-intro-seen','1');
 if(blocked)Object.defineProperty(w,'sessionStorage',{get(){throw new Error('blocked');}});
 d.documentElement.style.overflow='auto';w.eval(code);
 return {w,d,timers,change:()=>change?.({matches:true}),close:()=>w.close()};
}
for(const options of [{seen:true},{reduce:true},{blocked:true},{css:false},{hash:'?tool=1'},{hash:'#creator'},{failModal:true}]){
 const {d,close}=setup(options);assert.equal(d.querySelector('#ph-intro'),null);assert.equal(d.documentElement.style.overflow,'auto');close();
}
{
 const {d,w,timers,close}=setup();const intro=d.querySelector('#ph-intro');assert.ok(intro.open);assert.equal(d.documentElement.style.overflow,'hidden');assert.equal(d.activeElement,intro.querySelector('button'));assert.equal(intro.getAttribute('aria-hidden'),null);assert.ok(!intro.querySelector('button').closest('[aria-hidden="true"]'));
 intro.querySelector('button').click();assert.equal(d.querySelector('#ph-intro'),null);assert.equal(timers.size,0);assert.equal(d.documentElement.style.overflow,'auto');assert.equal(d.activeElement,d.querySelector('.header .logo'));assert.equal(w.sessionStorage.getItem('ph-intro-seen'),'1');w.eval(code);assert.equal(d.querySelector('#ph-intro'),null);close();
}
{
 const {d,timers,close}=setup();[...timers.values()].find(t=>t.ms===2050).fn();assert.ok(d.querySelector('#ph-intro').classList.contains('ph-out'));[...timers.values()].find(t=>t.ms===350).fn();assert.equal(d.querySelector('#ph-intro'),null);close();
}
{
 const {d,w,close}=setup();d.querySelector('#ph-intro').dispatchEvent(new w.Event('cancel',{cancelable:true}));assert.equal(d.querySelector('#ph-intro'),null);close();
}
{
 const {d,change,close}=setup();change();assert.equal(d.querySelector('#ph-intro'),null);close();
}
console.log('✓ Intro: session guard, skip/Escape, reduced motion, focus, cleanup, deep links, missing CSS and storage fallback');
