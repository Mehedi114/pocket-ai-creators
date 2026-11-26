/* Installation is explicit and browser-controlled; never auto-prompt. */
(() => {
 let deferred=null;
 const standalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true;
 const button=document.createElement('button');button.type='button';button.className='pwa-install-button';button.textContent='Install Pocket Helper';button.hidden=standalone();
 const host=document.querySelector('footer')||document.querySelector('header');if(!host)return;host.prepend(button);
 const dialog=document.createElement('dialog');dialog.className='pwa-install-dialog';dialog.setAttribute('aria-labelledby','pwa-heading');
 dialog.innerHTML='<h2 id="pwa-heading">Pocket Helper, on your home screen.</h2><p id="pwa-instructions"></p><p>AI, Creator Login ও online content-এর জন্য internet লাগবে। আগে খোলা কিছু tools offline-এ চলতে পারে; install করলেই সব tool offline হয় না।</p><p id="pwa-message" role="status"></p><div class="pwa-actions"><button type="button" id="pwa-confirm">Install App</button><button type="button" id="pwa-close">Close</button></div>';
 document.body.append(dialog);const install=dialog.querySelector('#pwa-confirm'),info=dialog.querySelector('#pwa-instructions'),message=dialog.querySelector('#pwa-message');
 function explain(){const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);info.textContent=deferred?'Install চাপলে browser-এর confirmation আসবে।':ios?'Safari-তে website খোলো → Share → Add to Home Screen → Add।':'Chrome বা Edge-এ website খুলে browser menu থেকে Install app / Add to Home screen দেখো। In-app browser বা embedded preview হলে নতুন browser tab-এ খোলো।';install.hidden=!deferred;}
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;explain();});
 window.addEventListener('appinstalled',()=>{deferred=null;button.hidden=true;message.textContent='Installed. Home screen থেকে Pocket Helper খুলো।';install.hidden=true;});
 button.onclick=()=>{explain();message.textContent='';if(typeof dialog.showModal==='function')dialog.showModal();else alert(info.textContent);};
 dialog.querySelector('#pwa-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>button.focus());
 install.onclick=async()=>{if(!deferred)return;const prompt=deferred;deferred=null;install.disabled=true;try{await prompt.prompt();const choice=await prompt.userChoice;message.textContent=choice.outcome==='accepted'?'Install request accepted. Browser installation শেষ হতে দাও।':'Install বাতিল করা হয়েছে। পরে browser menu থেকে করতে পারবে।';}catch{message.textContent='Browser menu থেকে install চেষ্টা করো।';}finally{install.disabled=false;explain();}};
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
})();
