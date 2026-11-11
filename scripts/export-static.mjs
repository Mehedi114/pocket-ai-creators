// Vercel's static builder serves only public/. API handlers stay in /api and
// are deployed separately as functions. Never publish the repository root.
import {mkdir,rm,readdir,copyFile,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'public');
const files=[
 'index.html','studio.html','everyday-tools.html','creator-tools.html',
 'adsterra-banner.html','site.css','site.js','site-config.js','privacy-controls.js',
 'research.js','sw.js','manifest.webmanifest','robots.txt','sitemap.xml',
 'tools/everyday.css','tools/seo.css'
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
console.log(`Exported ${files.length} browser files to public/. API code, tests, build sources and environment files are excluded.`);
