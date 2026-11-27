import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync('listen.html','utf8'),code=readFileSync('assets/listen.js','utf8');
const fixture={id:'test-week',title:'বাংলাদেশ সপ্তাহ',summary:'Reviewed summary',topic:'বাংলাদেশ',weekStart:'2026-11-01',weekEnd:'2026-11-07',published:'2026-11-08',audioUrl:'https://example.org/audio.mp3',reviewed:true,reviewedBy:'Test reviewer',rightsConfirmed:true,sources:[{title:'Source',url:'https://example.org/report'}],transcript:'Text <script>not HTML</script>'};
function setup(records=[]){
 const dom=new JSDOM(html,{url:'https://pocket-helper.vercel.app/listen.html',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};
 let revoked=0;w.URL.createObjectURL=()=> 'blob:local-test';w.URL.revokeObjectURL=()=>revoked++;
 w.POCKET_AUDIO_EPISODES=records;w.eval(code);
 return {w,d,revoked:()=>revoked,close:()=>w.close()};
}
{
 const {d,close}=setup();assert.equal(d.querySelectorAll('.episode-card').length,0);assert.equal(d.querySelector('#episode-empty').hidden,false);assert.equal(d.querySelector('#audio-player').hidden,true);assert.equal(d.querySelector('audio').hasAttribute('src'),false);assert.match(d.querySelector('.learning-note').textContent,/বই পড়া থেকে বিমুখ/);assert.equal(d.querySelector('script[src*="privacy-controls"]'),null);close();
}
{
 const {w,d,close}=setup([fixture,{...fixture,id:'bad',audioUrl:'javascript:alert(1)'},{...fixture,id:'invalid-date',weekStart:'not-a-date'},fixture]);
 assert.equal(d.querySelectorAll('.episode-card').length,1);assert.ok(d.querySelector('#catalog-status').textContent);
 w.localStorage.setItem('pocket_audio_position_test-week','24');d.querySelector('.episode-card button').click();const audio=d.querySelector('audio');assert.equal(audio.src,fixture.audioUrl);assert.equal(audio.autoplay,false);
 Object.defineProperty(audio,'duration',{value:100,configurable:true});audio.dispatchEvent(new w.Event('loadedmetadata'));assert.equal(audio.currentTime,24);
 d.querySelector('#audio-forward').click();assert.equal(audio.currentTime,39);d.querySelector('#audio-back').click();assert.equal(audio.currentTime,24);
 d.querySelector('#audio-speed').value='1.5';d.querySelector('#audio-speed').dispatchEvent(new w.Event('change'));assert.equal(audio.playbackRate,1.5);
 assert.equal(d.querySelector('#episode-notes script'),null);assert.match(d.querySelector('.transcript-text').textContent,/<script>/);
 audio.dispatchEvent(new w.Event('error'));assert.match(d.querySelector('#audio-status').textContent,/চালানো যায়নি/);
 d.querySelector('#close-player').click();assert.equal(d.querySelector('#audio-player').hidden,true);assert.equal(audio.hasAttribute('src'),false);
 d.querySelector('#episode-search').value='missing';d.querySelector('#episode-search').dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.episode-card').length,0);assert.equal(d.querySelector('#episode-empty').hidden,false);close();
}
{
 const {w,d,revoked,close}=setup();const input=d.querySelector('#audio-file');
 Object.defineProperty(input,'files',{value:[new w.File(['test'],'private.mp3',{type:'audio/mpeg'})],configurable:true});input.dispatchEvent(new w.Event('change'));
 assert.equal(d.querySelector('audio').getAttribute('src'),'blob:local-test');assert.match(d.querySelector('#playing-kind').textContent,/NOT PUBLISHED/);assert.match(d.querySelector('#file-status').textContent,/Upload বা publish হয়নি/);
 d.querySelector('#close-player').click();assert.equal(revoked(),1);assert.equal(w.localStorage.length,0);
 Object.defineProperty(input,'files',{value:[new w.File(['test'],'bad.txt',{type:'text/plain'})]});input.dispatchEvent(new w.Event('change'));assert.match(d.querySelector('#file-status').textContent,/audio file/);close();
}
console.log('✓ Audio library: empty state, safe catalog, filtering, sources, resume, seeking, speed, errors and private-only preview');

{const {d,close}=setup([{...fixture,id:'minimal',weekStart:null,weekEnd:null,sources:[],reviewed:false,rightsConfirmed:false,summary:''}]);assert.equal(d.querySelectorAll('.episode-card').length,1);d.querySelector('.episode-card button').click();assert.doesNotMatch(d.querySelector('#episode-notes').textContent,/Reviewed by|null/);close();}
