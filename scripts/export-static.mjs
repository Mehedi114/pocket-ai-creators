// Vercel's static builder serves only public/. API handlers stay in /api and
// are deployed separately as functions. Never publish the repository root.
import {mkdir,rm,readdir,copyFile,lstat,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'public');
const files=[
 'offline.html','assignment-cover.html','remove-background.html','face-retouch.html','photo-desk.html','index.html','admin.html','blog.html','listen.html','studio.html','everyday-tools.html','creator-tools.html',
 'adsterra-banner.html','site.css','site.js','site-config.js','privacy-controls.js',
 'research.js','sw.js','manifest.webmanifest','robots.txt','sitemap.xml',
 'tools/everyday.css','tools/seo.css',
 'assets/models/tiny_face_detector_model-weights_manifest.json','assets/models/tiny_face_detector_model-shard1'
];
const assetTypes=new Set(['.js','.css','.png','.jpg','.jpeg','.webp','.avif','.svg','.ico','.woff','.woff2','.wasm','.txt']);
async function collect(dir,accept){
 for(const entry of await readdir(path.join(root,dir),{withFileTypes:true})){
  if(entry.name.startsWith('.'))continue;
  if(entry.isSymbolicLink())throw new Error('Refusing to publish symbolic link: '+dir+'/'+entry.name);
  const rel=dir+'/'+entry.name;
  if(entry.isDirectory())await collect(rel,accept);
  else if(entry.isFile()&&accept(rel))files.push(rel);
 }
}
await collect('assets',file=>assetTypes.has(path.extname(file)));
await collect('guides',file=>path.extname(file)==='.html');
await collect('tool-guides',file=>path.extname(file)==='.html');
// Validate the allowlisted inputs before touching the generated directory.
for(const file of files){const info=await lstat(path.join(root,file));if(!info.isFile()||info.isSymbolicLink())throw new Error('Invalid public input: '+file);}
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const file of files){const dest=path.join(output,file);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.join(root,file),dest);}
// Include the shared language controller on every public page, not the private
// admin or third-party ad frame. Guides are regenerated before this export.
for(const file of files.filter(f=>f.endsWith('.html')&&!['admin.html','offline.html','adsterra-banner.html','index.html'].includes(f))){
 const target=path.join(output,file);let html=await readFile(target,'utf8');
 if(!html.includes('rel="manifest"'))html=html.replace('</head>','<link rel="manifest" href="/manifest.webmanifest"></head>');
 html=html.replace('</head>','<link rel="stylesheet" href="/assets/pwa-install.css"><script src="/assets/pwa-install.js" defer></script><link rel="stylesheet" href="/assets/language.css?v=2-bengali-script"><script src="/assets/language-data.js?v=4-discovery" defer></script><script src="/assets/language.js?v=2-bengali-script" defer></script><script src="/assets/ui-motion.js?v=1" defer></script></head>');
 await writeFile(target,html);
}
// Ship the homepage's complete styling with its HTML. A failed secondary CSS
// request must not turn the service directory into an unstyled wall of links.
// Source CSS remains shared/editable; only the exported homepage is transformed.
let homepage=await readFile(path.join(output,'index.html'),'utf8');
for(const file of ['site.css','assets/helper-home.css','assets/helper-intro.css','assets/language.css','assets/pwa-install.css']){
 const css=await readFile(path.join(root,file),'utf8');
 if(/<\/style/i.test(css))throw new Error('Unsafe inline stylesheet: '+file);
 const links=homepage.match(/<link\b[^>]*>/g)||[];
 const link=links.find(tag=>tag.includes('rel="stylesheet"')&&new RegExp('href="/'+file.replaceAll('.','\\.')+'(?:\\?[^" ]*)?"').test(tag));
 if(!link)throw new Error('Missing homepage stylesheet: '+file);
 homepage=homepage.replace(link,()=>'<style data-home-style="'+file+'">'+css+'</style>');
}
await writeFile(path.join(output,'index.html'),homepage);
console.log(`Exported ${files.length} browser files to public/. API code, tests, build sources and environment files are excluded.`);
